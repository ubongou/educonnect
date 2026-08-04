"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { inputBase } from "@/components/ui/FormField";
import {
  DATE_PRESETS,
  SESSION_STATUS_OPTIONS,
  sessionFiltersToQuery,
  type SessionFilterState,
} from "@/lib/sessions/filters";

export type FilterOption = { id: string; label: string };

/**
 * Dropdown-only filter bar for the admin sessions list. Every control is a
 * select — there is deliberately no free-text search, so a filter can only ever
 * name something that exists.
 *
 * State lives in the URL rather than this component: the page is server
 * rendered from `searchParams`, so a filtered view is shareable, survives a
 * refresh, and needs no client-side copy of the session list. Changing any
 * filter resets to page 1 — page 4 of the old result set means nothing against
 * the new one.
 */
export function SessionFilters({
  state,
  students,
  teachers,
  subjects,
  basePath = "/admin/sessions",
}: {
  state: SessionFilterState;
  students: FilterOption[];
  teachers: FilterOption[];
  subjects: FilterOption[];
  basePath?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const apply = (patch: Partial<SessionFilterState>) => {
    const next = { ...state, ...patch, page: 1 };
    startTransition(() => {
      router.push(`${basePath}${sessionFiltersToQuery(next)}`);
    });
  };

  const active =
    state.student || state.teacher || state.subject || state.status || state.range !== "upcoming";

  return (
    <div
      className={`flex flex-wrap items-end gap-3 transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
    >
      <Select
        label="Dates"
        value={state.range}
        onChange={(v) => apply({ range: v as SessionFilterState["range"] })}
        options={DATE_PRESETS.map((p) => ({ id: p.value, label: p.label }))}
      />
      <Select
        label="Child"
        value={state.student ?? ""}
        onChange={(v) => apply({ student: v || null })}
        options={students}
        anyLabel="All children"
      />
      <Select
        label="Teacher"
        value={state.teacher ?? ""}
        onChange={(v) => apply({ teacher: v || null })}
        options={teachers}
        anyLabel="All teachers"
      />
      <Select
        label="Subject"
        value={state.subject ?? ""}
        onChange={(v) => apply({ subject: v || null })}
        options={subjects}
        anyLabel="All subjects"
      />
      <Select
        label="Status"
        value={state.status ?? ""}
        onChange={(v) => apply({ status: v || null })}
        options={SESSION_STATUS_OPTIONS.map((s) => ({ id: s.value, label: s.label }))}
        anyLabel="Any status"
      />

      {active && (
        <button
          type="button"
          onClick={() =>
            startTransition(() => {
              router.push(basePath);
            })
          }
          className="pb-3 font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  anyLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly FilterOption[];
  /** Shown as the empty-value option. Omit for a select with no "any" state. */
  anyLabel?: string;
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} w-auto min-w-[150px] py-2`}
      >
        {anyLabel && <option value="">{anyLabel}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
