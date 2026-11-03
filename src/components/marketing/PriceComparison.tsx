"use client";

import Link from "next/link";
import type { Currency } from "./CurrencyToggle";
import type { PricingTiersContent } from "@/lib/marketing/schemas";
import { trackEvent } from "@/lib/analytics";

/**
 * Typical hourly rates for one to one private tutoring, school age, in the
 * countries most Masani families live in. No official figure exists in any of
 * the three; these are ranges where the sources listed in
 * `localRateSources` broadly agree. Checked November 2026. Update together.
 */
export const localRates: Partial<Record<Currency, { low: number; high: number; country: string }>> = {
  GBP: { low: 30, high: 40, country: "the UK" },
  USD: { low: 30, high: 60, country: "the US" },
  CAD: { low: 40, high: 75, country: "Canada" },
};

export const localRateSources: { label: string; href: string }[] = [
  { label: "Tutorperch, UK Private Tutoring Rate Report 2026", href: "https://tutorperch.com/research/uk-tuition-rate-report-2026" },
  { label: "TutorCruncher, Average Tutoring Rates UK 2026", href: "https://tutorcruncher.com/blog/average-tutoring-rates-uk" },
  { label: "Wise, Average Tutoring Rate Per Hour in the USA, 2026", href: "https://www.wise.live/blog/average-tutoring-rate-in-the-usa/" },
  { label: "Brighterly, Average Tutoring Rates Per Hour 2026", href: "https://brighterly.com/blog/tutoring-rates-per-hour/" },
  { label: "TutorLyft, How Much Does a Tutor Cost Per Hour in Canada?", href: "https://www.tutorlyft.com/blogs/how-much-does-a-tutor-cost-per-hour-in-canada" },
  { label: "Biller, Tutoring Rates in Canada 2026", href: "https://biller.ca/pricing-guides/how-much-to-charge-tutoring-canada" },
];

type Mark = "yes" | "some" | "no";

const features: { label: string; local: [Mark, string]; masani: string }[] = [
  { label: "Teacher vetting", local: ["some", "Up to you to check"], masani: "Top 3% of applicants" },
  { label: "Written report after every lesson", local: ["no", "Not usually"], masani: "Every lesson" },
  { label: "Lessons recorded to rewatch", local: ["no", "Not usually"], masani: "Every lesson" },
  { label: "Progress tracked skill by skill", local: ["no", "Not usually"], masani: "Parent dashboard" },
  { label: "Change teacher if it isn't working", local: ["some", "Start your search again"], masani: "Any time, free" },
  { label: "Travel", local: ["some", "Sometimes, or a travel fee"], masani: "None, it's online" },
  { label: "Guarantee", local: ["no", "Not usually"], masani: "The Masani Promise" },
];

const glyph: Record<Mark, string> = { yes: "✓", some: "~", no: "–" };

function money(symbol: string, n: number): string {
  const r = Math.round(n * 100) / 100;
  return (
    symbol +
    r.toLocaleString("en", {
      minimumFractionDigits: r % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

export function PriceComparison({
  tiers,
  currency,
  symbol,
}: {
  tiers: PricingTiersContent;
  currency: Currency;
  symbol: string;
}) {
  const local = localRates[currency];
  const perSession = tiers.tiers.map((t) => t.prices[currency].perSession);
  const minPer = Math.min(...perSession);
  const maxPer = Math.max(...perSession);
  const largest = tiers.tiers.reduce((a, b) => (b.sessions > a.sessions ? b : a));
  const largestTotal = largest.prices[currency].total;

  return (
    <section className="cmp-section" aria-labelledby="cmp-heading">
      <div className="container">
        <h2 id="cmp-heading" className="cmp-title">
          Masani next to a local tutor
        </h2>
        <p className="cmp-intro">
          What a typical private tutor costs where our families live, and what comes with each.
        </p>

        <div className="cmp-table-wrap">
          <table className="cmp-table">
            <thead>
              <tr>
                <td />
                <th scope="col">Typical local tutor</th>
                <th scope="col" className="cmp-m">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/logo-transparent.png"
                    alt="Masani"
                    width={1400}
                    height={233}
                    loading="lazy"
                    className="cmp-logo"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="cmp-group">
                <th scope="colgroup" colSpan={2}>
                  Cost
                </th>
                <td className="cmp-m" />
              </tr>
              {local ? (
                <>
                  <tr>
                    <th scope="row">Per session</th>
                    <td className="cmp-price">
                      {money(symbol, local.low)} – {money(symbol, local.high)}
                      <span className="cmp-sub">an hour</span>
                    </td>
                    <td className="cmp-m cmp-price">
                      {money(symbol, minPer)} – {money(symbol, maxPer)}
                      <span className="cmp-sub">depends on package</span>
                    </td>
                  </tr>
                  {tiers.tiers.map((t) => {
                    const p = t.prices[currency];
                    const lo = local.low * t.sessions;
                    const hi = local.high * t.sessions;
                    const save = lo - p.total;
                    return (
                      <tr key={t.sessions}>
                        <th scope="row">
                          {t.sessions} sessions
                          <span className="cmp-sub">
                            {p.free > 0 ? `includes ${p.free} free with Masani` : t.duration}
                          </span>
                        </th>
                        <td className="cmp-price">
                          {money(symbol, lo)} – {money(symbol, hi)}
                        </td>
                        <td className="cmp-m cmp-price">
                          {money(symbol, p.total)}
                          {save > 0 && <span className="cmp-save">save {money(symbol, save)}+</span>}
                        </td>
                      </tr>
                    );
                  })}
                </>
              ) : (
                <tr>
                  <td colSpan={3} className="cmp-note">
                    Switch to £, $ or CA$ above to compare with local tutor prices in the UK, US or Canada.
                  </td>
                </tr>
              )}
              <tr className="cmp-group">
                <th scope="colgroup" colSpan={2}>
                  What you get
                </th>
                <td className="cmp-m" />
              </tr>
              {features.map((f) => (
                <tr key={f.label}>
                  <th scope="row">{f.label}</th>
                  <td>
                    <span className={`cmp-mark cmp-${f.local[0]}`}>
                      <span className="cmp-dot" aria-hidden="true">
                        {glyph[f.local[0]]}
                      </span>
                      {f.local[1]}
                    </span>
                  </td>
                  <td className="cmp-m">
                    <span className="cmp-mark cmp-yes">
                      <span className="cmp-dot" aria-hidden="true">
                        {glyph.yes}
                      </span>
                      {f.masani}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {local && (
          <p className="cmp-foot">
            Local prices are typical hourly rates for one to one private tutoring in {local.country}, checked
            November 2026. <a href="#sources">Sources</a>
          </p>
        )}

        {local && (
          <div className="cmp-callout">
            <p>
              {largest.sessions} Masani sessions cost about the same as{" "}
              <strong>
                {Math.round(largestTotal / local.high)}–{Math.round(largestTotal / local.low)} sessions
              </strong>{" "}
              with a local tutor.
            </p>
            <Link
              href="/book?source=pricing-compare"
              className="btn btn-coral"
              onClick={() => trackEvent("click_book_session", { source: "pricing", tier: "comparison" })}
            >
              Book a free consultation
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/** Source list for the comparison, shown at the bottom of the pricing page. */
export function PriceComparisonSources() {
  return (
    <section id="sources" className="cmp-sources" aria-labelledby="cmp-sources-heading">
      <div className="container">
        <h2 id="cmp-sources-heading">Sources for local tutoring prices</h2>
        <p>
          There is no official figure for private tutoring rates in the UK, US or Canada. The ranges in our
          comparison are where these published guides broadly agree. Checked November 2026.
        </p>
        <ul>
          {localRateSources.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
