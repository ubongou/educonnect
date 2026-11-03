import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { headingAnchor } from "@/lib/marketing/anchor";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

/**
 * Shared layout for plain policy pages (terms, privacy, safeguarding): one
 * readable column, every word in the server HTML.
 */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
  related,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  related?: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="mkt-root">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content" className="lp">
        <section className="lp-hero">
          <div className="container">
            <h1>{title}</h1>
            <p className="lp-sub">Last updated {updated}</p>
            <p className="lp-intro">{intro}</p>
          </div>
        </section>
        <section className="lp-section">
          <div className="container gd-layout">
            <nav className="gd-toc" aria-label="On this page">
              <p>On this page</p>
              <ol>
                {sections.map((s) => (
                  <li key={s.heading}>
                    <a href={`#${headingAnchor(s.heading)}`}>{s.heading}</a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="legal-body gd-body">
              {sections.map((s) => (
                <section key={s.heading} id={headingAnchor(s.heading)}>
                  <h2>{s.heading}</h2>
                  {s.paragraphs?.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {s.bullets && (
                    <ul>
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
              {related && related.length > 0 && (
                <p className="legal-related">
                  {related.map((r, i) => (
                    <span key={r.href}>
                      {i > 0 && " · "}
                      <Link href={r.href}>{r.label}</Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
