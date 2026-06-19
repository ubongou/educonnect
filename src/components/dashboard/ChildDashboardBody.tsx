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

export function subjectLabel(slug: SubjectSlug): string {
  return slug === "mathematics"
    ? "Mathematics"
    : slug === "english"
      ? "English"
      : "Science";
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
  scheduled_at: string;
  subjects: { name: string } | null;
};

function averageSkill(ratings: Array<{ rating: number }>): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

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
  selectedSubject,
  subjectHref,
  variant,
}: {
  studentId: string;
  childDisplayName: string;
  childRegistrationNumber: string;
  selectedSubject: SubjectSlug;
  /** Builds the href for a subject sub-tab (differs parent vs admin). */
  subjectHref: (slug: SubjectSlug) => string;
  variant: "parent" | "admin";
}) {
  const supabase = await createClient();

  const [{ data: reports }, { data: upcoming }] = await Promise.all([
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
      .order("lesson_date", { ascending: true })
      .limit(60),
    supabase
      .from("sessions")
      .select("scheduled_at, subjects ( name )")
      .eq("student_id", studentId)
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1),
  ]);

  const reportRows = (reports ?? []) as unknown as ReportRow[];

  // Confidence line chart — last 6 reports, raw 1–10 scale.
  const lastReportsForConfidence = reportRows.slice(-6);
  const confidenceChart = {
    points: lastReportsForConfidence.map((r) => r.confidence_level),
    xLabels: lastReportsForConfidence.map((r) =>
      new Date(r.lesson_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    ),
  };

  // Skill chart — average rating per report, filtered to selected subject, last 6.
  const subjectReports = reportRows.filter(
    (r) => r.subjects?.slug === selectedSubject,
  );
  const lastSkillReports = subjectReports.slice(-6);
  const skillChart = {
    points: lastSkillReports.map((r) => averageSkill(r.skill_ratings)),
    xLabels: lastSkillReports.map((r) =>
      new Date(r.lesson_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    ),
  };

  const latest = reportRows.at(-1);
  const next = (upcoming ?? [])[0] as UpcomingSession | undefined;

  return (
    <>
      {/* Confidence over time */}
      <section className="mb-6 rounded-[28px] border border-line bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-[15px] font-semibold text-navy">
            Confidence progression
          </h2>
          {latest && (
            <StatusBadge tone={confidenceBadge(latest.confidence_level).tone}>
              {confidenceBadge(latest.confidence_level).label}
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

      {/* Skill chart with subject subtabs */}
      <section className="mb-10 rounded-[28px] border border-line bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-[15px] font-semibold text-navy">
            Average skill level progression
          </h2>
          <div className="flex items-center gap-2">
            {SUBJECT_SLUGS.map((slug) => {
              const active = slug === selectedSubject;
              return (
                <Link
                  key={slug}
                  href={subjectHref(slug)}
                  className={`inline-flex items-center rounded-pill border px-4 py-[4px] font-heading text-[12px] font-semibold transition-colors ${
                    active
                      ? "border-navy bg-navy text-yellow"
                      : "border-navy/20 bg-white text-navy hover:bg-paper"
                  }`}
                >
                  {subjectLabel(slug)}
                </Link>
              );
            })}
          </div>
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
            caption={`Average across all ${subjectLabel(selectedSubject)} skills, last 6 sessions`}
          />
        )}
      </section>

      {/* Latest lesson + behaviours (side-by-side on desktop) */}
      <section className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <LatestLessonCard
          childId={variant === "parent" ? studentId : undefined}
          reportHref={
            variant === "admin" && latest ? `/admin/reports/${latest.id}` : undefined
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
              ? `${new Date(next.scheduled_at).toLocaleString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
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
