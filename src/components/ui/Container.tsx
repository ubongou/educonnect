import type { ReactNode } from "react";
import clsx from "clsx";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("max-w-[1280px] mx-auto px-10", className)}>
      {children}
    </div>
  );
}
