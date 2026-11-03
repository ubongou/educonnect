import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { GUIDE_AUTHOR, guideTopics, guides, readMinutes } from "@/lib/marketing/guides";
import { JsonLdScript, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Guides for Nigerian Parents Abroad",
  description:
    "Practical guides for Nigerian families in the UK, US and Canada: school systems, exams, choosing and checking a tutor, and helping your child learn at home.",
  path: "/guides",
});

const all = guides.map((g) => ({ href: `/guides/${g.slug}`, title: g.h1, description: g.description }));

/** The featured guide: the question parents ask first. */
const lead = guides.find((g) => g.slug === "how-much-does-a-tutor-cost") ?? guides[0];

export default function GuidesIndex() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
  ];
  return (
    <div className="mkt-root">
      <JsonLdScript
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Guides for Nigerian parents abroad",
            url: absoluteUrl("/guides"),
            hasPart: all.map((a) => ({ "@type": "Article", headline: a.title, url: absoluteUrl(a.href) })),
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
            <div className="gx-hero-grid">
              <div>
                <p className="eyebrow">{guides.length} guides for parents</p>
                <h1>Straight answers for Nigerian parents abroad</h1>
              </div>
              <div className="gx-author">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={GUIDE_AUTHOR.photo} alt="" width={64} height={64} />
                <p>
                  Written by <strong>{GUIDE_AUTHOR.name}</strong>, our co-founder and
                  academic lead, answering the questions parents ask us most.
                </p>
              </div>
            </div>
            <nav aria-label="Guide topics">
              <ul className="gx-topics">
                {guideTopics.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`}>{t.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>

        <div className="container">
          <article className="gx-featured">
            <div>
              <span className="gx-badge">Start here</span>
              <h2>
                <Link href={`/guides/${lead.slug}`}>{lead.h1}</Link>
              </h2>
              <p>{lead.description}</p>
              <p className="gx-read">
                Read the guide → <span>{readMinutes(lead)} min read</span>
              </p>
            </div>
            <div className="gx-marks" aria-hidden="true">
              <span>£</span>
              <span>$</span>
              <span>C$</span>
            </div>
          </article>

          {guideTopics.map((t, i) => (
            <section
              key={t.id}
              id={t.id}
              className={`gx-shelf${i === guideTopics.length - 1 ? " gx-shelf-end" : ""}`}
              aria-labelledby={`${t.id}-h`}
            >
              <div>
                <h2 id={`${t.id}-h`}>{t.title}</h2>
                <p>{t.sub}</p>
              </div>
              <ul>
                {t.guides
                  .filter((g) => g !== lead)
                  .map((g, n) => (
                    <li key={g.slug}>
                      <article className="gx-row">
                        <span className="hb-glyph" aria-hidden="true">
                          {String(n + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3>
                            <Link href={`/guides/${g.slug}`}>{g.h1}</Link>
                          </h3>
                          <p>{g.description}</p>
                        </div>
                        <span>{readMinutes(g)} min →</span>
                      </article>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="lp-final">
          <div className="container">
            <h2>Rather talk it through?</h2>
            <p>
              A free 15 minute call about your child, and a written personalised
              learning plan within 24 hours.
            </p>
            <Link href="/book?source=guides-index" className="btn btn-coral">
              Book a free consultation
            </Link>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
