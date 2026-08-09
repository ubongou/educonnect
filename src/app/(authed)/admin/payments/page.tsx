import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TableScroll } from "@/components/ui/TableScroll";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { formatDate } from "@/lib/format";
import {
  NewPlanForm,
  type PlanPayerOption,
  type PlanStudentOption,
} from "@/components/admin/NewPlanForm";
import { PaymentPlanActions } from "@/components/admin/PaymentPlanActions";
import { FilterSelectClient } from "@/components/admin/FilterSelectClient";
import { RunRemindersButton } from "@/components/admin/RunRemindersButton";
import { BANK_DETAILS } from "@/lib/payments/bankDetails";
import {
  formatNaira,
  remainingToDeliver,
  remainingToSchedule,
  studentPaymentStatus,
  tallyPlanUsage,
  usageFor,
  type PlanRow,
  type StudentPaymentStatus,
} from "@/lib/payments/plans";

type PlanRecord = PlanRow & {
  reference_code: string;
  rate_per_session: number;
  subtotal_ngn: number;
  total_ngn: number;
  paid_at: string | null;
  payment_reference: string | null;
  proof_key: string | null;
  proof_uploaded_at: string | null;
  created_at: string;
  archived_at: string | null;
  students: { id: string; full_name: string; preferred_name: string | null } | null;
  payer: { full_name: string | null; email: string | null } | null;
  adjustments: Array<{ label: string; amount_ngn: number }>;
};

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "expiring", label: "Expiring" },
  { value: "unpaid", label: "Unpaid" },
] as const;

const statusTone: Record<StudentPaymentStatus, string> = {
  paid: "border-blue/40 bg-blue/10 text-blue",
  expiring: "border-coral/40 bg-coral/10 text-coral",
  unpaid: "border-g400/40 bg-g100 text-g600",
};

function StatusPill({ status }: { status: StudentPaymentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] ${statusTone[status]}`}
    >
      {status}
    </span>
  );
}

/**
 * Payments hub. Money is naira only and plans are binary — unpaid until the
 * transfer lands, then paid — so this page is a reconciliation surface, not a
 * ledger: who has runway, who is about to run out, and who owes.
 *
 * The status shown against each plan's student is aggregated across all their
 * live plans, so a top-up bought early clears the "expiring" warning rather
 * than leaving two contradictory rows.
 */
export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; status?: string; hidden?: string }>;
}) {
  const sp = await searchParams;
  const studentFilter = sp.student || null;
  const statusFilter = STATUS_FILTERS.some((s) => s.value === sp.status && s.value)
    ? (sp.status as StudentPaymentStatus)
    : null;
  const showHidden = sp.hidden === "1";

  const supabase = await createClient();

  let plansQuery = supabase
    .from("payment_plans")
    .select(
      `
      id, student_id, sessions_total, rate_per_session, subtotal_ngn, total_ngn,
      reference_code, status, paid_at, payment_reference, proof_key,
      proof_uploaded_at, created_at, archived_at,
      students ( id, full_name, preferred_name ),
      payer:profiles!payment_plans_payer_id_fkey ( full_name, email ),
      adjustments:payment_plan_adjustments ( label, amount_ngn )
      `,
    )
    .order("created_at", { ascending: false });

  if (studentFilter) plansQuery = plansQuery.eq("student_id", studentFilter);
  if (!showHidden) plansQuery = plansQuery.is("archived_at", null);

  const [
    { data: planRows },
    sessionResult,
    { data: studentList },
    { data: parentList },
  ] = await Promise.all([
    plansQuery,
    // Every plan-linked session, plus the unfunded ones, so both the usage
    // counters and the "needs attaching" flag come from one read. Paged past
    // PostgREST's max-rows cap — these drive counters, so a silently short
    // read would understate every plan's usage.
    fetchAllRows<{
      payment_plan_id: string | null;
      status: string;
      student_id: string;
    }>((from, to) =>
      supabase
        .from("sessions")
        .select("payment_plan_id, status, student_id")
        .order("id")
        .range(from, to),
    ),
    supabase
      .from("students")
      .select("id, full_name, preferred_name")
      .is("archived_at", null)
      .eq("is_test", false)
      .order("full_name"),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "parent")
      .is("deactivated_at", null)
      .order("full_name"),
  ]);

  const plans = (planRows ?? []) as unknown as PlanRecord[];
  const sessions = sessionResult.rows;

  const usage = tallyPlanUsage(sessions);

  // Which students still have sessions on no plan at all — drives the "Attach
  // sessions" affordance on their paid plans.
  const unfundedByStudent = new Set(
    sessions
      .filter((s) => s.payment_plan_id === null && s.status !== "cancelled")
      .map((s) => s.student_id),
  );

  // Hidden plans are cosmetic-only — a mistaken entry must not still count as
  // runway just because it's off the visible list. Status, counts, and the
  // received-this-month total are always computed from the non-hidden set,
  // even when `showHidden` is bringing archived rows into the table below.
  const activePlans = plans.filter((p) => !p.archived_at);

  // Status is a property of the student, not of one plan, so group first.
  const plansByStudent = new Map<string, PlanRecord[]>();
  for (const p of activePlans) {
    const list = plansByStudent.get(p.student_id) ?? [];
    list.push(p);
    plansByStudent.set(p.student_id, list);
  }
  const statusByStudent = new Map<string, StudentPaymentStatus>();
  for (const [sid, list] of plansByStudent) {
    statusByStudent.set(sid, studentPaymentStatus(list, usage));
  }

  const visible = statusFilter
    ? plans.filter((p) => statusByStudent.get(p.student_id) === statusFilter)
    : plans;

  // Students with no plan at all read as unpaid, and are the whole point of the
  // count — they're the ones who mustn't be scheduled.
  const allStudents = (studentList ?? []) as Array<{
    id: string;
    full_name: string;
    preferred_name: string | null;
  }>;
  const counts = { paid: 0, expiring: 0, unpaid: 0 };
  for (const s of allStudents) {
    counts[statusByStudent.get(s.id) ?? "unpaid"] += 1;
  }

  const receivedThisMonth = activePlans
    .filter(
      (p) =>
        p.status === "paid" &&
        p.paid_at &&
        p.paid_at.slice(0, 7) === new Date().toISOString().slice(0, 7),
    )
    .reduce((sum, p) => sum + Number(p.total_ngn), 0);

  const studentOptions: PlanStudentOption[] = allStudents.map((s) => ({
    id: s.id,
    label: s.preferred_name ?? s.full_name,
  }));
  const payerOptions: PlanPayerOption[] = (
    (parentList ?? []) as Array<{
      id: string;
      full_name: string | null;
      email: string | null;
    }>
  ).map((p) => ({
    id: p.id,
    label: p.full_name
      ? `${p.full_name}${p.email ? ` · ${p.email}` : ""}`
      : (p.email ?? "Unnamed parent"),
  }));

  const filterHref = (patch: {
    student?: string | null;
    status?: string | null;
    hidden?: boolean;
  }) => {
    const params = new URLSearchParams();
    const student = patch.student === undefined ? studentFilter : patch.student;
    const status = patch.status === undefined ? statusFilter : patch.status;
    const hidden = patch.hidden === undefined ? showHidden : patch.hidden;
    if (student) params.set("student", student);
    if (status) params.set("status", status);
    if (hidden) params.set("hidden", "1");
    const q = params.toString();
    return `/admin/payments${q ? `?${q}` : ""}`;
  };

  return (
    <Container>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Admin
          </p>
          <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
            Payments
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            Prepaid session blocks. Transfers land in{" "}
            <span className="font-semibold text-navy">
              {BANK_DETAILS.accountName} · {BANK_DETAILS.bankName} ·{" "}
              {BANK_DETAILS.accountNumber}
            </span>
            .
          </p>
        </div>
        <RunRemindersButton />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Paid" value={counts.paid} hint="Two or more sessions of runway" />
        <StatCard
          label="Expiring"
          value={counts.expiring}
          hint="One session left — renewal due"
          tone="coral"
        />
        <StatCard
          label="Unpaid"
          value={counts.unpaid}
          hint="No paid plan — don't schedule"
        />
        <StatCard
          label="Received this month"
          value={formatNaira(receivedThisMonth)}
          hint="Plans marked paid since the 1st"
        />
      </div>

      <section className="mb-10">
        <details className="group overflow-hidden rounded-2xl border border-line bg-white">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 font-heading text-[13px] font-bold text-navy marker:content-none hover:bg-paper">
            <span>New plan</span>
            <span
              aria-hidden="true"
              className="text-g400 transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="border-t border-line p-5">
            <NewPlanForm students={studentOptions} payers={payerOptions} />
          </div>
        </details>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect
              label="Child"
              value={studentFilter ?? ""}
              options={[
                { value: "", label: "All children" },
                ...studentOptions.map((s) => ({ value: s.id, label: s.label })),
              ]}
              hrefFor={(v) => filterHref({ student: v || null })}
            />
            <FilterSelect
              label="Status"
              value={statusFilter ?? ""}
              options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
              hrefFor={(v) => filterHref({ status: v || null })}
            />
          </div>
          <div className="flex items-end gap-4 pb-2">
            <p className="text-[13px] tabular-nums text-g600">
              {visible.length} plan{visible.length === 1 ? "" : "s"}
            </p>
            <Link
              href={filterHref({ hidden: !showHidden })}
              className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:underline"
            >
              {showHidden ? "Hide hidden plans" : "Show hidden plans"}
            </Link>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-12 text-center">
            <p className="text-[14px] text-g600">
              No plans match these filters. Create one above to bring a child onto
              prepaid sessions.
            </p>
          </div>
        ) : (
          <TableScroll minWidth={1040}>
            <table className="w-full text-[14px]">
              <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                <tr>
                  <th className="px-5 py-3">Child</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Sessions</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Paid</th>
                  <th className="px-5 py-3 text-right">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const u = usageFor(p.id, usage);
                  const toDeliver = remainingToDeliver(p, u);
                  const toSchedule = remainingToSchedule(p, u);
                  const student = p.students;
                  return (
                    <tr
                      key={p.id}
                      className={`border-t border-line align-top ${p.archived_at ? "opacity-50" : ""}`}
                    >
                      <td className="px-5 py-3 text-navy">
                        {student ? (
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="font-heading font-semibold underline-offset-4 hover:underline"
                          >
                            {student.preferred_name ?? student.full_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                        {p.archived_at && (
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-g400">
                            Hidden
                          </p>
                        )}
                        {p.payer?.full_name && (
                          <p className="mt-1 text-[12px] text-g400">
                            paid by {p.payer.full_name}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 font-heading font-bold tabular-nums text-navy">
                        {p.reference_code}
                        {p.proof_key && (
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue">
                            Proof uploaded
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-g600">
                        {p.sessions_total} × {formatNaira(Number(p.rate_per_session))}
                        {p.adjustments.length > 0 && (
                          <ul className="mt-1 flex flex-col gap-[2px]">
                            {p.adjustments.map((a, i) => (
                              <li key={i} className="text-[12px] text-g400">
                                {a.label} {Number(a.amount_ngn) > 0 ? "+" : ""}
                                {formatNaira(Number(a.amount_ngn))}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-g600">
                        <span className="text-navy">{u.delivered}</span> delivered ·{" "}
                        {u.scheduled} booked
                        <p className="mt-1 text-[12px] text-g400">
                          {toDeliver} to teach · {toSchedule} bookable
                        </p>
                      </td>
                      <td className="px-5 py-3 text-right font-heading font-bold tabular-nums text-navy">
                        {formatNaira(Number(p.total_ngn))}
                      </td>
                      <td className="px-5 py-3 text-g600">
                        {p.status === "paid" && p.paid_at ? (
                          <>
                            {formatDate(p.paid_at)}
                            {p.payment_reference && (
                              <p className="mt-1 text-[12px] text-g400">
                                ref {p.payment_reference}
                              </p>
                            )}
                          </>
                        ) : p.status === "void" ? (
                          <span className="text-g400">voided</span>
                        ) : (
                          <span className="font-semibold text-coral">awaiting</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <StatusPill
                          status={statusByStudent.get(p.student_id) ?? "unpaid"}
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <PaymentPlanActions
                          planId={p.id}
                          studentId={p.student_id}
                          status={p.status}
                          hasUnfundedSessions={unfundedByStudent.has(p.student_id)}
                          archived={Boolean(p.archived_at)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </section>
    </Container>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint: string;
  tone?: "coral";
}) {
  return (
    <div className="rounded-[28px] border border-line bg-white p-6">
      <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
        {label}
      </p>
      <p
        className={`mt-2 font-heading text-[32px] font-semibold leading-none tabular-nums ${
          tone === "coral" ? "text-coral" : "text-navy"
        }`}
      >
        {value}
      </p>
      <p className="mt-3 text-[12px] leading-[1.5] text-g600">{hint}</p>
    </div>
  );
}

/**
 * A dropdown that navigates on change. Server-rendered filters keep the page a
 * plain server component; this is the smallest possible client island to drive
 * them.
 */
function FilterSelect({
  label,
  value,
  options,
  hrefFor,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  hrefFor: (value: string) => string;
}) {
  return (
    <FilterSelectClient
      label={label}
      value={value}
      options={options.map((o) => ({ ...o, href: hrefFor(o.value) }))}
    />
  );
}
