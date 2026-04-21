import clsx from "clsx";

type Mode = "on-blue" | "on-navy" | "on-white" | "on-yellow";

const palettes: Record<Mode, { mark: string; markFg: string; word: string }> = {
  // Inside the marketing blue nav pill.
  "on-blue":   { mark: "bg-white",  markFg: "text-blue",  word: "text-white" },
  // Inside an authenticated-area navy nav.
  "on-navy":   { mark: "bg-yellow", markFg: "text-navy",  word: "text-white" },
  // Inside a light background (footer of signed-out areas, email headers).
  "on-white":  { mark: "bg-navy",   markFg: "text-white", word: "text-navy"  },
  // Inside the marketing yellow strip (rare — email footers).
  "on-yellow": { mark: "bg-navy",   markFg: "text-white", word: "text-navy"  },
};

const sizes = {
  sm: { mark: "h-6 w-6 text-[11px]", word: "text-base",   gap: "gap-[7px]" },
  md: { mark: "h-7 w-7 text-[13px]", word: "text-[20px]", gap: "gap-[9px]" },
  lg: { mark: "h-9 w-9 text-[17px]", word: "text-[28px]", gap: "gap-3"     },
};

export function BrandLogo({
  mode = "on-blue",
  size = "md",
  className,
}: {
  mode?: Mode;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const palette = palettes[mode];
  const sz = sizes[size];

  return (
    <span className={clsx("inline-flex items-center", sz.gap, className)}>
      <span
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-[8px] font-heading font-extrabold leading-none",
          palette.mark,
          palette.markFg,
          sz.mark,
        )}
        aria-hidden="true"
      >
        e
      </span>
      <span
        className={clsx(
          "font-heading font-extrabold leading-none tracking-[-0.01em]",
          palette.word,
          sz.word,
        )}
      >
        educonnect
      </span>
    </span>
  );
}
