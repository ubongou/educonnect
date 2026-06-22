import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  lesson_report_id: string | null;
  students: { id: string; full_name: string; preferred_name: string | null } | null;
  subjects: { name: string } | null;
};

type Filter = "upcoming" | "needs" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "needs", label: "Needs report" },
  { id: "all", label: "All" },
];

const toneByStatus: Record<string, "blue" | "gray" | "coral" | "green"> = {
  scheduled: "blue",
  completed: "green",
  cancelled: "gray",
  no_show: "coral",
};

// Sessions are scheduled by date only — group and label by calendar day, never
// by time of day.
function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function groupByDay(rows: SessionRow[]): Map<string, SessionRow[]> {
  const out = new Map<string, SessionRow[]>();
  for (const r of rows) {
    const key = dayKey(r.scheduled_at);
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push(r);
  }
  return out;
}

/**
 * The teacher Sessions hub — one list that replaces the old split between
 * "Sessions" (the report composer) and "Schedule" (the calendar). Every row is
 * the single entry point to its report: write it when due, view it once filed.
 * The composer lives at /teacher/sessions/[id].
 */
export default async function TeacherSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const profile = await requireTeacher();
  const { filter: filterRaw } = await searchParams;
  const filter: Filter =
    filterRaw === "needs" || filterRaw === "all" ? filterRaw : "upcoming";

  const supabase = await createClient();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  // Bound the window so the list stays cheap, but reach back far enough to
  // catch recently-completed sessions still awaiting a write-up.
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from("sessions")
    .select(
      `
      id, scheduled_at, duration_minutes, status, lesson_report_id,
      students ( id, full_name, preferred_name ),
      subjects ( name )
      `,
    )
    .eq("teacher_id", profile.id)
    .gte("scheduled_at", sixtyDaysAgo.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(200);

  const allRows = (data ?? []) as unknown as SessionRow[];

  const needsReport = (s: SessionRow) =>
    s.lesson_report_id === null && s.status !== "cancelled";
  const isPastOrToday = (s: SessionRow) =>
    new Date(s.scheduled_at) < startOfTomorrow;
  const reportDue = (s: SessionRow) => needsReport(s) && isPastOrToday(s);

  const dueCount = allRows.filter(reportDue).length;

  let rows: SessionRow[];
  if (filter === "upcoming") {
    // Soonest first.
    rows = allRows.filter((s) => new Date(s.scheduled_at) >= startOfToday);
  } else if (filter === "needs") {
    // Most recent first — the latest unwritten lesson sits at the top.
    rows = allRows.filter(reportDue).reverse();
  } else {
    rows = allRows.slice().reverse();
  }

  const grouped = groupByDay(rows);

  const emptyCopy: Record<Filter, string> = {
    upcoming: "No upcoming sessions on your calendar.",
    needs: "Nothing waiting for a report. You're all caught up.",
    all: "No sessions yet. Admins schedule your sessions here.",
  };

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Teacher
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Sessions
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Your sessions and their reports in one place. Admins set the schedule —
          reach out if something needs to change.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <Link
              key={f.id}
              href={`/teacher/sessions?filter=${f.id}`}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-pill border px-4 py-[7px] font-heading text-[13px] font-semibold transition-colors ${
                active
                  ? "border-navy bg-navy text-yellow"
                  : "border-navy/20 bg-white text-navy hover:bg-paper"
              }`}
            >
              {f.label}
              {f.id === "needs" && dueCount > 0 && (
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-[11px] font-bold tabular-nums ${
                    active ? "bg-yellow text-navy" : "bg-coral text-white"
                  }`}
                >
                  {dueCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line bg-white p-10 text-center">
          <p className="text-[14px] text-g600">{emptyCopy[filter]}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(grouped.entries()).map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
                {day}
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((s) => {
                  const displayName =
                    s.students?.preferred_name ??
                    s.students?.full_name ??
                    "Unknown";
                  const tone = toneByStatus[s.status] ?? "blue";
                  const due = reportDue(s);
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-line bg-white px-5 py-4"
                    >
                      <div>
                        <p className="font-heading text-[15px] font-semibold text-navy">
                          {displayName} · {s.subjects?.name ?? "Subject"}
                        </p>
                        <p className="mt-1 text-[12px] text-g400">
                          {s.duration_minutes} min
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {due ? (
                          <Link
                            href={`/teacher/sessions/${s.id}`}
                            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                          >
                            Write report →
                          </Link>
                        ) : (
                          s.lesson_report_id && (
                            <Link
                              href={`/teacher/reports/${s.lesson_report_id}`}
                              className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                            >
                              View report →
                            </Link>
                          )
                        )}
                        <StatusBadge tone={tone}>
                          {s.status.replace("_", " ")}
                        </StatusBadge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
