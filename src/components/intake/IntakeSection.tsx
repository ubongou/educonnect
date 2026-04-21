import type { ReactNode } from "react";
import clsx from "clsx";

export function IntakeSection({
  number,
  title,
  subtitle,
  children,
  className,
}: {
  number: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-lg border-[1.5px] border-navy/10 bg-white p-6 shadow-[0_8px_24px_-20px_rgba(4,19,28,0.25)] md:p-8",
        className,
      )}
    >
      <header className="mb-6 flex items-baseline gap-3 border-b border-g100 pb-5">
        <span className="font-heading text-[15px] font-extrabold text-coral tabular-nums">
          {String(number).padStart(2, "0")}
        </span>
        <div>
          <h2 className="font-heading text-[20px] font-extrabold text-navy">{title}</h2>
          {subtitle && <p className="mt-1 text-[14px] leading-[1.6] text-g600">{subtitle}</p>}
        </div>
      </header>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
