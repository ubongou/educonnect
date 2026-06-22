"use client";

import { FormField, inputBase } from "@/components/ui/FormField";

export type StudentFieldValues = {
  full_name: string;
  preferred_name: string;
  age: string;
  gender: string;
  current_school: string;
  curriculum: string;
  curriculum_other: string;
};

export const emptyStudentFields: StudentFieldValues = {
  full_name: "",
  preferred_name: "",
  age: "",
  gender: "",
  current_school: "",
  curriculum: "",
  curriculum_other: "",
};

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const curriculumOptions = [
  { value: "british", label: "British" },
  { value: "nigerian", label: "Nigerian" },
  { value: "american", label: "American" },
  { value: "not_sure", label: "Not sure" },
  { value: "other", label: "Other" },
];

/**
 * Controlled child-info fields shared by the admin student create and edit
 * forms. Mirrors the onboarding ChildInfoSection minus the intake file slots.
 */
export function StudentFormFields({
  values,
  onChange,
}: {
  values: StudentFieldValues;
  onChange: (patch: Partial<StudentFieldValues>) => void;
}) {
  return (
    <>
      <FormField label="Full name" required>
        <input
          type="text"
          value={values.full_name}
          onChange={(e) => onChange({ full_name: e.target.value })}
          required
          className={inputBase}
        />
      </FormField>

      <FormField label="Preferred name" hint="What the teacher should call them.">
        <input
          type="text"
          value={values.preferred_name}
          onChange={(e) => onChange({ preferred_name: e.target.value })}
          className={inputBase}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Age" required>
          <input
            type="number"
            min={3}
            max={25}
            value={values.age}
            onChange={(e) => onChange({ age: e.target.value })}
            required
            className={inputBase}
          />
        </FormField>
        <FormField label="Gender" required>
          <select
            value={values.gender}
            onChange={(e) => onChange({ gender: e.target.value })}
            required
            className={inputBase}
          >
            <option value="" disabled>
              Select…
            </option>
            {genderOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Current school">
        <input
          type="text"
          value={values.current_school}
          onChange={(e) => onChange({ current_school: e.target.value })}
          className={inputBase}
        />
      </FormField>

      <FormField label="Curriculum" required>
        <select
          value={values.curriculum}
          onChange={(e) => onChange({ curriculum: e.target.value })}
          required
          className={inputBase}
        >
          <option value="" disabled>
            Select…
          </option>
          {curriculumOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>

      {values.curriculum === "other" && (
        <FormField label="Which curriculum?" required>
          <input
            type="text"
            value={values.curriculum_other}
            onChange={(e) => onChange({ curriculum_other: e.target.value })}
            required
            className={inputBase}
          />
        </FormField>
      )}
    </>
  );
}

/** Maps the string-based form values to the action payload shape. */
export function toStudentPayload(v: StudentFieldValues) {
  return {
    full_name: v.full_name.trim(),
    preferred_name: v.preferred_name.trim() || undefined,
    age: Number(v.age),
    gender: v.gender,
    current_school: v.current_school.trim() || undefined,
    curriculum: v.curriculum,
    curriculum_other:
      v.curriculum === "other" ? v.curriculum_other.trim() || undefined : undefined,
  };
}
