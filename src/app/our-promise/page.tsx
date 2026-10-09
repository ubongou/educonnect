import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { defaultContact } from "@/lib/marketing/defaults";
import {
  PROMISE_PATH,
  fairPrint,
  promiseChoices,
  promisePillars,
  promiseSteps,
  unusedSessionsText,
} from "@/lib/marketing/promise";
import { JsonLdScript, absoluteUrl, breadcrumbJsonLd, pageMetadata, ORG_ID } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "The Masani Promise: 90 Day Money Back Guarantee",
  description:
    "How the Masani Promise works: a 90 day money back guarantee, unused sessions refunded at any time, and free teacher changes, no questions asked.",
  path: PROMISE_PATH,
});

export default function PromisePage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Our promise", path: PROMISE_PATH },
  ];

  return (
    <div className="mkt-root">
      <JsonLdScript
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            url: absoluteUrl(PROMISE_PATH),
            name: "The Masani Promise",
            about: { "@id": ORG_ID },
          },
          breadcrumbJsonLd(crumbs),
        ]}
      />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content" className="lp">
        <section className="lp-hero">
          <div className="container">
            <p className="eyebrow">Our promise</p>
            <h1>The Masani Promise</h1>
            <p className="lp-intro">
              Trusting someone new with your child&apos;s learning is a big step. So
              for your first 90 days, the risk sits with us, not you.
            </p>
          </div>
        </section>

        <section className="lp-section lp-tint">
          <div className="container">
            <div className="lp-grid">
              {promisePillars.map((p) => (
                <article key={p.title} className="lp-tile">
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="container lp-narrow">
            <h2 className="lp-h2">How the 90 day guarantee works</h2>
            <ol className="lp-steps">
              {promiseSteps.map((s, i) => (
                <li key={s.title}>
                  <h3>{s.title}</h3>
                  {s.body && <p>{s.body}</p>}
                  {i === promiseSteps.length - 1 && (
                    <div className="pr-choice">
                      {promiseChoices.map((c) => (
                        <div key={c.title}>
                          <strong>{c.title}</strong>
                          <p>{c.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section lp-tint">
          <div className="container lp-narrow">
            <h2 className="lp-h2">Unused sessions, at any time</h2>
            <p className="lp-sub">{unusedSessionsText}</p>
          </div>
        </section>

        <section className="lp-section">
          <div className="container lp-narrow">
            <h2 className="lp-h2">The fair print</h2>
            <p className="lp-sub">
              We keep these simple, and they are here so the promise stays fair for
              every family.
            </p>
            <ul className="pr-fine">
              {fairPrint.map((f) => (
                <li key={f.title}>
                  <strong>{f.title}</strong> {f.body}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-final">
          <div className="container">
            <h2>Questions about the promise?</h2>
            <p>
              Message us on WhatsApp at +234 901 724 6528 or email{" "}
              <a href={`mailto:${defaultContact.email}`}>{defaultContact.email}</a>.
            </p>
            <Link href="/book?source=promise" className="btn btn-coral">
              Book a free consultation
            </Link>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
