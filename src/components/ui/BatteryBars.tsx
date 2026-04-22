"use client";

import clsx from "clsx";

type Props = {
  value: number;
  max?: number;
  onChange?: (next: number) => void;
  readOnly?: boolean;
  label?: string;
  description?: string;
  className?: string;
};

export function BatteryBars({
  value,
  max = 5,
  onChange,
  readOnly = false,
  label,
  description,
  className,
}: Props) {
  const bars = Array.from({ length: max }, (_, i) => i + 1);
  const interactive = !readOnly && !!onChange;

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="font-heading text-[14px] font-semibold text-navy">{label}</span>
          )}
          {description && <span className="text-[12px] text-g400">{description}</span>}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex gap-1" role={interactive ? "radiogroup" : undefined}>
          {bars.map((b) => {
            const filled = b <= value;
            return (
              <button
                key={b}
                type="button"
                disabled={!interactive}
                onClick={interactive ? () => onChange!(b) : undefined}
                aria-label={`Set rating to ${b} of ${max}`}
                aria-pressed={filled}
                className={clsx(
                  "rounded-[4px] border-[1.5px] border-navy transition-colors",
                  // When the scale is 0..10 (behaviours + skill tracker) the
                  // row would be 400px+ with the default bar width, so narrow
                  // each segment. Keeps the overall strip similar in size to
                  // the 5-bar form used on intake's verbal-expression scale.
                  max > 5 ? "h-5 w-4" : "h-6 w-10",
                  filled ? "bg-yellow" : "bg-white",
                  interactive && "cursor-pointer hover:brightness-95",
                  !interactive && "cursor-default",
                )}
              />
            );
          })}
        </div>
        <span className="font-heading text-[13px] font-bold text-navy tabular-nums">
          {value}/{max}
        </span>
      </div>
    </div>
  );
}
