import type { ReactNode } from "react";
import clsx from "clsx";

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "mb-3 inline-flex items-center gap-[10px] text-[13px] font-medium uppercase tracking-[0.14em] text-g600 before:block before:h-px before:w-6 before:bg-current before:opacity-50",
        className,
      )}
    >
      {children}
    </span>
  );
}
