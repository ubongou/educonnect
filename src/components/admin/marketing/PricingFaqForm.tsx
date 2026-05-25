"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import type { PricingFaqContent } from "@/lib/marketing/schemas";

export function PricingFaqForm({ initial }: { initial: PricingFaqContent }) {
  const [content, setContent] = useState<PricingFaqContent>(initial);

  function updateItem(
    i: number,
    patch: Partial<PricingFaqContent["items"][number]>,
  ) {
    const next = [...content.items];
    next[i] = { ...next[i], ...patch };
    setContent({ ...content, items: next });
  }

  function addItem() {
    if (content.items.length >= 12) return;
    setContent({
      ...content,
      items: [...content.items, { question: "", answer: "" }],
    });
  }

  function removeItem(i: number) {
    if (content.items.length <= 1) return;
    setContent({
      ...content,
      items: content.items.filter((_, idx) => idx !== i),
    });
  }

  return (
    <SectionFormShell
      sectionId="pricing_faq"
      title="Pricing FAQ"
      description="Accordion FAQ under the pricing tiers."
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
          label="Intro (right column)"
          value={content.intro}
          rows={3}
          onChange={(v) => setContent({ ...content, intro: v })}
        />
      </FieldGroup>

      {content.items.map((item, i) => (
        <FieldGroup key={i} title={`Item ${i + 1}`}>
          <TextInput
            label="Question"
            value={item.question}
            onChange={(v) => updateItem(i, { question: v })}
          />
          <TextArea
            label="Answer"
            value={item.answer}
            rows={4}
            onChange={(v) => updateItem(i, { answer: v })}
          />
          {content.items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="self-start rounded-pill border border-coral/40 px-4 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-coral transition-colors hover:bg-coral hover:text-white"
            >
              Remove item
            </button>
          )}
        </FieldGroup>
      ))}

      {content.items.length < 12 && (
        <button
          type="button"
          onClick={addItem}
          className="self-start rounded-pill border border-navy/30 px-5 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-navy transition-colors hover:bg-navy hover:text-white"
        >
          + Add FAQ item
        </button>
      )}
    </SectionFormShell>
  );
}
