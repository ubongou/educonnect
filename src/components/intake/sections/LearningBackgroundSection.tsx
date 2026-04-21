"use client";

import { ChipGroup } from "@/components/ui/ChipGroup";
import { FormField, inputBase } from "@/components/ui/FormField";
import { IntakeSection } from "../IntakeSection";

export type LearningBackgroundValues = {
  prior_tutoring: "yes" | "no" | "";
  prior_tutoring_notes: string;
  recent_changes: string;
};

export const emptyLearningBackground: LearningBackgroundValues = {
  prior_tutoring: "",
  prior_tutoring_notes: "",
  recent_changes: "",
};

export function LearningBackgroundSection({
  value,
  onChange,
  number,
}: {
  value: LearningBackgroundValues;
  onChange: (next: LearningBackgroundValues) => void;
  number: number;
}) {
  const patch = (p: Partial<LearningBackgroundValues>) => onChange({ ...value, ...p });

  return (
    <IntakeSection
      number={number}
      title="Learning background"
      subtitle="A little context so we can pick up where things stand."
    >
      <FormField label="Has your child had tutoring before?">
        <ChipGroup
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={value.prior_tutoring === "" ? null : value.prior_tutoring}
          onChange={(v) => patch({ prior_tutoring: v })}
          ariaLabel="Prior tutoring"
        />
      </FormField>

      {value.prior_tutoring === "yes" && (
        <FormField label="Tell us a bit about the prior tutoring">
          <textarea
            rows={3}
            value={value.prior_tutoring_notes}
            onChange={(e) => patch({ prior_tutoring_notes: e.target.value })}
            className={`${inputBase} min-h-[90px] resize-y`}
          />
        </FormField>
      )}

      <FormField
        label="Any recent changes affecting learning?"
        hint="New school, moving home, family events — anything we should know about."
      >
        <textarea
          rows={3}
          value={value.recent_changes}
          onChange={(e) => patch({ recent_changes: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>
    </IntakeSection>
  );
}
