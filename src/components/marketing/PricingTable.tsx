"use client";

import { useState } from "react";
import clsx from "clsx";
import { Container } from "@/components/ui/Container";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import { CurrencyToggle, currencySymbols, type Currency } from "./CurrencyToggle";
import type {
  PricingInfoCardsContent,
  PricingIntroContent,
  PricingTiersContent,
} from "@/lib/marketing/schemas";

function fmt(value: number, currency: Currency) {
  const symbol = currencySymbols[currency];
  if (currency === "NGN") {
    return `${symbol}${Math.round(value).toLocaleString("en")}`;
  }
  const rounded = Math.round(value * 100) / 100;
  return `${symbol}${rounded.toLocaleString("en", {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PricingTable({
  intro,
  tiers,
  infoCards,
}: {
  intro: PricingIntroContent;
  tiers: PricingTiersContent;
  infoCards: PricingInfoCardsContent;
}) {
  const [currency, setCurrency] = useState<Currency>("NGN");

  return (
    <section className="bg-navy bg-dot-blue">
      <div className="px-10 pt-[72px] pb-14 text-center">
        <span className="mb-[14px] block text-[11px] font-bold uppercase tracking-[0.12em] text-blue">
          {intro.eyebrow}
        </span>
        <h1 className="font-heading text-[clamp(30px,4vw,48px)] font-extrabold text-white">
          {intro.title}
        </h1>
        <p className="mx-auto mt-[14px] mb-8 max-w-[560px] text-[17px] leading-[1.7] text-white/55">
          {intro.subtitle}
        </p>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <Container className="pb-20">
        <div className="grid gap-5 pt-4 md:grid-cols-3">
          {tiers.tiers.map((tier, i) => {
            const p = tier.prices[currency];
            const hasSaving = p.saving > 0;
            return (
              <IntersectionFade key={tier.sessions} delay={i * 120}>
                <div
                  className={clsx(
                    "relative flex h-full flex-col rounded-lg bg-[#0D1F30] p-7 transition-transform duration-200 hover:-translate-y-[3px]",
                    tier.popular
                      ? "border-2 border-yellow"
                      : "border border-white/10 hover:border-white/20",
                  )}
                >
                  {tier.popular && (
                    <span className="absolute -top-[14px] left-1/2 -translate-x-1/2 rounded-pill bg-yellow px-4 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.06em] text-navy">
                      Most popular
                    </span>
                  )}

                  <p className="mb-[4px] text-[12px] font-bold uppercase tracking-[0.08em] text-blue">
                    {tier.sessions} sessions
                  </p>
                  <p className="mb-6 text-[13px] text-white/50">{tier.duration}</p>

                  <p className="mb-[6px] text-[11px] font-bold uppercase tracking-[0.08em] text-white/40">
                    Pay today
                  </p>
                  <p className="font-heading text-[40px] font-extrabold leading-none text-white tabular-nums">
                    {fmt(p.total, currency)}
                  </p>

                  <div className="my-[18px] h-px bg-white/10" />

                  {hasSaving ? (
                    <>
                      <p className="text-[14px] font-bold text-[#1D9E75]">
                        Save {fmt(p.saving, currency)}
                      </p>
                      <p className="mt-[2px] text-[12px] text-[#1D9E75]/80">
                        {p.free} free {p.free === 1 ? "session" : "sessions"} equivalent
                      </p>
                    </>
                  ) : (
                    <p className="text-[12px] italic text-white/40">
                      {tier.noCommitmentMessage}
                    </p>
                  )}

                  <p className="mt-auto pt-6 text-[12px] text-white/35 tabular-nums">
                    {fmt(p.perSession, currency)} per session
                  </p>
                </div>
              </IntersectionFade>
            );
          })}
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {infoCards.cards.map((card, i) => (
            <IntersectionFade key={card.title} delay={i * 120}>
              <div className="h-full rounded-md border border-white/10 bg-white/[0.03] px-6 py-5">
                <h4 className="mb-[6px] text-[14px] font-bold text-white">
                  {card.title}
                </h4>
                <p className="text-[13px] leading-[1.65] text-white/55">{card.body}</p>
              </div>
            </IntersectionFade>
          ))}
        </div>
      </Container>
    </section>
  );
}
