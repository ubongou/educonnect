"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextInput, NumberInput, Checkbox, FieldGroup } from "./fields";
import {
  currencyCodes,
  type CurrencyCode,
  type PricingTiersContent,
  type Tier,
  type Price,
} from "@/lib/marketing/schemas";

export function PricingTiersForm({ initial }: { initial: PricingTiersContent }) {
  const [content, setContent] = useState<PricingTiersContent>(initial);

  function updateTier(i: number, patch: Partial<Tier>) {
    const tiers = [...content.tiers] as PricingTiersContent["tiers"];
    tiers[i] = { ...tiers[i], ...patch };
    setContent({ ...content, tiers });
  }

  function updatePrice(
    tierIdx: number,
    code: CurrencyCode,
    patch: Partial<Price>,
  ) {
    const tiers = [...content.tiers] as PricingTiersContent["tiers"];
    tiers[tierIdx] = {
      ...tiers[tierIdx],
      prices: {
        ...tiers[tierIdx].prices,
        [code]: { ...tiers[tierIdx].prices[code], ...patch },
      },
    };
    setContent({ ...content, tiers });
  }

  return (
    <SectionFormShell
      sectionId="pricing_tiers"
      title="Pricing tiers"
      description="Three session-package tiers, each with prices in NGN, USD, GBP, and CAD."
      getContent={() => content}
    >
      {content.tiers.map((tier, i) => (
        <FieldGroup key={i} title={`Tier ${i + 1}`}>
          <div className="grid gap-4 md:grid-cols-3">
            <NumberInput
              label="Sessions"
              value={tier.sessions}
              onChange={(v) => updateTier(i, { sessions: Math.round(v) })}
              step={1}
              min={1}
            />
            <TextInput
              label="Duration"
              value={tier.duration}
              onChange={(v) => updateTier(i, { duration: v })}
              hint='e.g. "~3 months at 2x / week"'
            />
            <Checkbox
              label='Mark as "Most popular"'
              checked={tier.popular}
              onChange={(v) => updateTier(i, { popular: v })}
              hint="At most one tier should have this enabled."
            />
          </div>
          <TextInput
            label="No-commitment line"
            value={tier.noCommitmentMessage}
            onChange={(v) => updateTier(i, { noCommitmentMessage: v })}
            hint="Shown in italic on tiers without savings."
          />

          {currencyCodes.map((code) => {
            const price = tier.prices[code];
            return (
              <div
                key={code}
                className="rounded-md border border-g100 bg-g50 p-4"
              >
                <p className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.1em] text-navy">
                  {code}
                </p>
                <div className="grid gap-3 md:grid-cols-4">
                  <NumberInput
                    label="Per session"
                    value={price.perSession}
                    onChange={(v) => updatePrice(i, code, { perSession: v })}
                    step={code === "NGN" ? 100 : 0.01}
                    min={0}
                  />
                  <NumberInput
                    label="Total"
                    value={price.total}
                    onChange={(v) => updatePrice(i, code, { total: v })}
                    step={code === "NGN" ? 1000 : 1}
                    min={0}
                  />
                  <NumberInput
                    label="Saving"
                    value={price.saving}
                    onChange={(v) => updatePrice(i, code, { saving: v })}
                    step={code === "NGN" ? 1000 : 1}
                    min={0}
                  />
                  <NumberInput
                    label="Free sessions equiv."
                    value={price.free}
                    onChange={(v) => updatePrice(i, code, { free: Math.round(v) })}
                    step={1}
                    min={0}
                  />
                </div>
              </div>
            );
          })}
        </FieldGroup>
      ))}
    </SectionFormShell>
  );
}
