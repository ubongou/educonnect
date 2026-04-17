"use client";

import clsx from "clsx";

export type ChipOption<V extends string = string> = {
  value: V;
  label: string;
};

type BaseProps<V extends string> = {
  options: ChipOption<V>[];
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
};

type MultiProps<V extends string> = BaseProps<V> & {
  multi: true;
  value: V[];
  onChange: (next: V[]) => void;
};

type SingleProps<V extends string> = BaseProps<V> & {
  multi?: false;
  value: V | null;
  onChange: (next: V) => void;
};

export function ChipGroup<V extends string = string>(props: MultiProps<V> | SingleProps<V>) {
  const { options, ariaLabel, className, disabled } = props;

  const isSelected = (v: V) =>
    props.multi ? props.value.includes(v) : props.value === v;

  const toggle = (v: V) => {
    if (disabled) return;
    if (props.multi) {
      const next = isSelected(v) ? props.value.filter((x) => x !== v) : [...props.value, v];
      props.onChange(next);
    } else {
      props.onChange(v);
    }
  };

  return (
    <div role="group" aria-label={ariaLabel} className={clsx("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const selected = isSelected(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            disabled={disabled}
            aria-pressed={selected}
            className={clsx(
              "rounded-pill border-[1.5px] px-4 py-2 text-[13px] font-heading font-semibold transition-colors disabled:opacity-50",
              selected
                ? "border-navy bg-navy text-white"
                : "border-g100 bg-white text-navy hover:border-navy",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
