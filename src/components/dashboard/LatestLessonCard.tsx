import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { confidenceBadge, understandingBadge } from "@/lib/scales";

type LatestLesson = {
  lesson_date: string;
  lesson_focus: string;
  understanding_check: number;
  confidence_level: number;
  how_to_help_at_home: string | null;
  subjects: { name: string } | null;
  uploaded_by_name: string | null;
};

/**
 * Dark navy recap card — shows the most recent lesson for the selected
 * child alongside the bucketed understanding + confidence pills.
 * Matches the inspiration's "Latest lesson" block.
 */
export function LatestLessonCard({
  lesson,
  nextSessionLabel,
}: {
  lesson: LatestLesson | null;
  nextSessionLabel?: string | null;
}) {
  if (!lesson) {
    return (
      <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-6 text-[14px] text-g600">
        No lesson reports yet. You&apos;ll see the latest one here after the first
        session.
      </div>
    );
  }

  const u = understandingBadge(lesson.understanding_check);
  const c = confidenceBadge(lesson.confidence_level);
  const readingTone: BadgeTone = "blue";

  return (
    <div className="rounded-lg bg-navy p-6 text-white shadow-[0_24px_60px_-20px_rgba(4,19,28,0.6)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-yellow">
          Latest lesson · {formatDate(lesson.lesson_date)}
        </span>
        {lesson.subjects?.name && (
          <StatusBadge tone={readingTone}>{lesson.subjects.name}</StatusBadge>
        )}
      </div>

      <h3 className="mt-3 font-heading text-[22px] font-extrabold text-white">
        {lesson.lesson_focus}
      </h3>

      {lesson.uploaded_by_name && (
        <p className="mt-2 text-[12px] text-white/50">
          Taught by {lesson.uploaded_by_name}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-white/10 pt-5">
        <div>
          <dt className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
            Understanding
          </dt>
          <dd className="mt-2">
            <StatusBadge tone={u.tone}>{u.label}</StatusBadge>
          </dd>
        </div>
        <div>
          <dt className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
            Confidence
          </dt>
          <dd className="mt-2">
            <StatusBadge tone={c.tone}>{c.label}</StatusBadge>
          </dd>
        </div>
        {nextSessionLabel && (
          <div className="col-span-2">
            <dt className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
              Next session
            </dt>
            <dd className="mt-2 text-[14px] text-white">{nextSessionLabel}</dd>
          </div>
        )}
        {lesson.how_to_help_at_home && (
          <div className="col-span-2">
            <dt className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
              Help at home
            </dt>
            <dd className="mt-2 text-[14px] text-white/80">
              {lesson.how_to_help_at_home}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
