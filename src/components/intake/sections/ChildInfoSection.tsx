"use client";

import { ChipGroup } from "@/components/ui/ChipGroup";
import { FormField, inputBase } from "@/components/ui/FormField";
import { IntakeSection } from "../IntakeSection";
import type { Curriculum, Gender, IntakeFileKind } from "@/types/domain";

export type ChildInfoValues = {
  full_name: string;
  preferred_name: string;
  age: string;
  gender: Gender | "";
  current_school: string;
  curriculum: Curriculum | "";
  curriculum_other: string;
  files: Partial<Record<IntakeFileKind, File | null>>;
};

export const emptyChildInfo: ChildInfoValues = {
  full_name: "",
  preferred_name: "",
  age: "",
  gender: "",
  current_school: "",
  curriculum: "",
  curriculum_other: "",
  files: {},
};

const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const curriculumOptions: { value: Curriculum; label: string }[] = [
  { value: "british", label: "British" },
  { value: "nigerian", label: "Nigerian" },
  { value: "american", label: "American" },
  { value: "not_sure", label: "Not sure" },
  { value: "other", label: "Other" },
];

const fileSlots: { kind: IntakeFileKind; label: string; hint: string }[] = [
  { kind: "curriculum", label: "Curriculum document", hint: "Year-group syllabus, if available." },
  { kind: "school_report", label: "Latest school report", hint: "Most recent termly report." },
  { kind: "class_notes", label: "Recent class notes", hint: "A page or two to gauge writing level." },
];

export function ChildInfoSection({
  value,
  onChange,
  number,
}: {
  value: ChildInfoValues;
  onChange: (next: ChildInfoValues) => void;
  number: number;
}) {
  const patch = (p: Partial<ChildInfoValues>) => onChange({ ...value, ...p });
  const setFile = (kind: IntakeFileKind, file: File | null) =>
    onChange({ ...value, files: { ...value.files, [kind]: file } });

  return (
    <IntakeSection
      number={number}
      title="About your child"
      subtitle="Basic details — we'll use these to match the right teacher."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Child's full name" required>
          <input
            type="text"
            required
            value={value.full_name}
            onChange={(e) => patch({ full_name: e.target.value })}
            className={inputBase}
          />
        </FormField>
        <FormField label="Preferred name" hint="What the teacher should call them.">
          <input
            type="text"
            value={value.preferred_name}
            onChange={(e) => patch({ preferred_name: e.target.value })}
            className={inputBase}
          />
        </FormField>
        <FormField label="Age" required>
          <input
            type="number"
            required
            value={value.age}
            onChange={(e) => patch({ age: e.target.value })}
            className={inputBase}
          />
        </FormField>
        <FormField label="Current school">
          <input
            type="text"
            value={value.current_school}
            onChange={(e) => patch({ current_school: e.target.value })}
            className={inputBase}
          />
        </FormField>
      </div>

      <FormField label="Gender" required>
        <ChipGroup
          options={genderOptions}
          value={value.gender === "" ? null : value.gender}
          onChange={(v) => patch({ gender: v })}
          ariaLabel="Gender"
        />
      </FormField>

      <FormField label="Curriculum" required>
        <ChipGroup
          options={curriculumOptions}
          value={value.curriculum === "" ? null : value.curriculum}
          onChange={(v) => patch({ curriculum: v })}
          ariaLabel="Curriculum"
        />
      </FormField>

      {value.curriculum === "other" && (
        <FormField label="Which curriculum?" required>
          <input
            type="text"
            required
            value={value.curriculum_other}
            onChange={(e) => patch({ curriculum_other: e.target.value })}
            className={inputBase}
          />
        </FormField>
      )}

      <div className="flex flex-col gap-4 rounded-md border border-dashed border-g100 bg-g50 p-5">
        <p className="font-heading text-[13px] font-bold uppercase tracking-[0.12em] text-navy">
          Optional uploads
        </p>
        {fileSlots.map((s) => {
          const picked = value.files[s.kind] ?? null;
          return (
            <FormField key={s.kind} label={s.label} hint={s.hint}>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => setFile(s.kind, e.target.files?.[0] ?? null)}
                  className="file:mr-3 file:rounded-md file:border-[1.5px] file:border-navy file:bg-white file:px-3 file:py-[7px] file:font-heading file:text-[12px] file:font-bold file:text-navy hover:file:bg-navy/5"
                />
                {picked && (
                  <span className="text-[12px] text-g600">{picked.name}</span>
                )}
              </div>
            </FormField>
          );
        })}
      </div>
    </IntakeSection>
  );
}
