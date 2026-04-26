"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import type { PricingInfoCardsContent } from "@/lib/marketing/schemas";

export function PricingInfoCardsForm({
  initial,
}: {
  initial: PricingInfoCardsContent;
}) {
  const [content, setContent] = useState<PricingInfoCardsContent>(initial);

  function updateCard(
    i: number,
    patch: Partial<PricingInfoCardsContent["cards"][number]>,
  ) {
    const cards = [...content.cards] as PricingInfoCardsContent["cards"];
    cards[i] = { ...cards[i], ...patch };
    setContent({ ...content, cards });
  }

  return (
    <SectionFormShell
      sectionId="pricing_info_cards"
      title="Pricing info cards"
      description="Three reassurance cards under the tier table on /pricing."
      getContent={() => content}
    >
      {content.cards.map((c, i) => (
        <FieldGroup key={i} title={`Card ${i + 1}`}>
          <TextInput
            label="Title"
            value={c.title}
            onChange={(v) => updateCard(i, { title: v })}
          />
          <TextArea
            label="Body"
            value={c.body}
            rows={3}
            onChange={(v) => updateCard(i, { body: v })}
          />
        </FieldGroup>
      ))}
    </SectionFormShell>
  );
}
