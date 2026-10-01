import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

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
  eyebrow,
  title,
  updated,
  intro,
  sections,
  related,
}: {
  eyebrow: string;
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
          <div className="container lp-narrow">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="lp-sub">Last updated {updated}</p>
            <p className="lp-intro">{intro}</p>
          </div>
        </section>
        <section className="lp-section">
          <div className="container lp-narrow legal-body">
            {sections.map((s) => (
              <section key={s.heading}>
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
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
