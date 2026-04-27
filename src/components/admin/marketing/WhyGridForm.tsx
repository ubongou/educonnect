"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import type { WhyGridContent } from "@/lib/marketing/schemas";

export function WhyGridForm({ initial }: { initial: WhyGridContent }) {
  const [content, setContent] = useState<WhyGridContent>(initial);

  function updateCard(
    i: number,
    patch: Partial<WhyGridContent["cards"][number]>,
  ) {
    const next = [...content.cards] as WhyGridContent["cards"];
    next[i] = { ...next[i], ...patch };
    setContent({ ...content, cards: next });
  }

  return (
    <SectionFormShell
      sectionId="why_grid"
      title="Why EduConnect grid"
      description="Three info cards explaining what sets EduConnect apart."
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
      </FieldGroup>

      {content.cards.map((card, i) => (
        <FieldGroup key={i} title={`Pillar ${i + 1}`}>
          <TextInput
            label="Number label"
            value={card.numLabel}
            onChange={(v) => updateCard(i, { numLabel: v })}
            hint='Example: "01 / Teachers"'
          />
          <TextInput
            label="Title"
            value={card.title}
            onChange={(v) => updateCard(i, { title: v })}
          />
          <TextArea
            label="Body"
            value={card.body}
            rows={4}
            onChange={(v) => updateCard(i, { body: v })}
          />
        </FieldGroup>
      ))}
    </SectionFormShell>
  );
}
