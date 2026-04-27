"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import { ImageUploadField } from "./ImageUploadField";
import { bundledAssets } from "@/lib/marketing/defaults";
import type { FoundersContent } from "@/lib/marketing/schemas";

export function FoundersForm({ initial }: { initial: FoundersContent }) {
  const [content, setContent] = useState<FoundersContent>(initial);

  function updateFounder(
    i: number,
    patch: Partial<FoundersContent["founders"][number]>,
  ) {
    const next = [...content.founders] as FoundersContent["founders"];
    next[i] = { ...next[i], ...patch };
    setContent({ ...content, founders: next });
  }

  return (
    <SectionFormShell
      sectionId="founders"
      title="Founders"
      description="The 'Built on one belief' intro plus two founder bios."
      getContent={() => content}
    >
      <FieldGroup title="Intro">
        <TextInput
          label="Eyebrow"
          value={content.eyebrow}
          onChange={(v) => setContent({ ...content, eyebrow: v })}
        />
        <TextInput
          label="Heading lead (regular text)"
          value={content.headingLead}
          onChange={(v) => setContent({ ...content, headingLead: v })}
          hint='Example: "Built on one belief: "'
        />
        <TextInput
          label="Heading highlight (coral italic)"
          value={content.headingHighlight}
          onChange={(v) => setContent({ ...content, headingHighlight: v })}
          hint='Example: "teaching quality determines everything."'
        />
        <TextArea
          label="Intro paragraph"
          value={content.intro}
          rows={5}
          onChange={(v) => setContent({ ...content, intro: v })}
        />
        <TextArea
          label="Second paragraph (optional)"
          value={content.intro2}
          rows={3}
          onChange={(v) => setContent({ ...content, intro2: v })}
        />
      </FieldGroup>

      {content.founders.map((f, i) => (
        <FieldGroup key={i} title={`Founder ${i + 1}`}>
          <TextInput
            label="Name"
            value={f.name}
            onChange={(v) => updateFounder(i, { name: v })}
          />
          <TextInput
            label="Role tag (shown on photo)"
            value={f.role}
            onChange={(v) => updateFounder(i, { role: v })}
            hint='Example: "Co-founder"'
          />
          <TextArea
            label="Bio"
            value={f.bio}
            rows={6}
            onChange={(v) => updateFounder(i, { bio: v })}
          />
          <ImageUploadField
            label="Portrait"
            helpText="16:10 landscape crop, photo taken from a slight distance."
            section="founders"
            slot={`founder-${i}`}
            storagePath={f.photoPath}
            fallbackPreview={
              bundledAssets.founderPhotos[i] ?? bundledAssets.founderPhotos[0]
            }
            onChange={(storagePath) =>
              updateFounder(i, { photoPath: storagePath })
            }
          />
          <TextInput
            label="Photo alt text"
            value={f.photoAlt}
            onChange={(v) => updateFounder(i, { photoAlt: v })}
          />
        </FieldGroup>
      ))}
    </SectionFormShell>
  );
}
