"use client";

import { ChipGroup } from "@/components/ui/ChipGroup";
import { FormField, inputBase } from "@/components/ui/FormField";
import { IntakeSection } from "../IntakeSection";

type Response =
  | "tries_again"
  | "asks_for_help"
  | "gets_frustrated"
  | "withdraws"
  | "it_depends";

export type ChallengesValues = {
  challenging_areas: string;
  struggling_subjects: string;
  response_when_difficult: Response | "";
  main_concerns: string;
};

export const emptyChallenges: ChallengesValues = {
  challenging_areas: "",
  struggling_subjects: "",
  response_when_difficult: "",
  main_concerns: "",
};

const responseOptions: { value: Response; label: string }[] = [
  { value: "tries_again", label: "Tries again" },
  { value: "asks_for_help", label: "Asks for help" },
  { value: "gets_frustrated", label: "Gets frustrated" },
  { value: "withdraws", label: "Withdraws" },
  { value: "it_depends", label: "It depends" },
];

export function ChallengesSection({
  value,
  onChange,
  number,
}: {
  value: ChallengesValues;
  onChange: (next: ChallengesValues) => void;
  number: number;
}) {
  const patch = (p: Partial<ChallengesValues>) => onChange({ ...value, ...p });

  return (
    <IntakeSection
      number={number}
      title="Challenges"
      subtitle="The honest picture helps the teacher plan effectively."
    >
      <FormField label="Where does your child find things hardest?">
        <textarea
          rows={3}
          value={value.challenging_areas}
          onChange={(e) => patch({ challenging_areas: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>

      <FormField
        label="Specific subjects or topics they struggle with"
        hint="e.g. fractions, reading comprehension, essay writing."
      >
        <input
          type="text"
          value={value.struggling_subjects}
          onChange={(e) => patch({ struggling_subjects: e.target.value })}
          className={inputBase}
        />
      </FormField>

      <FormField label="When work feels hard, they usually…">
        <ChipGroup
          options={responseOptions}
          value={value.response_when_difficult === "" ? null : value.response_when_difficult}
          onChange={(v) => patch({ response_when_difficult: v })}
          ariaLabel="Response to difficulty"
        />
      </FormField>

      <FormField label="Your main concerns right now">
        <textarea
          rows={3}
          value={value.main_concerns}
          onChange={(e) => patch({ main_concerns: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>
    </IntakeSection>
  );
}
