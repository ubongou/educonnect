import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ChildTabs, type ChildTabOption } from "@/components/dashboard/ChildTabs";
import {
  LessonReportView,
  type LessonReportViewData,
} from "@/components/dashboard/LessonReportView";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { getParentChildren, pickChild, childTabColor } from "@/lib/dashboard/children";
import { confidenceBadge } from "@/lib/scales";
import { formatDate } from "@/lib/format";

type ReportListRow = {
  id: string;
  lesson_date: string;
  lesson_focus: string;
  confidence_level: number;
  subjects: { slug: string; name: string } | null;
};

type FullReport = {
  id: string;
  lesson_date: string;
  duration_minutes: number;
  lesson_focus: string;
  understanding_check: number;
  confidence_level: number;
  lesson_highlights: string | null;
  participation: number;
  focus_rating: number;
  homework: number;
  next_focus: string | null;
  how_to_help_at_home: string | null;
  subjects: { name: string } | null;
  uploader: { full_name: string | null } | null;
  skill_ratings: Array<{
    rating: number;
    skill: { name: string } | null;
  }>;
};

export default async function DashboardSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; report?: string }>;
}) {
  const { child: childIdRaw, report: reportIdRaw } = await searchParams;
  const { children } = await getParentChildren("/dashboard/sessions");
  const selected = pickChild(children, childIdRaw);

  if (!selected) {
    return (
      <Container>
        <p className="text-[14px] text-g600">Add a child first to view sessions.</p>
      </Container>
    );
  }

  const supabase = await createClient();

  const { data: reportList } = await supabase
    .from("lesson_reports")
    .select(
      `
      id, lesson_date, lesson_focus, confidence_level,
      subjects ( slug, name )
      `,
    )
    .eq("student_id", selected.id)
    .order("lesson_date", { ascending: false });

  const reports = (reportList ?? []) as unknown as ReportListRow[];
  const activeId = reportIdRaw ?? reports[0]?.id ?? null;

  const { data: activeReport } = activeId
    ? await supabase
        .from("lesson_reports")
        .select(
          `
          id, lesson_date, duration_minutes, lesson_focus,
          understanding_check, confidence_level, lesson_highlights,
          participation, focus_rating, homework,
          next_focus, how_to_help_at_home,
          subjects ( name ),
          uploader:profiles!lesson_reports_uploaded_by_fkey ( full_name ),
          skill_ratings:lesson_report_skill_ratings (
            rating,
            skill:subject_skills ( name )
          )
          `,
        )
        .eq("id", activeId)
        .eq("student_id", selected.id)
        .maybeSingle()
    : { data: null };

  const childOptions: ChildTabOption[] = children.map((c, i) => ({
    id: c.id,
    label: c.preferred_name ?? c.full_name,
    dotColor: childTabColor(i),
  }));

  const full = activeReport as FullReport | null;
  const view: LessonReportViewData | null = full
    ? {
        id: full.id,
        lesson_date: full.lesson_date,
        duration_minutes: full.duration_minutes,
        lesson_focus: full.lesson_focus,
        understanding_check: full.understanding_check,
        confidence_level: full.confidence_level,
        lesson_highlights: full.lesson_highlights,
        participation: full.participation,
        focus_rating: full.focus_rating,
        homework: full.homework,
        next_focus: full.next_focus,
        how_to_help_at_home: full.how_to_help_at_home,
        subject_name: full.subjects?.name ?? "Subject",
        teacher_name: full.uploader?.full_name ?? null,
        skill_ratings: (full.skill_ratings ?? [])
          .map((s) => ({ name: s.skill?.name ?? "Skill", rating: s.rating }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }
    : null;

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Parent dashboard
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Sessions
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Every lesson report for {selected.preferred_name ?? selected.full_name}.
        </p>
      </div>

      <ChildTabs
        basePath="/dashboard/sessions"
        children={childOptions}
        activeId={selected.id}
      />

      {reports.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line bg-white p-10 text-center">
          <p className="text-[14px] text-g600">
            No lesson reports submitted for this child yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 overflow-hidden md:grid md:grid-cols-[240px_1fr] md:gap-8 md:overflow-visible">
          <aside className="max-w-full">
            <p className="mb-3 font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              Lessons
            </p>
            <ul className="flex gap-2 overflow-x-auto pb-3 md:flex-col md:overflow-x-visible md:pb-0">
              {reports.map((r) => {
                const active = r.id === activeId;
                const conf = confidenceBadge(r.confidence_level);
                return (
                  <li key={r.id} className="w-[180px] shrink-0 md:w-auto md:shrink">
                    <Link
                      href={`/dashboard/sessions?child=${selected.id}&report=${r.id}`}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-2xl border px-4 py-3 transition-colors ${
                        active
                          ? "border-navy bg-navy text-white"
                          : "border-navy/10 bg-white hover:border-navy/30"
                      }`}
                    >
                      <p
                        className={`font-heading text-[13px] font-semibold ${
                          active ? "text-yellow" : "text-navy"
                        }`}
                      >
                        {formatDate(r.lesson_date)}
                      </p>
                      <p
                        className={`mt-1 truncate text-[12px] ${
                          active ? "text-white/70" : "text-g600"
                        }`}
                      >
                        {r.subjects?.name ?? "Subject"} · {r.lesson_focus}
                      </p>
                      <div className="mt-2">
                        <StatusBadge tone={conf.tone} onDark={active}>
                          {conf.label}
                        </StatusBadge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="min-w-0">
            {view ? (
              <LessonReportView report={view} />
            ) : (
              <p className="text-[14px] text-g600">Pick a lesson to view the report.</p>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}
