"use client";

import { FormField, inputBase } from "@/components/ui/FormField";
import { IntakeSection } from "../IntakeSection";

export type GoalsValues = {
  improvement_8_12_weeks: string;
  breakthrough_priority: string;
};

export const emptyGoals: GoalsValues = {
  improvement_8_12_weeks: "",
  breakthrough_priority: "",
};

export function GoalsSection({
  value,
  onChange,
  number,
}: {
  value: GoalsValues;
  onChange: (next: GoalsValues) => void;
  number: number;
}) {
  const patch = (p: Partial<GoalsValues>) => onChange({ ...value, ...p });

  return (
    <IntakeSection
      number={number}
      title="Goals"
      subtitle="What does a great outcome look like for you?"
    >
      <FormField
        label="What would you like to see improve in 8–12 weeks?"
        hint="Be specific if you can — it makes the teacher's job easier."
      >
        <textarea
          rows={3}
          value={value.improvement_8_12_weeks}
          onChange={(e) => patch({ improvement_8_12_weeks: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>

      <FormField label="If you could pick one breakthrough to prioritise, what would it be?">
        <textarea
          rows={3}
          value={value.breakthrough_priority}
          onChange={(e) => patch({ breakthrough_priority: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>
    </IntakeSection>
  );
}
