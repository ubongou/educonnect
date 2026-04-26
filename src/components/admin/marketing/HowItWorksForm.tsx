"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import type { HowItWorksContent } from "@/lib/marketing/schemas";

export function HowItWorksForm({ initial }: { initial: HowItWorksContent }) {
  const [content, setContent] = useState<HowItWorksContent>(initial);

  function updateStep(i: number, patch: Partial<HowItWorksContent["steps"][number]>) {
    const next = [...content.steps] as HowItWorksContent["steps"];
    next[i] = { ...next[i], ...patch };
    setContent({ ...content, steps: next });
  }

  return (
    <SectionFormShell
      sectionId="how_it_works"
      title="How it works"
      description="Numbered four-step explainer next to the dashboard preview."
      getContent={() => content}
    >
      <FieldGroup title="Section heading">
        <TextInput
          label="Eyebrow"
          value={content.eyebrow}
          onChange={(v) => setContent({ ...content, eyebrow: v })}
        />
        <TextInput
          label="Title"
          value={content.title}
          onChange={(v) => setContent({ ...content, title: v })}
        />
        <TextArea
          label="Subtitle"
          value={content.subtitle}
          rows={3}
          onChange={(v) => setContent({ ...content, subtitle: v })}
        />
        <TextInput
          label="CTA button label"
          value={content.ctaLabel}
          onChange={(v) => setContent({ ...content, ctaLabel: v })}
          hint="The destination URL is the booking link from Site globals."
        />
      </FieldGroup>

      {content.steps.map((s, i) => (
        <FieldGroup key={i} title={`Step ${i + 1}`}>
          <TextInput
            label="Title"
            value={s.title}
            onChange={(v) => updateStep(i, { title: v })}
          />
          <TextArea
            label="Body"
            value={s.body}
            rows={3}
            onChange={(v) => updateStep(i, { body: v })}
          />
        </FieldGroup>
      ))}
    </SectionFormShell>
  );
}
