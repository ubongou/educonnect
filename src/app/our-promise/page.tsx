import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { defaultContact } from "@/lib/marketing/defaults";
import {
  GUARANTEE_DAYS,
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

/** Icons for the three promise pillars: refund, change teacher, unused sessions. */
const pillarIcons = [
  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  "M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
  "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
];

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
          <div className="container hb-hero-grid">
            <div>
              <p className="eyebrow">Our promise</p>
              <h1>
                The Masani <em>Promise</em>
              </h1>
              <p className="lp-intro">
                Trusting someone new with your child&apos;s learning is a big step. So
                for your first 90 days, the risk sits with us, not you.
              </p>
            </div>
            <div className="pr-seal" aria-hidden="true">
              <strong>{GUARANTEE_DAYS}</strong>
              <span>days, or your money back</span>
            </div>
          </div>
        </section>

        <section className="lx-dark" aria-label="What the promise covers">
          <div className="container">
            <div className="lx-bento">
              {promisePillars.map((p, i) => (
                <article key={p.title}>
                  <span className={`lx-icon lx-icon-${i}`} aria-hidden="true">
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
                      <path d={pillarIcons[i % pillarIcons.length]} />
                    </svg>
                  </span>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="container">
            <h2 className="lp-h2">How the 90 day guarantee works</h2>
            <ol className="lx-steps pr-steps">
              {promiseSteps.map((s) => (
                <li key={s.title}>
                  <h3>{s.title}</h3>
                  {s.body && <p>{s.body}</p>}
                </li>
              ))}
            </ol>
            <div className="pr-choice">
              {promiseChoices.map((c) => (
                <div key={c.title}>
                  <strong>{c.title}</strong>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-tint">
          <div className="container lx-fit">
            <div className="lx-covers pr-unused">
              <h2>Unused sessions, at any time</h2>
              <p>{unusedSessionsText}</p>
            </div>
            <div className="lx-rows">
              <h2 className="lp-h2">The fair print</h2>
              <p className="lp-sub">
                We keep these simple, and they are here so the promise stays fair for
                every family.
              </p>
              <ol>
                {fairPrint.map((f, i) => (
                  <li key={f.title}>
                    <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{f.title}</strong> {f.body}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
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
