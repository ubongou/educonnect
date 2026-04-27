"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import type { PricingIntroContent } from "@/lib/marketing/schemas";

export function PricingIntroForm({
  initial,
}: {
  initial: PricingIntroContent;
}) {
  const [content, setContent] = useState<PricingIntroContent>(initial);

  return (
    <SectionFormShell
      sectionId="pricing_intro"
      title="Pricing intro"
      description="Header above the tier cards on /pricing."
      getContent={() => content}
    >
      <FieldGroup title="Copy">
        <TextInput
          label="Eyebrow"
          value={content.eyebrow}
          onChange={(v) => setContent({ ...content, eyebrow: v })}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Title — before accent"
            value={content.titlePart1}
            onChange={(v) => setContent({ ...content, titlePart1: v })}
            hint='Example: "Invest in your child’s "'
          />
          <TextInput
            label="Title accent (yellow)"
            value={content.titleAccent}
            onChange={(v) => setContent({ ...content, titleAccent: v })}
            hint='Example: "learning"'
          />
          <TextInput
            label="Title — after accent"
            value={content.titlePart2}
            onChange={(v) => setContent({ ...content, titlePart2: v })}
          />
        </div>
        <TextArea
          label="Subtitle"
          value={content.subtitle}
          rows={3}
          onChange={(v) => setContent({ ...content, subtitle: v })}
        />
      </FieldGroup>
    </SectionFormShell>
  );
}
