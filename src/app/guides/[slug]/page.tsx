import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { GUIDE_AUTHOR, guideBySlug, guides } from "@/lib/marketing/guides";
import type { GuideBlock } from "@/lib/marketing/guides/types";
import { relatedForGuide } from "@/lib/marketing/related";
import {
  JsonLdScript,
  ORG_ID,
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  pageMetadata,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g) return {};
  return pageMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}` });
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "list":
      return block.ordered ? (
        <ol className="gd-list">
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      ) : (
        <ul className="gd-list">
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="gd-table-wrap">
          <table className="gd-table">
            {block.caption && <caption>{block.caption}</caption>}
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th key={i} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) =>
                    j === 0 ? (
                      <th key={j} scope="row">
                        {c}
                      </th>
                    ) : (
                      <td key={j}>{c}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "note":
      return (
        <p className="gd-at">
          <strong>{block.title}</strong>
          {block.text}
        </p>
      );
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g) notFound();
  const path = `/guides/${g.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: g.shortTitle, path },
  ];
  // Hand-picked related guides first, then the rest, so every guide links to
  // every other one at least from here.
  const related = relatedForGuide(g.slug);
  const relatedSlugs = new Set(related.guides.map((l) => l.href));
  const others = [
    ...related.guides,
    ...guides
      .filter((o) => o.slug !== g.slug && !relatedSlugs.has(`/guides/${o.slug}`))
      .map((o) => ({ href: `/guides/${o.slug}`, label: o.shortTitle })),
  ];

  return (
    <div className="mkt-root">
      <JsonLdScript
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.h1,
            description: g.description,
            url: absoluteUrl(path),
            mainEntityOfPage: absoluteUrl(path),
            datePublished: g.published,
            dateModified: g.published,
            inLanguage: "en",
            author: {
              "@type": "Person",
              name: GUIDE_AUTHOR.name,
              jobTitle: GUIDE_AUTHOR.role,
              worksFor: { "@id": ORG_ID },
              url: absoluteUrl("/about"),
            },
            publisher: { "@id": ORG_ID },
            citation: g.sources.map((s) => s.url),
          },
          breadcrumbJsonLd(crumbs),
          ...(g.faqs && g.faqs.length > 0 ? [faqJsonLd(g.faqs)] : []),
        ]}
      />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content" className="lp">
        <section className="lp-hero">
          <div className="container lp-narrow">
            <nav aria-label="Breadcrumb" className="lp-crumbs">
              <ol>
                {crumbs.map((c, i) => (
                  <li key={c.path}>
                    {i < crumbs.length - 1 ? (
                      <Link href={c.path}>{c.name}</Link>
                    ) : (
                      <span aria-current="page">{c.name}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            <p className="eyebrow">Guide for parents</p>
            <h1 style={{ maxWidth: "22ch" }}>{g.h1}</h1>
            <div className="gd-byline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GUIDE_AUTHOR.photo} alt="" width={44} height={44} />
              <div>
                <strong>{GUIDE_AUTHOR.name}</strong>
                <span>
                  {GUIDE_AUTHOR.role} ·{" "}
                  {new Date(g.published).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
              </div>
            </div>
            <p className="lp-intro">{g.intro}</p>
          </div>
        </section>

        <article className="lp-section">
          <div className="container lp-narrow gd-body">
            {g.sections.map((s) => (
              <section key={s.heading}>
                <h2>{s.heading}</h2>
                {s.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
              </section>
            ))}

            {g.faqs && g.faqs.length > 0 && (
              <section>
                <h2>Quick answers</h2>
                <div className="lp-faq">
                  {g.faqs.map((f) => (
                    <details key={f.question}>
                      <summary>{f.question}</summary>
                      <p>{f.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <section className="gd-author">
              <h2>About the author</h2>
              <p>
                <strong>{GUIDE_AUTHOR.name}</strong>, {GUIDE_AUTHOR.role}. {GUIDE_AUTHOR.bio}
              </p>
            </section>

            <section className="gd-sources">
              <h2>Sources</h2>
              <ul>
                {g.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} rel="noopener" target="_blank">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>

        <section className="lp-final">
          <div className="container">
            <h2>Talk it through with an education expert</h2>
            <p>
              A free 15 minute call about your child, and a written personalised
              learning plan within 24 hours.
            </p>
            <Link href={`/book?source=guide-${g.slug}`} className="btn btn-coral">
              Book a free consultation
            </Link>
          </div>
        </section>

        <section className="lp-section">
          <div className="container lp-related">
            <nav aria-label="More guides">
              <h2>More guides for parents</h2>
              <ul>
                {others.map((o) => (
                  <li key={o.href}>
                    <Link href={o.href}>{o.label}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/guides">All guides</Link>
                </li>
              </ul>
            </nav>
            {related.subjectsAndExams.length > 0 && (
              <nav aria-label="Related subjects and exams">
                <h2>Subjects and exams</h2>
                <ul>
                  {related.subjectsAndExams.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {related.countries.length > 0 && (
              <nav aria-label="Where we teach">
                <h2>Where we teach</h2>
                <ul>
                  {related.countries.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
