"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextInput, FieldGroup } from "./fields";
import type { GlobalsContent } from "@/lib/marketing/schemas";

export function GlobalsForm({ initial }: { initial: GlobalsContent }) {
  const [content, setContent] = useState<GlobalsContent>(initial);

  return (
    <SectionFormShell
      sectionId="globals"
      title="Site globals"
      description="Booking link and contact details that appear in multiple places — Hero, Nav, How it works, Final CTA, and Contact section."
      getContent={() => content}
    >
      <FieldGroup title="Booking">
        <TextInput
          label="Booking URL"
          value={content.bookingUrl}
          onChange={(v) => setContent({ ...content, bookingUrl: v })}
          hint="The Calendly / Google Calendar link used by every Book a session button."
        />
      </FieldGroup>

      <FieldGroup title="Contact">
        <TextInput
          label="Admin email"
          value={content.adminEmail}
          onChange={(v) => setContent({ ...content, adminEmail: v })}
        />
        <TextInput
          label="Public website URL"
          value={content.websiteUrl}
          onChange={(v) => setContent({ ...content, websiteUrl: v })}
        />
      </FieldGroup>

      <FieldGroup title="Social">
        <TextInput
          label="Instagram URL"
          value={content.instagramUrl}
          onChange={(v) => setContent({ ...content, instagramUrl: v })}
          hint="Leave blank to hide the Instagram pill in the contact section."
        />
        <TextInput
          label="Facebook URL"
          value={content.facebookUrl}
          onChange={(v) => setContent({ ...content, facebookUrl: v })}
          hint="Leave blank to hide the Facebook pill."
        />
      </FieldGroup>
    </SectionFormShell>
  );
}
