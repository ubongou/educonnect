import { BatteryBars } from "@/components/ui/BatteryBars";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDuration } from "@/lib/format";
import { confidenceBadge, understandingBadge } from "@/lib/scales";

export type LessonReportViewData = {
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
  subject_name: string;
  teacher_name: string | null;
  skill_ratings: Array<{ name: string; rating: number }>;
};

export function LessonReportView({ report }: { report: LessonReportViewData }) {
  const u = understandingBadge(report.understanding_check);
  const c = confidenceBadge(report.confidence_level);

  return (
    <article className="flex flex-col gap-6">
      {/* Session summary header */}
      <div className="rounded-lg bg-navy p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-heading text-[14px] font-semibold text-yellow">
            {formatDate(report.lesson_date)}
          </span>
          <span className="text-[12px] text-white/60">
            {report.subject_name}
            {report.teacher_name && ` · ${report.teacher_name}`}
            {` · ${formatDuration(report.duration_minutes)}`}
          </span>
        </div>
        <h2 className="mt-2 font-heading text-[22px] font-semibold">
          {report.lesson_focus}
        </h2>
      </div>

      {/* Lesson highlights — surfaced above metrics per client feedback */}
      {report.lesson_highlights && (
        <div className="rounded-[28px] border border-line bg-white p-6">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Lesson highlights
          </p>
          <p className="mt-2 text-[14px] italic leading-[1.65] text-navy">
            &ldquo;{report.lesson_highlights}&rdquo;
          </p>
        </div>
      )}

      {/* Next focus + help at home — surfaced above metrics per client feedback */}
      {(report.next_focus || report.how_to_help_at_home) && (
        <div className="grid gap-5 rounded-[28px] border border-line bg-white p-6 md:grid-cols-2">
          {report.next_focus && (
            <div>
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                Next focus
              </p>
              <p className="mt-2 text-[14px] text-navy">{report.next_focus}</p>
            </div>
          )}
          {report.how_to_help_at_home && (
            <div>
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                Help at home
              </p>
              <p className="mt-2 text-[14px] text-navy">
                {report.how_to_help_at_home}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Key metrics */}
      <div className="grid gap-5 rounded-[28px] border border-line bg-white p-6 md:grid-cols-2">
        <div>
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Understanding
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-heading text-[22px] font-semibold tabular-nums text-navy">
              {report.understanding_check}
              <span className="text-[14px] text-g400"> / 10</span>
            </span>
            <StatusBadge tone={u.tone}>{u.label}</StatusBadge>
          </div>
        </div>
        <div>
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Confidence
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-heading text-[22px] font-semibold tabular-nums text-navy">
              {report.confidence_level}
              <span className="text-[14px] text-g400"> / 10</span>
            </span>
            <StatusBadge tone={c.tone}>{c.label}</StatusBadge>
          </div>
        </div>
      </div>

      {/* Behaviours */}
      <div className="rounded-[28px] border border-line bg-white p-6">
        <h3 className="mb-4 font-heading text-[14px] font-semibold text-navy">
          Learning behaviours
        </h3>
        <div className="flex flex-col gap-3">
          <BatteryBars
            label="Participation"
            value={report.participation}
            max={10}
            readOnly
          />
          <BatteryBars
            label="Focus and attention"
            value={report.focus_rating}
            max={10}
            readOnly
          />
          <BatteryBars
            label="Homework completion"
            value={report.homework}
            max={10}
            readOnly
          />
        </div>
      </div>

      {/* Skill tracker (optional) */}
      {report.skill_ratings.length > 0 && (
        <div className="rounded-[28px] border border-line bg-white p-6">
          <h3 className="mb-4 font-heading text-[14px] font-semibold text-navy">
            Skill tracker — {report.subject_name}
          </h3>
          <div className="flex flex-col gap-3">
            {report.skill_ratings.map((s) => (
              <BatteryBars
                key={s.name}
                label={s.name}
                value={s.rating}
                max={10}
                readOnly
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
