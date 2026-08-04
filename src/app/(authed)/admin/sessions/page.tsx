import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import {
  SessionScheduler,
  type SchedulableEnrollment,
} from "@/components/admin/SessionScheduler";
import { RecurringSessionForm } from "@/components/admin/RecurringSessionForm";
import { SessionFilters, type FilterOption } from "@/components/admin/SessionFilters";
import {
  SessionsTable,
  type AdminSessionRow,
} from "@/components/admin/SessionsTable";
import type { SessionTeacherOption } from "@/components/admin/SessionRowActions";
import {
  ascendingFor,
  dateRangeFor,
  pageRange,
  parseSessionFilters,
  sessionFiltersToQuery,
  SESSION_PAGE_SIZE,
  totalPages,
} from "@/lib/sessions/filters";

/**
 * The admin sessions hub — replaces the old /admin/schedule, which only ever
 * rendered the next 60 upcoming rows with no filters and no way to reach the
 * rest. Here the list is the main event: dropdown-filtered, paginated, and
 * honest about its totals.
 *
 * The scheduling forms are still here, collapsed into disclosure panels so they
 * don't push the list below the fold.
 */
export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    student?: string;
    teacher?: string;
    subject?: string;
    status?: string;
    range?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const filters = parseSessionFilters(sp);
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const bounds = dateRangeFor(filters.range, today);
  const [rangeStart, rangeEnd] = pageRange(filters.page);

  let query = supabase
    .from("sessions")
    .select(
      `
      id, session_date, duration_minutes, status, lesson_report_id,
      students ( id, full_name, preferred_name ),
      subjects ( name ),
      teacher:profiles!sessions_teacher_id_fkey ( id, full_name )
      `,
      { count: "exact" },
    );

  if (bounds.from) query = query.gte("session_date", bounds.from);
  if (bounds.to) query = query.lte("session_date", bounds.to);
  if (filters.student) query = query.eq("student_id", filters.student);
  if (filters.teacher) query = query.eq("teacher_id", filters.teacher);
  if (filters.subject) query = query.eq("subject_id", filters.subject);
  if (filters.status) query = query.eq("status", filters.status);

  const [
    { data: sessions, count },
    { data: schedulable },
    { data: teacherList },
    { data: studentList },
    { data: subjectList },
  ] = await Promise.all([
    query
      .order("session_date", { ascending: ascendingFor(filters.range) })
      .range(rangeStart, rangeEnd),
    supabase
      .from("enrollments")
      .select(
        `
        id, teacher_id,
        students ( full_name, preferred_name ),
        subjects ( name ),
        teacher:profiles!enrollments_teacher_id_fkey ( full_name )
        `,
      )
      .eq("status", "approved")
      .not("teacher_id", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "teacher")
      .is("deactivated_at", null)
      .order("full_name"),
    supabase
      .from("students")
      .select("id, full_name, preferred_name")
      .is("archived_at", null)
      .order("full_name"),
    supabase.from("subjects").select("id, name").eq("is_archived", false).order("name"),
  ]);

  const teacherOptions: SessionTeacherOption[] = (teacherList ?? []).map((t) => ({
    id: t.id,
    name: t.full_name ?? "Unnamed teacher",
  }));

  const studentOptions: FilterOption[] = (
    (studentList ?? []) as Array<{
      id: string;
      full_name: string;
      preferred_name: string | null;
    }>
  ).map((s) => ({ id: s.id, label: s.preferred_name ?? s.full_name }));

  const subjectOptions: FilterOption[] = (
    (subjectList ?? []) as Array<{ id: string; name: string }>
  ).map((s) => ({ id: s.id, label: s.name }));

  const rows = (sessions ?? []) as unknown as AdminSessionRow[];
  const total = count ?? 0;
  const pages = totalPages(total);
  const firstRow = total === 0 ? 0 : (filters.page - 1) * SESSION_PAGE_SIZE + 1;
  const lastRow = Math.min(filters.page * SESSION_PAGE_SIZE, total);

  const schedulableRows: SchedulableEnrollment[] = (schedulable ?? []).map(
    (e: unknown) => {
      const row = e as {
        id: string;
        students: { full_name: string; preferred_name: string | null } | null;
        subjects: { name: string } | null;
        teacher: { full_name: string | null } | null;
      };
      return {
        id: row.id,
        student_name:
          row.students?.preferred_name ?? row.students?.full_name ?? "Unknown student",
        subject_name: row.subjects?.name ?? "Subject",
        teacher_name: row.teacher?.full_name ?? "Unassigned",
      };
    },
  );

  const pageHref = (page: number) =>
    `/admin/sessions${sessionFiltersToQuery({ ...filters, page })}`;

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Sessions
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Every session ever scheduled. Filter, edit, reschedule, or remove them
          — in bulk where it helps.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-3">
        <Panel title="Schedule a session">
          <SessionScheduler enrollments={schedulableRows} />
        </Panel>
        <Panel title="Schedule a recurring run">
          <RecurringSessionForm enrollments={schedulableRows} />
        </Panel>
        <p className="text-[13px] text-g600">
          Bulk-adding lessons that already happened, each with a full report?
          That&apos;s the{" "}
          <Link
            href="/admin/sessions/import"
            className="font-semibold text-blue underline-offset-4 hover:underline"
          >
            import page
          </Link>
          .
        </p>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <SessionFilters
            state={filters}
            students={studentOptions}
            teachers={teacherOptions.map((t) => ({ id: t.id, label: t.name }))}
            subjects={subjectOptions}
          />
          <p className="pb-3 text-[13px] tabular-nums text-g600">
            {total === 0
              ? "No sessions"
              : `Showing ${firstRow}–${lastRow} of ${total}`}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-12 text-center">
            <p className="text-[14px] text-g600">
              No sessions match these filters.
            </p>
          </div>
        ) : (
          <>
            <SessionsTable rows={rows} teachers={teacherOptions} />
            {pages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-5 flex items-center justify-center gap-3"
              >
                <PageLink
                  href={pageHref(filters.page - 1)}
                  disabled={filters.page <= 1}
                >
                  ← Previous
                </PageLink>
                <span className="font-heading text-[13px] font-semibold tabular-nums text-g600">
                  Page {filters.page} of {pages}
                </span>
                <PageLink
                  href={pageHref(filters.page + 1)}
                  disabled={filters.page >= pages}
                >
                  Next →
                </PageLink>
              </nav>
            )}
          </>
        )}
      </section>
    </Container>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-line bg-white">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 font-heading text-[13px] font-bold text-navy marker:content-none hover:bg-paper">
        <span>{title}</span>
        <span
          aria-hidden="true"
          className="text-g400 transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="border-t border-line p-5">{children}</div>
    </details>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-pill border border-line px-4 py-2 font-heading text-[13px] font-semibold text-g400">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-pill border border-navy px-4 py-2 font-heading text-[13px] font-semibold text-navy transition-colors hover:bg-navy hover:text-yellow"
    >
      {children}
    </Link>
  );
}
