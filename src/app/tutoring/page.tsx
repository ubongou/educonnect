import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { countryPages, subjectPages } from "@/lib/marketing/seoPages";
import { JsonLdScript, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Online Tutoring for Nigerian Families Abroad: Subjects and Countries",
  description:
    "One to one online tutoring in maths, English, science, 11+, SAT and ACT, reading, writing and public speaking, for Nigerian families in the UK, US and Canada.",
  path: "/tutoring",
});

/** Hub for every subject and country page, so each is one click from here. */
export default function TutoringHubPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Online tutoring", path: "/tutoring" },
  ];

  return (
    <div className="mkt-root">
      <JsonLdScript
        data={[
          breadcrumbJsonLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Masani tutoring subjects",
            itemListElement: subjectPages.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: s.linkLabel,
              url: absoluteUrl(`/tutoring/${s.slug}`),
            })),
          },
        ]}
      />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" activeHref="/tutoring" />
      <main id="main-content" className="lp">
        <section className="lp-hero">
          <div className="container">
            <p className="eyebrow">One to one · Online · Primary to secondary</p>
            <h1>Online tutoring for Nigerian families abroad</h1>
            <p className="lp-intro">
              Private lessons with carefully vetted Nigerian teachers, following
              your child&apos;s own school curriculum, in your own time zone. Choose
              a subject or see how we work in your country.
            </p>
            <div className="lp-ctas">
              <Link href="/book?source=seo-subject" className="btn btn-coral">
                Book a free session
              </Link>
              <Link href="/pricing" className="btn btn-ghost">
                See pricing
              </Link>
            </div>
          </div>
        </section>

        <section className="lp-section lp-tint" aria-labelledby="subjects">
          <div className="container">
            <h2 id="subjects" className="lp-h2">
              Subjects
            </h2>
            <div className="lp-grid">
              {subjectPages.map((s) => (
                <Link key={s.slug} href={`/tutoring/${s.slug}`} className="lp-tile">
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="countries">
          <div className="container">
            <h2 id="countries" className="lp-h2">
              Where we teach
            </h2>
            <div className="lp-grid">
              {countryPages.map((c) => (
                <Link key={c.slug} href={`/online-tutoring/${c.slug}`} className="lp-tile">
                  <h3>{c.areaServed}</h3>
                  <p>{c.description}</p>
                </Link>
              ))}
            </div>
            <p className="lp-sub">
              Families elsewhere, including Australia and Nigeria, are welcome too.
              Lessons are online and scheduled in your local time.
            </p>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
