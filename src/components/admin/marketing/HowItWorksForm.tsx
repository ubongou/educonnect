"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import { ImageUploadField } from "./ImageUploadField";
import { bundledAssets } from "@/lib/marketing/defaults";
import type { HowItWorksContent } from "@/lib/marketing/schemas";

export function HowItWorksForm({ initial }: { initial: HowItWorksContent }) {
  const [content, setContent] = useState<HowItWorksContent>(initial);

  return (
    <SectionFormShell
      sectionId="how_it_works"
      title="Data driven results"
      description="Dark navy section with the parent dashboard preview."
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

      <FieldGroup title="Dashboard preview image">
        <ImageUploadField
          label="Image"
          helpText="Wide screenshot of the parent dashboard. Recommended 1440×740 PNG."
          section="how_it_works"
          slot="dashboard"
          storagePath={content.imagePath}
          fallbackPreview={bundledAssets.dashboardImage}
          onChange={(storagePath) =>
            setContent({ ...content, imagePath: storagePath })
          }
        />
        <TextInput
          label="Alt text"
          value={content.imageAlt}
          onChange={(v) => setContent({ ...content, imageAlt: v })}
        />
      </FieldGroup>
    </SectionFormShell>
  );
}
