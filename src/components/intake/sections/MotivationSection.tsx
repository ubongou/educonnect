"use client";

import { ChipGroup } from "@/components/ui/ChipGroup";
import { FormField, inputBase } from "@/components/ui/FormField";
import { IntakeSection } from "../IntakeSection";

type Motivator =
  | "praise"
  | "rewards"
  | "challenge"
  | "independence"
  | "competition"
  | "structured_guidance"
  | "not_sure";

export type MotivationValues = {
  motivators: Motivator[];
  demotivators: string;
};

export const emptyMotivation: MotivationValues = {
  motivators: [],
  demotivators: "",
};

const motivatorOptions: { value: Motivator; label: string }[] = [
  { value: "praise", label: "Praise" },
  { value: "rewards", label: "Rewards" },
  { value: "challenge", label: "A challenge" },
  { value: "independence", label: "Independence" },
  { value: "competition", label: "Competition" },
  { value: "structured_guidance", label: "Structured guidance" },
  { value: "not_sure", label: "Not sure" },
];

export function MotivationSection({
  value,
  onChange,
  number,
}: {
  value: MotivationValues;
  onChange: (next: MotivationValues) => void;
  number: number;
}) {
  const patch = (p: Partial<MotivationValues>) => onChange({ ...value, ...p });

  return (
    <IntakeSection
      number={number}
      title="Motivation"
      subtitle="What gets them engaged — and what tends to switch them off."
    >
      <FormField label="What motivates your child? (pick any)">
        <ChipGroup<Motivator>
          multi
          options={motivatorOptions}
          value={value.motivators}
          onChange={(next) => patch({ motivators: next })}
          ariaLabel="Motivators"
        />
      </FormField>

      <FormField label="What tends to put them off learning?">
        <textarea
          rows={3}
          value={value.demotivators}
          onChange={(e) => patch({ demotivators: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>
    </IntakeSection>
  );
}
