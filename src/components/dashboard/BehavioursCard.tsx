import { BatteryBars } from "@/components/ui/BatteryBars";

type Props = {
  participation: number | null;
  focusRating: number | null;
  homework: number | null;
  note: string | null;
};

/**
 * Behaviours + teacher-note read-only card used on the parent overview.
 * Renders three 0..10 BatteryBars and a pull-quote note styled to match
 * the inspiration's italic teacher-quote treatment.
 */
export function BehavioursCard({ participation, focusRating, homework, note }: Props) {
  const empty =
    participation === null && focusRating === null && homework === null && !note;

  if (empty) {
    return (
      <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
        Behaviours + teacher notes will appear here after the first lesson report.
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-line bg-white p-6">
      <h3 className="mb-4 font-heading text-[14px] font-semibold text-navy">
        Learning behaviours
      </h3>
      <div className="flex flex-col gap-3">
        {participation !== null && (
          <BatteryBars
            label="Participation"
            value={participation}
            max={10}
            readOnly
          />
        )}
        {focusRating !== null && (
          <BatteryBars
            label="Focus and attention"
            value={focusRating}
            max={10}
            readOnly
          />
        )}
        {homework !== null && (
          <BatteryBars
            label="Homework completion"
            value={homework}
            max={10}
            readOnly
          />
        )}
      </div>
      {note && (
        <div className="mt-5 border-t border-line pt-5">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Teacher note
          </p>
          <p className="mt-2 text-[14px] italic leading-[1.6] text-navy">
            &ldquo;{note}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
