import type { ReactNode } from "react";
import clsx from "clsx";
import { Eyebrow } from "./Eyebrow";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  light = false,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  light?: boolean;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={clsx("mb-[52px]", centered && "text-center", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        className={clsx(
          "font-heading text-[clamp(26px,3.5vw,40px)] font-extrabold leading-[1.15] mb-3",
          light ? "text-white" : "text-navy",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={clsx(
            "text-base leading-[1.75]",
            centered ? "mx-auto max-w-[560px]" : "max-w-[520px]",
            light ? "text-white/55" : "text-g600",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
