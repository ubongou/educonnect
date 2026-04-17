import type { ReactNode } from "react";
import clsx from "clsx";

type Variant = "light" | "dark" | "dark-yellow-border";

const variants: Record<Variant, string> = {
  light: "bg-white border-[1.5px] border-g100",
  dark: "bg-navy border border-white/10",
  "dark-yellow-border": "bg-navy border-[1.5px] border-yellow",
};

export function Card({
  children,
  variant = "light",
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg p-7 transition-[transform,box-shadow] duration-200",
        variants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
