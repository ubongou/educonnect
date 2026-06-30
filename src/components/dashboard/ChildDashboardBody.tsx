import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LineChart } from "@/components/ui/LineChart";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LatestLessonCard } from "@/components/dashboard/LatestLessonCard";
import { BehavioursCard } from "@/components/dashboard/BehavioursCard";
import { createClient } from "@/lib/supabase/server";
import { confidenceBadge } from "@/lib/scales";
import { formatDate } from "@/lib/format";

export const SUBJECT_SLUGS = ["mathematics", "english", "science"] as const;
export type SubjectSlug = (typeof SUBJECT_SLUGS)[number];

export function isSubjectSlug(v: string | undefined): v is SubjectSlug {
  return v === "mathematics" || v === "english" || v === "science";
}

type ReportRow = {
  id: string;
  lesson_date: string;
  lesson_focus: string;
  confidence_level: number;
  understanding_check: number;
  participation: number;
  focus_rating: number;
  homework: number;
  how_to_help_at_home: string | null;
  lesson_highlights: string | null;
  subjects: { slug: string; name: string } | null;
  uploader: { full_name: string | null } | null;
  skill_ratings: Array<{ rating: number }>;
};

type UpcomingSession = {
  session_date: string;
  subjects: { name: string } | null;
};

type EnrollmentSubjectRow = {
  status: string;
  subjects: { slug: string; name: string } | null;
};

function averageSkill(ratings: Array<{ rating: number }>): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

// How many recent reports the progression charts plot. A rolling window —
// 12 shows more of the trend while staying legible (and tappable) down to
// phone width. The x-axis dates are angled in LineChart so they don't collide
// at this density. Applied to both the confidence and skill charts.
const CHART_POINTS = 12;

/**
 * The per-child body of the parent dashboard: confidence progression, average
 * skill progression (with subject sub-tabs), and the latest-lesson + behaviours
 * cards. Shared so the admin student page can render exactly what the parent
 * sees. `variant` adapts parent-only affordances (the "see more" report link and
 * the request-a-subject CTA). Admins read any child via RLS; parents are scoped
 * to their own children by the page that renders this.
 */
export async function ChildDashboardBody({
  studentId,
  childDisplayName,
  childRegistrationNumber,
  requestedSubject,
  subjectHref,
  variant,
}: {
  studentId: string;
  childDisplayName: string;
  childRegistrationNumber: string;
  /**
   * Raw `?subject=` slug from the URL, if any. The body resolves the actual
   * selection itself: it validates this against the student's own subjects and
   * otherwise falls back to the first subject that has report data, so a child
   * never opens on an empty chart for a subject they aren't studying.
   */
  requestedSubject?: string;
  /** Builds the href for a subject pill (differs per portal). */
  subjectHref: (slug: SubjectSlug) => string;
  /** Drives report-link targets and which parent-only affordances show. */
  variant: "parent" | "admin" | "teacher";
}) {
  const supabase = await createClient();

  const [{ data: reports }, { data: upcoming }, { data: enrollmentRows }] =
    await Promise.all([
      supabase
        .from("lesson_reports")
        .select(
          `
          id, lesson_date, lesson_focus, confidence_level, understanding_check,
          participation, focus_rating, homework,
          how_to_help_at_home, lesson_highlights,
          subjects ( slug, name ),
          uploader:profiles!lesson_reports_uploaded_by_fkey ( full_name ),
          skill_ratings:lesson_report_skill_ratings ( rating )
          `,
        )
        .eq("student_id", studentId)
        .is("deleted_at", null)
        .order("lesson_date", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(60),
      supabase
        .from("sessions")
        .select("session_date, subjects ( name )")
        .eq("student_id", studentId)
        .eq("status", "scheduled")
        .gte("session_date", new Date().toISOString().slice(0, 10))
        .order("session_date", { ascending: true })
        .limit(1),
      supabase
        .from("enrollments")
        .select("status, subjects ( slug, name )")
        .eq("student_id", studentId),
    ]);

  const reportRows = (reports ?? []) as unknown as ReportRow[];

  // Which subjects already have report data (canonical slugs only).
  const subjectsWithData = new Set<SubjectSlug>();
  for (const r of reportRows) {
    const slug = r.subjects?.slug;
    if (slug && isSubjectSlug(slug)) subjectsWithData.add(slug);
  }

  // The subject pills. Source = this student's approved enrollments UNION any
  // subject that already has reports (so data is never hidden). RLS has already
  // scoped `enrollmentRows` to what the viewer may see — a parent sees their
  // child's subjects, an admin sees all, a teacher sees only the ones they
  // teach — so the same component renders the correct set in every portal.
  const nameBySlug = new Map<SubjectSlug, string>();
  for (const e of (enrollmentRows ?? []) as unknown as EnrollmentSubjectRow[]) {
    const slug = e.subjects?.slug;
    const name = e.subjects?.name;
    if (slug && name && isSubjectSlug(slug) && e.status === "approved") {
      if (!nameBySlug.has(slug)) nameBySlug.set(slug, name);
    }
  }
  for (const r of reportRows) {
    const slug = r.subjects?.slug;
    const name = r.subjects?.name;
    if (slug && name && isSubjectSlug(slug) && !nameBySlug.has(slug)) {
      nameBySlug.set(slug, name);
    }
  }
  const subjects = SUBJECT_SLUGS.filter((s) => nameBySlug.has(s)).map((s) => ({
    slug: s,
    name: nameBySlug.get(s)!,
  }));

  // Resolve the active subject. An explicit, valid `?subject=` wins; otherwise
  // default to the first subject that actually has data (so the charts open
  // populated), then to the first subject, then nothing.
  const requestedValid =
    isSubjectSlug(requestedSubject) &&
    subjects.some((s) => s.slug === requestedSubject)
      ? requestedSubject
      : undefined;
  const selectedSubject: SubjectSlug | null =
    requestedValid ??
    subjects.find((s) => subjectsWithData.has(s.slug))?.slug ??
    subjects[0]?.slug ??
    null;
  const selectedName =
    subjects.find((s) => s.slug === selectedSubject)?.name ?? "";

  // Both charts share one subject-scoped slice, so the confidence line and the
  // skill line always describe the same subject as the selector above them.
  const selectedReports = selectedSubject
    ? reportRows.filter((r) => r.subjects?.slug === selectedSubject)
    : [];
  const chartReports = selectedReports.slice(-CHART_POINTS);
  const xLabels = chartReports.map((r) =>
    new Date(r.lesson_date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
  );
  const confidenceChart = {
    points: chartReports.map((r) => r.confidence_level),
    xLabels,
  };
  const skillChart = {
    points: chartReports.map((r) => averageSkill(r.skill_ratings)),
    xLabels,
  };

  // Confidence badge reflects the latest report *within the selected subject*,
  // so it agrees with the chart beside it. The latest-lesson card below stays
  // the most recent lesson overall.
  const latestInSubject = selectedReports.at(-1);
  const latest = reportRows.at(-1);
  const next = (upcoming ?? [])[0] as UpcomingSession | undefined;

  return (
    <>
      {/* Shared subject selector — governs both charts below. */}
      {subjects.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
            Subject
          </span>
          <nav
            aria-label="Select subject"
            className="flex flex-wrap items-center gap-2"
          >
            {subjects.map((s) => {
              const active = s.slug === selectedSubject;
              return (
                <Link
                  key={s.slug}
                  href={subjectHref(s.slug)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center rounded-pill border px-4 py-[7px] font-heading text-[13px] font-semibold transition-colors ${
                    active
                      ? "border-navy bg-navy text-yellow"
                      : "border-navy/20 bg-white text-navy hover:bg-paper"
                  }`}
                >
                  {s.name}
                </Link>
              );
            })}
          </nav>
          <span className="text-[12px] text-g600">
            Applies to the confidence and skill charts below
          </span>
        </div>
      )}

      {/* Confidence over time */}
      <section className="mb-6 rounded-[28px] border border-line bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-[15px] font-semibold text-navy">
            Confidence progression
          </h2>
          {latestInSubject && (
            <StatusBadge
              tone={confidenceBadge(latestInSubject.confidence_level).tone}
            >
              {confidenceBadge(latestInSubject.confidence_level).label}
            </StatusBadge>
          )}
        </div>
        {confidenceChart.points.length === 0 ? (
          <p className="text-[14px] text-g600">
            No confidence data yet — it appears after the first lesson report.
          </p>
        ) : (
          <LineChart
            series={[
              {
                label: "Confidence",
                color: "var(--color-coral)",
                points: confidenceChart.points,
              },
            ]}
            xLabels={confidenceChart.xLabels}
            yLabels={["0", "2", "4", "6", "8", "10"]}
            yMin={0}
            yMax={10}
            yAxisWidth={32}
            height={120}
          />
        )}
      </section>

      {/* Skill chart — subject controlled by the shared selector above. */}
      <section className="mb-10 rounded-[28px] border border-line bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-[15px] font-semibold text-navy">
            Average skill level progression
          </h2>
        </div>
        {skillChart.points.every((p) => p === null) ? (
          <p className="text-[14px] text-g600">
            No skill data yet for this subject — it appears after the first lesson
            report that includes skill ratings.
          </p>
        ) : (
          <LineChart
            series={[
              {
                label: "Average skill score",
                color: "var(--color-blue)",
                points: skillChart.points,
              },
            ]}
            xLabels={skillChart.xLabels}
            yLabels={["0", "2", "4", "6", "8", "10"]}
            yMin={0}
            yMax={10}
            yAxisWidth={32}
            height={120}
            caption={`Average across all ${selectedName} skills, last ${CHART_POINTS} sessions`}
          />
        )}
      </section>

      {/* Latest lesson + behaviours (side-by-side on desktop) */}
      <section className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <LatestLessonCard
          childId={variant === "parent" ? studentId : undefined}
          reportHref={
            latest && variant === "admin"
              ? `/admin/reports/${latest.id}`
              : latest && variant === "teacher"
                ? `/teacher/reports/${latest.id}`
                : undefined
          }
          lesson={
            latest
              ? {
                  id: latest.id,
                  lesson_date: latest.lesson_date,
                  lesson_focus: latest.lesson_focus,
                  understanding_check: latest.understanding_check,
                  confidence_level: latest.confidence_level,
                  how_to_help_at_home: latest.how_to_help_at_home,
                  subjects: latest.subjects,
                  uploaded_by_name: latest.uploader?.full_name ?? null,
                }
              : null
          }
          nextSessionLabel={
            next
              ? `${new Date(next.session_date).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}${next.subjects?.name ? ` · ${next.subjects.name}` : ""}`
              : null
          }
        />
        <BehavioursCard
          participation={latest?.participation ?? null}
          focusRating={latest?.focus_rating ?? null}
          homework={latest?.homework ?? null}
          note={latest?.lesson_highlights ?? null}
        />
      </section>

      {variant === "parent" && (
        <section className="mt-10 rounded-[28px] border border-dashed border-line bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-[15px] font-semibold text-navy">
                Want {childDisplayName} to study another subject?
              </h3>
              <p className="mt-1 text-[13px] text-g600">
                Request enrollment and our admin team will match a teacher.
              </p>
            </div>
            <Button href={`/dashboard/children/${studentId}/enroll`} variant="outline">
              Request a subject
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-g400">
            Reg no {childRegistrationNumber}
            {latest && ` · last report ${formatDate(latest.lesson_date)}`}
          </p>
        </section>
      )}
    </>
  );
}
