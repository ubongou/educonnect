"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import type { TestimonialsContent } from "@/lib/marketing/schemas";

export function TestimonialsForm({
  initial,
}: {
  initial: TestimonialsContent;
}) {
  const [content, setContent] = useState<TestimonialsContent>(initial);

  function updateQuote(
    i: number,
    patch: Partial<TestimonialsContent["quotes"][number]>,
  ) {
    const next = [...content.quotes] as TestimonialsContent["quotes"];
    next[i] = { ...next[i], ...patch };
    setContent({ ...content, quotes: next });
  }

  return (
    <SectionFormShell
      sectionId="testimonials"
      title="Testimonials"
      description="Three parent quotes."
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
      </FieldGroup>

      {content.quotes.map((q, i) => (
        <FieldGroup key={i} title={`Quote ${i + 1}`}>
          <TextArea
            label="Body"
            value={q.body}
            rows={5}
            onChange={(v) => updateQuote(i, { body: v })}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              label="Author name"
              value={q.author}
              onChange={(v) => updateQuote(i, { author: v })}
            />
            <TextInput
              label="Location"
              value={q.where}
              onChange={(v) => updateQuote(i, { where: v })}
              hint='Example: "Scotland, UK"'
            />
            <TextInput
              label="Avatar initial"
              value={q.initial}
              onChange={(v) => updateQuote(i, { initial: v.slice(0, 2) })}
              hint="1–2 characters"
            />
          </div>
        </FieldGroup>
      ))}
    </SectionFormShell>
  );
}
