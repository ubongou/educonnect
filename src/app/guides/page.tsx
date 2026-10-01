import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { guides } from "@/lib/marketing/guides";
import { GUIDE_PATH } from "@/lib/marketing/promise";
import { JsonLdScript, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Guides for Nigerian Parents Abroad",
  description:
    "Practical guides for Nigerian families in the UK, US and Canada: tutoring costs, the 11+, the UK school system, moving schools, curricula, online tutoring and SAT prep.",
  path: "/guides",
});

const all = [
  {
    href: GUIDE_PATH,
    title: "Online tutoring for Nigerian families abroad: what to look for",
    description: "The questions worth asking any online tutoring service before you commit.",
  },
  ...guides.map((g) => ({ href: `/guides/${g.slug}`, title: g.h1, description: g.description })),
];

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
            <p className="eyebrow">Guides</p>
            <h1>Guides for Nigerian parents abroad</h1>
            <p className="lp-intro">
              Straight answers to the questions parents ask us most, written by our
              co-founder and academic lead, Unyime Okorosobo.
            </p>
          </div>
        </section>
        <section className="lp-section">
          <div className="container">
            <div className="lp-grid">
              {all.map((a) => (
                <article key={a.href} className="lp-tile">
                  <h3>
                    <Link href={a.href}>{a.title}</Link>
                  </h3>
                  <p>{a.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
