"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import type { FinalCtaContent } from "@/lib/marketing/schemas";

export function FinalCtaForm({ initial }: { initial: FinalCtaContent }) {
  const [content, setContent] = useState<FinalCtaContent>(initial);

  return (
    <SectionFormShell
      sectionId="final_cta"
      title="Final CTA"
      description='The "Ready to get started?" yellow band at the bottom of the homepage and pricing page.'
      getContent={() => content}
    >
      <FieldGroup title="Copy">
        <TextInput
          label="Heading"
          value={content.heading}
          onChange={(v) => setContent({ ...content, heading: v })}
        />
        <TextArea
          label="Subheading"
          value={content.subheading}
          rows={3}
          onChange={(v) => setContent({ ...content, subheading: v })}
        />
        <TextInput
          label="CTA button label"
          value={content.ctaLabel}
          onChange={(v) => setContent({ ...content, ctaLabel: v })}
          hint="Destination is the booking link from Site globals."
        />
        <TextInput
          label="Disclaimer"
          value={content.disclaimer}
          onChange={(v) => setContent({ ...content, disclaimer: v })}
        />
      </FieldGroup>
    </SectionFormShell>
  );
}
