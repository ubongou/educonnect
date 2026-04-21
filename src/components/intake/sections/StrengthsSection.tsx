"use client";

import { ChipGroup } from "@/components/ui/ChipGroup";
import { FormField, inputBase } from "@/components/ui/FormField";
import { IntakeSection } from "../IntakeSection";

type Interest =
  | "reading"
  | "writing"
  | "music"
  | "sports"
  | "art"
  | "games"
  | "technology";

export type StrengthsValues = {
  enjoys_or_excels_at: string;
  confident_situations: string;
  interests: Interest[];
};

export const emptyStrengths: StrengthsValues = {
  enjoys_or_excels_at: "",
  confident_situations: "",
  interests: [],
};

const interestOptions: { value: Interest; label: string }[] = [
  { value: "reading", label: "Reading" },
  { value: "writing", label: "Writing" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "art", label: "Art" },
  { value: "games", label: "Games" },
  { value: "technology", label: "Technology" },
];

export function StrengthsSection({
  value,
  onChange,
  number,
}: {
  value: StrengthsValues;
  onChange: (next: StrengthsValues) => void;
  number: number;
}) {
  const patch = (p: Partial<StrengthsValues>) => onChange({ ...value, ...p });

  return (
    <IntakeSection
      number={number}
      title="Strengths and interests"
      subtitle="What does your child naturally enjoy or do well?"
    >
      <FormField label="What do they enjoy or excel at?">
        <textarea
          rows={3}
          value={value.enjoys_or_excels_at}
          onChange={(e) => patch({ enjoys_or_excels_at: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>

      <FormField label="When do they feel most confident?">
        <textarea
          rows={3}
          value={value.confident_situations}
          onChange={(e) => patch({ confident_situations: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>

      <FormField label="Interests (pick any that apply)">
        <ChipGroup<Interest>
          multi
          options={interestOptions}
          value={value.interests}
          onChange={(next) => patch({ interests: next })}
          ariaLabel="Interests"
        />
      </FormField>
    </IntakeSection>
  );
}
