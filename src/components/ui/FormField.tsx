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
      <span className="font-heading text-[13px] font-semibold text-navy">
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
  "rounded-md border-[1.5px] border-g100 bg-white px-4 py-3 font-sans text-[14px] text-navy outline-none transition-colors placeholder:text-g400 focus:border-navy disabled:opacity-50";
