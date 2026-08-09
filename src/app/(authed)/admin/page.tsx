import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { loadPaymentOverview } from "@/lib/payments/overview";
import { formatNaira } from "@/lib/payments/plans";

type StatCard = {
  label: string;
  value: number | string;
  href: string;
  hint: string;
  tone?: "coral";
};

const attentionTone: Record<"unpaid" | "expiring", string> = {
  unpaid: "border-g400/40 bg-g100 text-g600",
  expiring: "border-coral/40 bg-coral/10 text-coral",
};

export default async function AdminOverview() {
  const supabase = await createClient();

  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
  const sevenDaysAgo = sevenDaysAgoDate.toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const weekAhead = in7Days.toISOString().slice(0, 10);

  const [students, pendingEnrollments, recentReports, upcomingWeek, overview] =
    await Promise.all([
      // Active, real students only — exclude archived (soft-deleted) and test accounts.
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .is("archived_at", null)
        .eq("is_test", false),
      supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("lesson_reports")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled")
        .gte("session_date", today)
        .lte("session_date", weekAhead),
      loadPaymentOverview(supabase),
    ]);

  const cards: StatCard[] = [
    {
      label: "Unpaid",
      value: overview.counts.unpaid,
      href: "/admin/payments?status=unpaid",
      hint: "No paid plan with runway — don't schedule",
      tone: "coral",
    },
    {
      label: "Expiring",
      value: overview.counts.expiring,
      href: "/admin/payments?status=expiring",
      hint: "One session of runway left — renewal due",
      tone: "coral",
    },
    {
      label: "Received this month",
      value: formatNaira(overview.receivedThisMonth),
      href: "/admin/payments",
      hint: "Plans marked paid since the 1st",
    },
    {
      label: "Students",
      value: students.count ?? 0,
      href: "/admin/students",
      hint: "View every student and their intake",
    },
    {
      label: "Pending enrollments",
      value: pendingEnrollments.count ?? 0,
      href: "/admin/enrollments",
      hint: "Parent-submitted subject requests awaiting review",
    },
    {
      label: "Sessions · next 7 days",
      value: upcomingWeek.count ?? 0,
      href: "/admin/sessions?range=week",
      hint: "Scheduled lessons coming up this week",
    },
    {
      label: "Reports · last 7 days",
      value: recentReports.count ?? 0,
      href: "/admin/reports",
      hint: "Lesson reports submitted in the past week",
    },
  ];

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">Overview</h1>
        <p className="mt-2 text-[14px] text-g600">
          At-a-glance activity across payments, students, enrollment requests, and
          recent reports.
        </p>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex flex-col rounded-[28px] border border-line bg-white p-7 transition-colors hover:border-navy"
          >
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              {c.label}
            </p>
            <p
              className={`mt-2 font-heading text-[40px] font-semibold leading-none tabular-nums ${
                c.tone === "coral" && Number(c.value) > 0 ? "text-coral" : "text-navy"
              }`}
            >
              {c.value}
            </p>
            <p className="mt-4 text-[13px] leading-[1.5] text-g600">{c.hint}</p>
            <span className="mt-5 inline-flex items-center gap-2 font-heading text-[13px] font-bold text-blue">
              View
              <svg
                viewBox="0 0 16 16"
                className="h-3 w-3 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path
                  d="M4 8h8M8 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
            Needs attention
          </h2>
          {overview.attentionTotal > overview.attention.length && (
            <Link
              href="/admin/payments?status=unpaid"
              className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
            >
              View all {overview.attentionTotal} →
            </Link>
          )}
        </div>

        {overview.attention.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-8 text-center">
            <p className="text-[14px] text-g600">
              Every student has runway. Nobody needs chasing right now.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-line bg-white">
            <ul className="divide-y divide-line">
              {overview.attention.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-6 py-4">
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="font-heading text-[14px] font-semibold text-navy underline-offset-4 hover:underline"
                  >
                    {s.name}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-pill border px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] ${attentionTone[s.status as "unpaid" | "expiring"]}`}
                    >
                      {s.status}
                    </span>
                    <Link
                      href={`/admin/payments?student=${s.id}`}
                      className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                    >
                      Payments →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </Container>
  );
}
