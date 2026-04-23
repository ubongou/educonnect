"use client";

import { useState } from "react";
import clsx from "clsx";
import { Container } from "@/components/ui/Container";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import { CurrencyToggle, currencySymbols, type Currency } from "./CurrencyToggle";

type Price = {
  perSession: number;
  total: number;
  saving: number;
  free: number;
};

type Tier = {
  sessions: number;
  duration: string;
  popular: boolean;
  prices: Record<Currency, Price>;
};

const tiers: Tier[] = [
  {
    sessions: 8,
    duration: "~1 month at 2x / week",
    popular: false,
    prices: {
      NGN: { perSession: 20000, total: 160000, saving: 0, free: 0 },
      USD: { perSession: 15, total: 120, saving: 0, free: 0 },
      GBP: { perSession: 11, total: 88, saving: 0, free: 0 },
      CAD: { perSession: 21, total: 168, saving: 0, free: 0 },
    },
  },
  {
    sessions: 24,
    duration: "~3 months at 2x / week",
    popular: true,
    prices: {
      NGN: { perSession: 18333, total: 440000, saving: 40000, free: 2 },
      USD: { perSession: 13.75, total: 330, saving: 30, free: 2 },
      GBP: { perSession: 10.08, total: 242, saving: 22, free: 2 },
      CAD: { perSession: 19.25, total: 462, saving: 42, free: 2 },
    },
  },
  {
    sessions: 48,
    duration: "~6 months at 2x / week",
    popular: false,
    prices: {
      NGN: { perSession: 17500, total: 840000, saving: 120000, free: 6 },
      USD: { perSession: 13.13, total: 630, saving: 90, free: 6 },
      GBP: { perSession: 9.63, total: 462, saving: 66, free: 6 },
      CAD: { perSession: 18.38, total: 882, saving: 126, free: 6 },
    },
  },
];

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

export function PricingTable() {
  const [currency, setCurrency] = useState<Currency>("NGN");

  return (
    <section className="bg-navy bg-dot-blue">
      <div className="px-10 pt-[72px] pb-14 text-center">
        <span className="mb-[14px] block text-[11px] font-bold uppercase tracking-[0.12em] text-blue">
          Pricing
        </span>
        <h1 className="font-heading text-[clamp(30px,4vw,48px)] font-extrabold text-white">
          Session packages, not subscriptions
        </h1>
        <p className="mx-auto mt-[14px] mb-8 max-w-[560px] text-[17px] leading-[1.7] text-white/55">
          All sessions are one-on-one. Pay once for the package that fits, the more sessions you
          commit to, the lower the per-session rate.
        </p>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <Container className="pb-20">
        <div className="grid gap-5 pt-4 md:grid-cols-3">
          {tiers.map((tier, i) => {
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
                      Standard rate — no commitment
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
          <IntersectionFade>
            <div className="h-full rounded-md border border-white/10 bg-white/[0.03] px-6 py-5">
              <h4 className="mb-[6px] text-[14px] font-bold text-white">
                All sessions are one-on-one
              </h4>
              <p className="text-[13px] leading-[1.65] text-white/55">
                Every session is private, focused entirely on your child. No shared classes, no
                group settings.
              </p>
            </div>
          </IntersectionFade>
          <IntersectionFade delay={120}>
            <div className="h-full rounded-md border border-white/10 bg-white/[0.03] px-6 py-5">
              <h4 className="mb-[6px] text-[14px] font-bold text-white">Flexible scheduling</h4>
              <p className="text-[13px] leading-[1.65] text-white/55">
                Sessions are booked at times that work for your family. Reschedule with 24 hours
                notice.
              </p>
            </div>
          </IntersectionFade>
          <IntersectionFade delay={240}>
            <div className="h-full rounded-md border border-white/10 bg-white/[0.03] px-6 py-5">
              <h4 className="mb-[6px] text-[14px] font-bold text-white">
                Not sure which package?
              </h4>
              <p className="text-[13px] leading-[1.65] text-white/55">
                Book a free consultation first. We&apos;ll recommend the right package after
                understanding your child&apos;s needs.
              </p>
            </div>
          </IntersectionFade>
        </div>
      </Container>
    </section>
  );
}
