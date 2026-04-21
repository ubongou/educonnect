"use client";

import { ChipGroup } from "@/components/ui/ChipGroup";
import { FormField, inputBase } from "@/components/ui/FormField";
import { IntakeSection } from "../IntakeSection";

type AttentionSpan =
  | "very_focused"
  | "short_bursts"
  | "easily_distracted"
  | "needs_supervision"
  | "varies";

type WorkPreference = "alone" | "with_guidance" | "mix";

export type BehaviourValues = {
  attention_span: AttentionSpan | "";
  work_preference: WorkPreference | "";
  how_communicates_confusion: string;
  helpful_routines: string;
};

export const emptyBehaviour: BehaviourValues = {
  attention_span: "",
  work_preference: "",
  how_communicates_confusion: "",
  helpful_routines: "",
};

const attentionOptions: { value: AttentionSpan; label: string }[] = [
  { value: "very_focused", label: "Very focused" },
  { value: "short_bursts", label: "Short bursts" },
  { value: "easily_distracted", label: "Easily distracted" },
  { value: "needs_supervision", label: "Needs supervision" },
  { value: "varies", label: "Varies" },
];

const workOptions: { value: WorkPreference; label: string }[] = [
  { value: "alone", label: "Prefers to work alone" },
  { value: "with_guidance", label: "Prefers guidance" },
  { value: "mix", label: "A mix" },
];

export function BehaviourSection({
  value,
  onChange,
  number,
}: {
  value: BehaviourValues;
  onChange: (next: BehaviourValues) => void;
  number: number;
}) {
  const patch = (p: Partial<BehaviourValues>) => onChange({ ...value, ...p });

  return (
    <IntakeSection
      number={number}
      title="Behaviour and working style"
      subtitle="How your child engages during a learning task."
    >
      <FormField label="Attention span">
        <ChipGroup
          options={attentionOptions}
          value={value.attention_span === "" ? null : value.attention_span}
          onChange={(v) => patch({ attention_span: v })}
          ariaLabel="Attention span"
        />
      </FormField>

      <FormField label="Work preference">
        <ChipGroup
          options={workOptions}
          value={value.work_preference === "" ? null : value.work_preference}
          onChange={(v) => patch({ work_preference: v })}
          ariaLabel="Work preference"
        />
      </FormField>

      <FormField label="How do they show they're confused or stuck?">
        <textarea
          rows={3}
          value={value.how_communicates_confusion}
          onChange={(e) => patch({ how_communicates_confusion: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>

      <FormField label="Routines or environments that help them focus">
        <textarea
          rows={3}
          value={value.helpful_routines}
          onChange={(e) => patch({ helpful_routines: e.target.value })}
          className={`${inputBase} min-h-[90px] resize-y`}
        />
      </FormField>
    </IntakeSection>
  );
}
