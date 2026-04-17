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
        "mb-3 block text-[11px] font-bold uppercase tracking-[0.12em] text-blue",
        className,
      )}
    >
      {children}
    </span>
  );
}
