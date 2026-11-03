import Link from "next/link";
import { bookHref } from "@/lib/booking/schema";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import {
  defaultPricingTiers,
  defaultTestimonials,
} from "@/lib/marketing/defaults";
import { WhatsAppQuotes } from "@/components/marketing/WhatsAppQuotes";
import {
  everyFamilyGets,
  howItWorks,
  type Faq,
} from "@/lib/marketing/seoPages";
import { MIT_FELLOWSHIP } from "@/lib/seo";
import type { TierBadge } from "@/lib/marketing/schemas";

type Currency = "USD" | "GBP" | "CAD";

const symbols: Record<Currency, string> = { USD: "$", GBP: "£", CAD: "C$" };

export function money(value: number, currency: Currency): string {
  const rounded = Math.round(value * 100) / 100;
  return (
    symbols[currency] +
    rounded.toLocaleString("en", {
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Lowest per-session price across packages, for "from £x a session". */
export function fromPrice(currency: Currency): string {
  const min = Math.min(
    ...defaultPricingTiers.tiers.map((t) => t.prices[currency].perSession),
  );
  return money(min, currency);
}

export type ListBlock = { title: string; items: string[] };

/** A card that may link somewhere, with optional detail lines and tags. */
export type LinkCard = {
  id?: string;
  title: string;
  href?: string;
  meta?: string;
  body?: string;
  tags?: Array<{ label: string; href?: string }>;
  /** Short decorative mark shown above the title. */
  mark?: string;
};

export type LinkSection = { title: string; intro?: string; cards: LinkCard[] };

/** Same labels as the pricing page, so the two never disagree. */
const badgeLabels: Record<TierBadge, string> = {
  popular: "Most popular",
  economical: "Most economical",
};

/** Icons for the "every family gets" grid, in the order of `everyFamilyGets`. */
const familyIcons = [
  "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  "M2 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM17 10l5-3v10l-5-3z",
  "M3 3v18h18M7 14l4-4 4 4 5-6",
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  "M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
];

/**
 * The shared layout for search landing pages (subjects, exams and countries).
 *
 * Deliberately a server component with every word in the HTML: search engines
 * and AI crawlers read the initial response, so nothing here waits on
 * JavaScript. FAQs use native <details>, which keeps answers in the markup
 * while still collapsing for readers.
 */
export function LandingPage({
  breadcrumb,
  tags = [],
  glyph,
  h1,
  intro,
  bookingSource,
  bookingPageSlug,
  currency,
  blocks,
  approach,
  testimonialMatch,
  faqs,
  related,
  linkSections = [],
}: {
  breadcrumb: Array<{ name: string; path: string }>;
  /** Plain facts above the H1: ages, countries, when it's taken. */
  tags?: string[];
  /** Large decorative mark in the hero card. */
  glyph: string;
  h1: string;
  intro: string;
  bookingSource: string;
  /** /tutoring/[slug] slug, used to pre-select the subject on /book. */
  bookingPageSlug?: string;
  currency: Currency;
  blocks: ListBlock[];
  /** Shown as numbered steps in the hero card. Without it, the first block is. */
  approach?: { title: string; items: string[] };
  testimonialMatch?: RegExp;
  faqs: Faq[];
  related: Array<{
    title: string;
    links: Array<{ href: string; label: string }>;
  }>;
  /** Linked card grids after the lists, e.g. "Exams we prepare for". */
  linkSections?: LinkSection[];
}) {
  const bookingHref = bookHref(bookingSource, bookingPageSlug);
  const matched = testimonialMatch
    ? defaultTestimonials.quotes.filter((q) => testimonialMatch.test(q.where))
    : [];
  const quotes = matched.length > 0 ? matched : defaultTestimonials.quotes;
  const heroCard = approach ?? blocks[0];
  const [rows, checklist] = approach ? blocks : blocks.slice(1);
  const tiers = defaultPricingTiers.tiers;

  return (
    <div className="mkt-root">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content" className="lp">
        {/* Hero */}
        <section className="lx-hero" aria-labelledby="lp-h1">
          <div className="container lx-hero-grid">
            <div>
              <nav aria-label="Breadcrumb" className="lp-crumbs">
                <ol>
                  {breadcrumb.map((c, i) => (
                    <li key={c.path}>
                      {i < breadcrumb.length - 1 ? (
                        <Link href={c.path}>{c.name}</Link>
                      ) : (
                        <span aria-current="page">{c.name}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
              {tags.length > 0 && (
                <ul className="lx-tags">
                  {tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              <h1 id="lp-h1">{h1}</h1>
              <p className="lp-intro">{intro}</p>
              <div className="lp-ctas">
                <Link href={bookingHref} className="btn btn-coral">
                  Book a free consultation
                </Link>
                <Link href="/pricing" className="btn btn-ghost">
                  See pricing
                </Link>
              </div>
            </div>
            {heroCard && (
              <div className="lx-plan">
                <span className="lx-plan-glyph" aria-hidden="true">
                  {glyph}
                </span>
                <h2>{heroCard.title}</h2>
                <ol>
                  {heroCard.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>

        {/* Proof strip */}
        <section className="lx-proof" aria-label="Why families choose Masani">
          <ul className="container">
            <li>
              <strong>Top 3%</strong>
              <span>of teachers who apply are accepted</span>
            </li>
            <li>
              <strong>From {fromPrice(currency)}</strong>
              <span>a session, paid per package</span>
            </li>
            <li>
              <strong>90 days</strong>
              <span>
                <Link href="/our-promise">money back promise</Link>
              </span>
            </li>
            <li>
              <strong>MIT 2025</strong>
              <span>Social Innovation Fellowship</span>
            </li>
          </ul>
        </section>

        {/* Who it's for / what we cover */}
        {(rows || checklist) && (
          <section className="lp-section">
            <div className="container lx-fit">
              {rows && (
                <div className="lx-rows">
                  <h2 className="lp-h2">{rows.title}</h2>
                  <ol>
                    {rows.items.map((item, i) => (
                      <li key={item}>
                        <span aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {checklist && (
                <div className="lx-covers">
                  <h2>{checklist.title}</h2>
                  <ul>
                    {checklist.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {linkSections
          .filter((s) => s.cards.length > 0)
          .map((section) => (
            <section key={section.title} className="lp-section lp-tint">
              <div className="container">
                <h2 className="lp-h2">{section.title}</h2>
                {section.intro && <p className="lp-sub">{section.intro}</p>}
                <LinkCardGrid cards={section.cards} />
              </div>
            </section>
          ))}

        <FamilyBento />

        {/* How it works */}
        <section className="lp-section">
          <div className="container">
            <h2 className="lp-h2">How it works</h2>
            <ol className="lx-steps">
              {howItWorks.map((s) => (
                <li key={s.title}>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing snapshot */}
        <section className="lp-section lp-tint" aria-labelledby="lp-pricing">
          <div className="container">
            <div className="lx-head">
              <div>
                <h2 id="lp-pricing" className="lp-h2">
                  Simple, transparent pricing
                </h2>
                <p className="lp-sub">
                  Pay per package, not per month. No hidden fees, and you can
                  pause or cancel with 48 hours&apos; notice. Your first 90 days
                  are covered by{" "}
                  <Link href="/our-promise" className="lp-link">
                    our money back promise
                  </Link>
                  .
                </p>
              </div>
              <Link href="/pricing" className="lp-link">
                Compare packages in pounds, dollars, Canadian dollars or naira
              </Link>
            </div>
            <div className="lp-prices lx-prices">
              {tiers.map((t) => {
                const p = t.prices[currency];
                return (
                  <div
                    key={t.sessions}
                    className={`lp-price${t.badge === "popular" ? " lx-price-featured" : ""}`}
                  >
                    {t.badge && (
                      <p className={`lx-price-badge lx-price-badge-${t.badge}`}>
                        {badgeLabels[t.badge]}
                      </p>
                    )}
                    <p className="lp-price-sessions">{t.sessions} sessions</p>
                    <p className="lp-price-total">{money(p.total, currency)}</p>
                    <p className="lp-price-per">
                      {money(p.perSession, currency)} a session · {t.duration}
                    </p>
                    {p.free > 0 && (
                      <p className="lp-price-free">
                        Includes {p.free} free sessions
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="lp-section" aria-labelledby="lp-quotes">
          <div className="container">
            <h2 id="lp-quotes" className="lp-h2">
              What parents say
            </h2>
            <WhatsAppQuotes quotes={quotes} />
          </div>
        </section>

        {/* FAQ */}
        <section className="lx-faq-wrap" aria-labelledby="lp-faq">
          <div className="container lx-faq-grid">
            <div>
              <h2 id="lp-faq" className="lp-h2">
                Questions parents ask
              </h2>
              <p className="lp-sub">
                Something else on your mind? Ask us on the{" "}
                <Link href={bookingHref} className="lp-link">
                  free consultation
                </Link>
                .
              </p>
            </div>
            <div className="lx-faq">
              {faqs.map((f) => (
                <details key={f.question}>
                  <summary>{f.question}</summary>
                  <p>{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="lp-section">
          <div className="container lx-related">
            {related.map((r) => (
              <nav key={r.title} aria-label={r.title}>
                <h2>{r.title}</h2>
                <ul>
                  {r.links
                    .filter(
                      (l, i, all) =>
                        all.findIndex((o) => o.href === l.href) === i,
                    )
                    .map((l) => (
                      <li key={l.href}>
                        <Link href={l.href}>{l.label}</Link>
                      </li>
                    ))}
                </ul>
              </nav>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="lx-final">
          <div className="container">
            <div>
              <div>
                <h2>Start with a free, personalised learning plan</h2>
                <p>
                  Fifteen minutes about your child. A written plan within 24
                  hours. No obligation. {MIT_FELLOWSHIP}
                </p>
              </div>
              <Link href={bookingHref} className="btn lx-btn-navy">
                Book a free consultation
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}

/**
 * "What every Masani family gets" as a dark band of icon tiles. Shared by the
 * landing pages and the home page, where it also carries the "what sets us
 * apart" line.
 */
export function FamilyBento({
  heading = "What every Masani family gets",
  intro,
  headingId,
  id,
  light = false,
}: {
  heading?: string;
  intro?: string;
  headingId?: string;
  /** Anchor target, e.g. "why" for the nav's /#why link. */
  id?: string;
  /** Light band, for pages where a dark section already sits next to it. */
  light?: boolean;
}) {
  return (
    <section id={id} className={`lx-dark${light ? " lx-light" : ""}`} aria-labelledby={headingId}>
      <div className="container">
        <h2 id={headingId} className="lp-h2">
          {heading}
        </h2>
        {intro && <p className="lx-dark-intro">{intro}</p>}
        <div className="lx-bento">
          {everyFamilyGets.map((f, i) => (
            <article key={f.title}>
              <span className={`lx-icon lx-icon-${i % 4}`} aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={familyIcons[i % familyIcons.length]} />
                </svg>
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Cards that link to a page when they have one. Tags inside a card are links
 * of their own, so a linked card keeps its link on the title rather than
 * wrapping the whole card (links can't nest).
 */
export function LinkCardGrid({ cards }: { cards: LinkCard[] }) {
  return (
    <div className="lp-grid lx-cards">
      {cards.map((c) => (
        <article
          key={c.id ?? c.title}
          id={c.id}
          className={`lp-tile${c.href ? " lp-tile-link" : ""}${c.body || c.meta ? "" : " lx-card-compact"}`}
        >
          {c.mark && (
            <span className="hb-glyph" aria-hidden="true">
              {c.mark}
            </span>
          )}
          <h3>{c.href ? <Link href={c.href}>{c.title}</Link> : c.title}</h3>
          {c.meta && <p className="lp-tile-meta">{c.meta}</p>}
          {c.body && <p>{c.body}</p>}
          {c.tags && c.tags.length > 0 && (
            <ul className="lp-chips" aria-label={`${c.title} covers`}>
              {c.tags.map((t) => (
                <li key={t.label}>
                  {t.href ? (
                    <Link href={t.href}>{t.label}</Link>
                  ) : (
                    <span>{t.label}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
