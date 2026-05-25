"use client";

import { inputBase } from "@/components/ui/FormField";

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-[7px]">
      <span className="font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-g600">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputBase}
      />
      {hint && <span className="text-[11px] text-g400">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-[7px]">
      <span className="font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-g600">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${inputBase} resize-y leading-[1.55]`}
      />
      {hint && <span className="text-[11px] text-g400">{hint}</span>}
    </label>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-[7px]">
      <span className="font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-g600">
        {label}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const next = parseFloat(e.target.value);
          onChange(Number.isFinite(next) ? next : 0);
        }}
        step={step}
        min={min}
        className={`${inputBase} font-mono tabular-nums`}
      />
      {hint && <span className="text-[11px] text-g400">{hint}</span>}
    </label>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-line bg-white px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-navy"
      />
      <div className="flex flex-col gap-1">
        <span className="font-heading text-[13px] font-semibold text-navy">
          {label}
        </span>
        {hint && <span className="text-[11px] text-g400">{hint}</span>}
      </div>
    </label>
  );
}

export function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-md border border-line bg-white p-5">
      <legend className="px-2 font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
        {title}
      </legend>
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}
