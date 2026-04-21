"use client";

import { BatteryBars } from "@/components/ui/BatteryBars";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { FormField, inputBase } from "@/components/ui/FormField";
import { IntakeSection } from "../IntakeSection";

type Trait =
  | "quiet"
  | "talkative"
  | "curious"
  | "shy"
  | "confident"
  | "careful"
  | "perfectionist"
  | "easily_distracted"
  | "reflective"
  | "independent";

type VerbalComfort = 1 | 2 | 3 | 4 | 5;

export type PersonalityValues = {
  description: string;
  traits: Trait[];
  verbal_expression_comfort: VerbalComfort | 0;
};

export const emptyPersonality: PersonalityValues = {
  description: "",
  traits: [],
  verbal_expression_comfort: 0,
};

const traitOptions: { value: Trait; label: string }[] = [
  { value: "quiet", label: "Quiet" },
  { value: "talkative", label: "Talkative" },
  { value: "curious", label: "Curious" },
  { value: "shy", label: "Shy" },
  { value: "confident", label: "Confident" },
  { value: "careful", label: "Careful" },
  { value: "perfectionist", label: "Perfectionist" },
  { value: "easily_distracted", label: "Easily distracted" },
  { value: "reflective", label: "Reflective" },
  { value: "independent", label: "Independent" },
];

export function PersonalitySection({
  value,
  onChange,
  number,
}: {
  value: PersonalityValues;
  onChange: (next: PersonalityValues) => void;
  number: number;
}) {
  const patch = (p: Partial<PersonalityValues>) => onChange({ ...value, ...p });

  return (
    <IntakeSection
      number={number}
      title="Personality"
      subtitle="The kind of person your child is outside academics."
    >
      <FormField label="Describe your child in a few sentences">
        <textarea
          rows={3}
          value={value.description}
          onChange={(e) => patch({ description: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>

      <FormField label="Which of these sound like them? (pick any)">
        <ChipGroup<Trait>
          multi
          options={traitOptions}
          value={value.traits}
          onChange={(next) => patch({ traits: next })}
          ariaLabel="Traits"
        />
      </FormField>

      <BatteryBars
        label="Comfort expressing themselves verbally"
        description="1 = very uncomfortable, 5 = very confident"
        value={value.verbal_expression_comfort}
        onChange={(n) => patch({ verbal_expression_comfort: n as VerbalComfort })}
      />
    </IntakeSection>
  );
}
