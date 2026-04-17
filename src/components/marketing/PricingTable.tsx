"use client";

import { useState } from "react";
import clsx from "clsx";
import { Container } from "@/components/ui/Container";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import { CurrencyToggle, currencySymbols, type Currency } from "./CurrencyToggle";

type Prices = Record<Currency, string>;

type Plan = {
  type: string;
  monthly: Prices;
  totalToday?: Prices;
  savings?: Prices;
  featured?: boolean;
  badge?: string;
};

type Tier = {
  label: string;
  plans: Plan[];
};

const tiers: Tier[] = [
  {
    label: "2 sessions per week",
    plans: [
      {
        type: "Monthly",
        monthly: { USD: "138", GBP: "109", CAD: "187", NGN: "173,000" },
      },
      {
        type: "3 months upfront",
        monthly: { USD: "131", GBP: "103", CAD: "178", NGN: "164,000" },
        totalToday: { USD: "394", GBP: "309", CAD: "534", NGN: "492,000" },
        savings: { USD: "22", GBP: "18", CAD: "27", NGN: "27,000" },
      },
      {
        type: "6 months upfront",
        monthly: { USD: "125", GBP: "99", CAD: "170", NGN: "156,000" },
        totalToday: { USD: "749", GBP: "594", CAD: "1,020", NGN: "936,000" },
        savings: { USD: "82", GBP: "60", CAD: "102", NGN: "102,000" },
      },
    ],
  },
  {
    label: "3 sessions per week",
    plans: [
      {
        type: "Monthly",
        monthly: { USD: "200", GBP: "158", CAD: "272", NGN: "250,000" },
      },
      {
        type: "3 months upfront",
        monthly: { USD: "190", GBP: "150", CAD: "259", NGN: "238,000" },
        totalToday: { USD: "571", GBP: "451", CAD: "777", NGN: "714,000" },
        savings: { USD: "29", GBP: "24", CAD: "39", NGN: "36,000" },
        featured: true,
        badge: "Most popular",
      },
      {
        type: "6 months upfront",
        monthly: { USD: "180", GBP: "142", CAD: "245", NGN: "225,000" },
        totalToday: { USD: "1,080", GBP: "852", CAD: "1,470", NGN: "1,350,000" },
        savings: { USD: "120", GBP: "96", CAD: "162", NGN: "150,000" },
      },
    ],
  },
  {
    label: "4 sessions per week",
    plans: [
      {
        type: "Monthly",
        monthly: { USD: "255", GBP: "201", CAD: "346", NGN: "318,000" },
      },
      {
        type: "3 months upfront",
        monthly: { USD: "242", GBP: "191", CAD: "329", NGN: "302,000" },
        totalToday: { USD: "725", GBP: "573", CAD: "987", NGN: "906,000" },
        savings: { USD: "38", GBP: "30", CAD: "51", NGN: "48,000" },
      },
      {
        type: "6 months upfront",
        monthly: { USD: "229", GBP: "181", CAD: "312", NGN: "286,000" },
        totalToday: { USD: "1,373", GBP: "1,086", CAD: "1,872", NGN: "1,716,000" },
        savings: { USD: "154", GBP: "120", CAD: "204", NGN: "192,000" },
      },
    ],
  },
];

export function PricingTable() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const symbol = currencySymbols[currency];

  return (
    <>
      <div className="bg-navy bg-dot-blue px-10 pt-[72px] pb-20 text-center">
        <div className="relative">
          <span className="mb-[14px] block text-[11px] font-bold uppercase tracking-[0.12em] text-blue">
            Pricing
          </span>
          <h1 className="font-heading text-[clamp(30px,4vw,48px)] font-extrabold text-white">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-[14px] mb-8 max-w-[520px] text-[17px] leading-[1.7] text-white/55">
            All sessions are one-on-one. Choose your frequency and payment schedule — the more you
            commit upfront, the more you save.
          </p>
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
      </div>

      <Container className="py-16">
        {tiers.map((tier, ti) => (
          <IntersectionFade key={tier.label} delay={ti * 120} className="mb-14 last:mb-0">
            <div className="mb-4 border-b border-g100 pb-3 font-heading text-[12px] font-bold uppercase tracking-[0.1em] text-blue">
              {tier.label}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {tier.plans.map((p) => (
                <div
                  key={p.type}
                  className={clsx(
                    "relative rounded-lg bg-white p-7 transition-[transform,border-color] duration-200 hover:-translate-y-[3px]",
                    p.featured
                      ? "border-[2.5px] border-yellow"
                      : "border-[1.5px] border-g100 hover:border-g400",
                  )}
                >
                  {p.badge && (
                    <span className="absolute -top-[14px] left-1/2 -translate-x-1/2 rounded-pill bg-yellow px-4 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.06em] text-navy">
                      {p.badge}
                    </span>
                  )}
                  <p className="mb-[10px] font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
                    {p.type}
                  </p>
                  <p className="font-heading text-[38px] font-extrabold leading-none text-navy">
                    <span>{symbol}</span>
                    <span className="tabular-nums">{p.monthly[currency]}</span>
                  </p>
                  <p className="mt-1 text-[14px] text-g400">/ mo</p>
                  <div className="my-[14px] h-px bg-g100" />
                  {p.totalToday && p.savings ? (
                    <>
                      <p className="mb-[6px] text-[13px] text-g600">
                        Pay{" "}
                        <span className="font-bold text-navy">
                          {symbol}
                          <span className="tabular-nums">{p.totalToday[currency]}</span>
                        </span>{" "}
                        today
                      </p>
                      <p className="text-[13px] font-bold text-[#1a9e5a]">
                        Save {symbol}
                        <span className="tabular-nums">{p.savings[currency]}</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-[12px] italic text-g400">No commitment required</p>
                  )}
                </div>
              ))}
            </div>
          </IntersectionFade>
        ))}
      </Container>

      <Container className="pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          <IntersectionFade>
            <div className="rounded-md border-[1.5px] border-g100 bg-white px-6 py-5">
              <h4 className="mb-[6px] text-[14px] font-bold text-navy">All sessions are one-on-one</h4>
              <p className="text-[13px] leading-[1.65] text-g600">
                Every session is private, focused entirely on your child. No shared classes, no
                group settings.
              </p>
            </div>
          </IntersectionFade>
          <IntersectionFade delay={120}>
            <div className="rounded-md border-[1.5px] border-g100 bg-white px-6 py-5">
              <h4 className="mb-[6px] text-[14px] font-bold text-navy">Flexible scheduling</h4>
              <p className="text-[13px] leading-[1.65] text-g600">
                Sessions are booked at times that work for your family. Reschedule with 24 hours
                notice.
              </p>
            </div>
          </IntersectionFade>
          <IntersectionFade delay={240}>
            <div className="rounded-md border-[1.5px] border-g100 bg-white px-6 py-5">
              <h4 className="mb-[6px] text-[14px] font-bold text-navy">Not sure which plan?</h4>
              <p className="text-[13px] leading-[1.65] text-g600">
                Book a free consultation first. We&apos;ll recommend the right plan after
                understanding your child&apos;s needs.
              </p>
            </div>
          </IntersectionFade>
        </div>
      </Container>
    </>
  );
}
