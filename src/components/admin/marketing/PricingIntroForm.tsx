"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import type { PricingIntroContent } from "@/lib/marketing/schemas";

export function PricingIntroForm({ initial }: { initial: PricingIntroContent }) {
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
    </SectionFormShell>
  );
}
