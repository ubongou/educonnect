"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import type { ContactContent } from "@/lib/marketing/schemas";

export function ContactForm({ initial }: { initial: ContactContent }) {
  const [content, setContent] = useState<ContactContent>(initial);

  return (
    <SectionFormShell
      sectionId="contact"
      title="Contact section"
      description="The 'Let's talk' section at the bottom of the homepage."
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
          label="Lead paragraph"
          value={content.lead}
          rows={3}
          onChange={(v) => setContent({ ...content, lead: v })}
        />
      </FieldGroup>

      <FieldGroup title="Contact links">
        <TextInput
          label="Email"
          value={content.email}
          onChange={(v) => setContent({ ...content, email: v })}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Instagram label"
            value={content.instagramLabel}
            onChange={(v) => setContent({ ...content, instagramLabel: v })}
            hint='Example: "Instagram · @educonnectng"'
          />
          <TextInput
            label="Instagram URL"
            value={content.instagramUrl}
            onChange={(v) => setContent({ ...content, instagramUrl: v })}
            hint="Leave blank to hide the link."
          />
          <TextInput
            label="Facebook label"
            value={content.facebookLabel}
            onChange={(v) => setContent({ ...content, facebookLabel: v })}
            hint='Example: "Facebook · EduConnect"'
          />
          <TextInput
            label="Facebook URL"
            value={content.facebookUrl}
            onChange={(v) => setContent({ ...content, facebookUrl: v })}
            hint="Leave blank to hide the link."
          />
        </div>
      </FieldGroup>
    </SectionFormShell>
  );
}
