"use client";

import { useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { CurrencyToggle, currencySymbols, type Currency } from "./CurrencyToggle";
import type {
  PricingIntroContent,
  PricingTiersContent,
} from "@/lib/marketing/schemas";
import { trackEvent } from "@/lib/analytics";

function fmt(value: number, currency: Currency): string {
  const symbol = currencySymbols[currency];
  if (currency === "NGN") {
    return symbol + Math.round(value).toLocaleString("en");
  }
  const rounded = Math.round(value * 100) / 100;
  return (
    symbol +
    rounded.toLocaleString("en", {
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

export function PricingTable({
  intro,
  tiers,
}: {
  intro: PricingIntroContent;
  tiers: PricingTiersContent;
}) {
  const [currency, setCurrency] = useState<Currency>("USD");

  return (
    <section className="pricing-hero" aria-labelledby="pricing-heading">
      <div className="container pricing-hero-content">
        <h1 id="pricing-heading" className="reveal delay-1">
          {intro.titlePart1}
          {intro.titlePart1 && intro.titleAccent ? " " : null}
          {intro.titleAccent && (
            <span className="accent">{intro.titleAccent}</span>
          )}
          {intro.titleAccent && intro.titlePart2 ? " " : null}
          {intro.titlePart2}
        </h1>
        <p className="reveal delay-2">{intro.subtitle}</p>
      </div>

      <div className="container reveal delay-2">
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <div className="container">
        <div
          className="pricing-grid"
          aria-live="polite"
          aria-label="Pricing plans"
        >
          {tiers.tiers.map((tier) => {
            const p = tier.prices[currency];
            const hasSaving = p.saving > 0;
            return (
              <div
                key={tier.sessions}
                className={clsx("pricing-card", tier.popular && "popular")}
              >
                <div className="pricing-header">
                  <div className="pricing-sessions">
                    {tier.sessions} sessions
                  </div>
                  {tier.popular && (
                    <div className="pricing-badge">Most popular</div>
                  )}
                </div>
                <div className="pricing-duration">{tier.duration}</div>
                <div className="pricing-per-session-label">Per session</div>
                <div className="pricing-per-session-price">
                  {fmt(p.perSession, currency)}
                </div>
                <hr className="pricing-divider" />
                <div className="pricing-today-block">
                  <div className="pricing-today-label">Pay today</div>
                  <div className="pricing-today-total">
                    {fmt(p.total, currency)}
                  </div>
                </div>
                <div className="pricing-savings-block">
                  {hasSaving ? (
                    <>
                      <div className="pricing-save">
                        Save {fmt(p.saving, currency)}
                      </div>
                      <div className="pricing-free">
                        {p.free} free sessions equivalent
                      </div>
                    </>
                  ) : (
                    <div className="pricing-no-commit">
                      {tier.noCommitmentMessage}
                    </div>
                  )}
                </div>
                <div className="pricing-cta">
                  <Link
                    href={`/book?source=pricing-${tier.sessions}`}
                    className="btn btn-coral"
                    onClick={() =>
                      trackEvent("click_book_session", {
                        source: "pricing",
                        tier: `${tier.sessions} sessions`,
                      })
                    }
                  >
                    Book a session{" "}
                    <span className="arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
