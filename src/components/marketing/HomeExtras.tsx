import Link from "next/link";
import { defaultPricingTiers } from "@/lib/marketing/defaults";
import { everyFamilyGets } from "@/lib/marketing/seoPages";
import { GUIDE_PATH, PROMISE_PATH, homeFaqs, promiseSummary, proofStats } from "@/lib/marketing/promise";

/**
 * Homepage sections added for search, AI answers and conversion. Server
 * components with every word in the initial HTML, so crawlers and AI
 * assistants can read them without running JavaScript.
 */

/** Concrete promises, placed straight under the hero. */
export function FamilyGets() {
  return (
    <section className="lp-section" aria-labelledby="gets-heading">
      <div className="container">
        <h2 id="gets-heading" className="lp-h2">
          What every family gets
        </h2>
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
  );
}

/** Price and guarantee side by side, after the testimonials. */
export function PricePromise() {
  const min = (c: "GBP" | "USD" | "CAD") =>
    Math.min(...defaultPricingTiers.tiers.map((t) => t.prices[c].perSession));
  return (
    <section className="lp-section lp-tint" aria-labelledby="pp-heading">
      <div className="container">
        <h2 id="pp-heading" className="lp-h2">
          Simple pricing, with nothing to lose
        </h2>
        <div className="pp-grid">
          <div className="pp-price">
            <h3>Packages of 8, 24 or 48 sessions</h3>
            <p className="pp-from">From £{min("GBP").toFixed(2)}</p>
            <p className="pp-muted">
              per session · ${min("USD").toFixed(2)} · C${min("CAD").toFixed(2)}
            </p>
            <Link href="/pricing" className="btn btn-coral">
              See all prices
            </Link>
          </div>
          <PromiseCard />
        </div>
      </div>
    </section>
  );
}

/** Questions parents ask. Mirrors the FAQPage JSON-LD on the homepage. */
export function HomeFaq() {
  return (
    <section className="lp-section" aria-labelledby="home-faq-heading">
      <div className="container lp-narrow">
        <h2 id="home-faq-heading" className="lp-h2">
          Questions parents ask
        </h2>
        <div className="lp-faq">
          {homeFaqs.map((f) => (
            <details key={f.question}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>
        <p className="lp-sub" style={{ marginTop: 20 }}>
          <Link href={GUIDE_PATH} className="lp-link">
            Read our guide to choosing an online tutor
          </Link>
          {" · "}
          <Link href={PROMISE_PATH} className="lp-link">
            Our promise
          </Link>
          {" · "}
          <Link href="/pricing" className="lp-link">
            Pricing
          </Link>
          {" · "}
          <Link href="/strategy-session" className="lp-link">
            Book your free call
          </Link>
        </p>
      </div>
    </section>
  );
}

/** The promise summary card. Used on the homepage and the pricing page. */
export function PromiseCard() {
  return (
    <div className="pp-promise">
      <p className="pp-seal">The Masani Promise</p>
      <h3>Happy in your first 90 days, or your money back</h3>
      <ul>
        {promiseSummary.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <Link href={PROMISE_PATH} className="lp-link">
        How our promise works, and its terms
      </Link>
    </div>
  );
}

/** Real numbers from the admin portal, right under the hero. */
export function ProofStrip() {
  return (
    <section className="proof-strip" aria-label="Masani in numbers">
      <div className="container">
        <ul>
          {proofStats.map((s) => (
            <li key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
