import type { ReactNode } from "react";
import clsx from "clsx";

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("flex flex-col gap-[7px]", className)}>
      <span className="font-heading text-[13px] font-medium tracking-[0.02em] text-navy">
        {label}
        {required && <span className="ml-1 text-coral">*</span>}
      </span>
      {hint && <span className="text-[12px] text-g400">{hint}</span>}
      {children}
      {error && <span className="text-[12px] font-semibold text-coral">{error}</span>}
    </label>
  );
}

export const inputBase =
  "rounded-xl border border-line bg-paper px-4 py-3 font-sans text-[14px] text-navy outline-none transition-[border-color,background,box-shadow] placeholder:text-g400 focus:border-blue focus:bg-white focus:shadow-[0_0_0_4px_rgba(62,190,255,0.15)] disabled:opacity-50";
