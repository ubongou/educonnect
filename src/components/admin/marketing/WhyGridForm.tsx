"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import { ImageUploadField } from "./ImageUploadField";
import { bundledAssets } from "@/lib/marketing/defaults";
import type { WhyGridContent } from "@/lib/marketing/schemas";

export function WhyGridForm({ initial }: { initial: WhyGridContent }) {
  const [content, setContent] = useState<WhyGridContent>(initial);

  function updateCard(i: number, patch: Partial<WhyGridContent["cards"][number]>) {
    const next = [...content.cards] as WhyGridContent["cards"];
    next[i] = { ...next[i], ...patch };
    setContent({ ...content, cards: next });
  }

  function updatePolaroid(
    i: number,
    patch: Partial<WhyGridContent["polaroids"][number]>,
  ) {
    const next = [...content.polaroids] as WhyGridContent["polaroids"];
    next[i] = { ...next[i], ...patch };
    setContent({ ...content, polaroids: next });
  }

  return (
    <SectionFormShell
      sectionId="why_grid"
      title="Why EduConnect grid"
      description="Three info cards plus a polaroid-style photo strip."
      getContent={() => content}
    >
      <FieldGroup title="Section heading">
        <TextInput
          label="Eyebrow (small uppercase label)"
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
        <FieldGroup key={i} title={`Card ${i + 1}`}>
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

      {content.polaroids.map((p, i) => (
        <FieldGroup key={i} title={`Polaroid ${i + 1}`}>
          <ImageUploadField
            label="Photo"
            helpText="Portrait orientation. Shown with a white border and slight tilt."
            section="why_grid"
            slot={`polaroid-${i}`}
            storagePath={p.imagePath}
            fallbackPreview={
              bundledAssets.whyGridPolaroids[i] ?? bundledAssets.whyGridPolaroids[0]
            }
            onChange={(storagePath) => updatePolaroid(i, { imagePath: storagePath })}
          />
          <TextInput
            label="Alt text"
            value={p.alt}
            onChange={(v) => updatePolaroid(i, { alt: v })}
          />
        </FieldGroup>
      ))}
    </SectionFormShell>
  );
}
