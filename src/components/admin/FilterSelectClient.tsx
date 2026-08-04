"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { inputBase } from "@/components/ui/FormField";

/**
 * A dropdown that navigates. Each option carries the href the server computed
 * for it, so filter state stays in the URL and the page it drives stays a plain
 * server component — no client-side copy of the data being filtered.
 */
export function FilterSelectClient({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; href: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className={`flex flex-col gap-[6px] ${pending ? "opacity-60" : ""}`}>
      <span className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => {
          const target = options.find((o) => o.value === e.target.value);
          if (target) startTransition(() => router.push(target.href));
        }}
        className={`${inputBase} w-auto min-w-[150px] py-2`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
