import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { defaultPricingTiers, defaultTestimonials } from "@/lib/marketing/defaults";
import { everyFamilyGets, howItWorks, type Faq } from "@/lib/marketing/seoPages";
import { MIT_FELLOWSHIP } from "@/lib/seo";

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
  const min = Math.min(...defaultPricingTiers.tiers.map((t) => t.prices[currency].perSession));
  return money(min, currency);
}

export type ListBlock = { title: string; items: string[] };

/**
 * The shared layout for search landing pages (subjects and countries).
 *
 * Deliberately a server component with every word in the HTML: search engines
 * and AI crawlers read the initial response, so nothing here waits on
 * JavaScript. FAQs use native <details>, which keeps answers in the markup
 * while still collapsing for readers.
 */
export function LandingPage({
  breadcrumb,
  eyebrow,
  h1,
  intro,
  bookingSource,
  currency,
  blocks,
  approach,
  testimonialMatch,
  faqs,
  related,
}: {
  breadcrumb: Array<{ name: string; path: string }>;
  eyebrow: string;
  h1: string;
  intro: string;
  bookingSource: string;
  currency: Currency;
  blocks: ListBlock[];
  approach?: { title: string; items: string[] };
  testimonialMatch?: RegExp;
  faqs: Faq[];
  related: Array<{ title: string; links: Array<{ href: string; label: string }> }>;
}) {
  const bookHref = `/book?source=${bookingSource}`;
  const matched = testimonialMatch
    ? defaultTestimonials.quotes.filter((q) => testimonialMatch.test(q.where))
    : [];
  const quotes = matched.length > 0 ? matched : defaultTestimonials.quotes;

  return (
    <div className="mkt-root">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content" className="lp">
        {/* Hero */}
        <section className="lp-hero" aria-labelledby="lp-h1">
          <div className="container">
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
            <p className="eyebrow">{eyebrow}</p>
            <h1 id="lp-h1">{h1}</h1>
            <p className="lp-intro">{intro}</p>
            <div className="lp-ctas">
              <Link href={bookHref} className="btn btn-coral">
                Book a free session
              </Link>
              <Link href="/pricing" className="btn btn-ghost">
                See pricing
              </Link>
            </div>
            <ul className="lp-trust">
              <li>Teachers from the top 3% of applicants</li>
              <li>From {fromPrice(currency)} a session</li>
              <li>Selected for the MIT Social Innovation Fellowship, 2025</li>
            </ul>
          </div>
        </section>

        {/* Who it's for / what we cover */}
        <section className="lp-section">
          <div className="container lp-two">
            {blocks.map((b) => (
              <div key={b.title} className="lp-card">
                <h2>{b.title}</h2>
                <ul className="lp-checks">
                  {b.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {approach && (
          <section className="lp-section">
            <div className="container">
              <h2 className="lp-h2">{approach.title}</h2>
              <ol className="lp-approach">
                {approach.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* What every family gets */}
        <section className="lp-section lp-tint">
          <div className="container">
            <h2 className="lp-h2">What every Masani family gets</h2>
            <div className="lp-grid">
              {everyFamilyGets.map((f) => (
                <article key={f.title} className="lp-tile">
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="lp-section">
          <div className="container">
            <h2 className="lp-h2">How it works</h2>
            <ol className="lp-steps">
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
            <h2 id="lp-pricing" className="lp-h2">
              Simple, transparent pricing
            </h2>
            <p className="lp-sub">
              Pay per package, not per month. No hidden fees, and you can pause or
              cancel with 48 hours&apos; notice.
            </p>
            <div className="lp-prices">
              {defaultPricingTiers.tiers.map((t) => {
                const p = t.prices[currency];
                return (
                  <div key={t.sessions} className="lp-price">
                    <p className="lp-price-sessions">{t.sessions} sessions</p>
                    <p className="lp-price-total">{money(p.total, currency)}</p>
                    <p className="lp-price-per">
                      {money(p.perSession, currency)} a session · {t.duration}
                    </p>
                    {p.free > 0 && (
                      <p className="lp-price-free">Includes {p.free} free sessions</p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="lp-sub">
              <Link href="/pricing" className="lp-link">
                Compare packages in pounds, dollars, Canadian dollars or naira
              </Link>
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section className="lp-section" aria-labelledby="lp-quotes">
          <div className="container">
            <h2 id="lp-quotes" className="lp-h2">
              What parents say
            </h2>
            <div className="lp-quotes">
              {quotes.map((q) => (
                <figure key={q.author} className="lp-quote">
                  <blockquote>{q.body}</blockquote>
                  <figcaption>
                    {q.author}, {q.where}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-section lp-tint" aria-labelledby="lp-faq">
          <div className="container lp-narrow">
            <h2 id="lp-faq" className="lp-h2">
              Frequently asked questions
            </h2>
            <div className="lp-faq">
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
          <div className="container lp-related">
            {related.map((r) => (
              <nav key={r.title} aria-label={r.title}>
                <h2>{r.title}</h2>
                <ul>
                  {r.links.map((l) => (
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
        <section className="lp-final">
          <div className="container">
            <h2>Start with a free, personalised learning plan</h2>
            <p>
              Fifteen minutes about your child. A written plan within 24 hours.
              No obligation. {MIT_FELLOWSHIP}
            </p>
            <Link href={bookHref} className="btn btn-coral">
              Book a free session
            </Link>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
