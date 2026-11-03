import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { countryPages, examPrepPages, subjectOnlyPages } from "@/lib/marketing/seoPages";
import { subjectCards } from "@/lib/marketing/exams";
import { glyphFor } from "@/lib/marketing/glyphs";
import { fromPrice } from "@/components/marketing/LandingPage";
import { ExamsOverview, SubjectsSection } from "@/components/marketing/SubjectsAndExams";
import { JsonLdScript, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Online Tutoring Subjects for Nigerian Families Abroad",
  description:
    "One to one online tutoring in maths, English, science, biology, chemistry, physics, reading, writing and public speaking, and exam preparation, in the UK, US and Canada.",
  path: "/tutoring",
});

/** Hub for every subject, exam and country page, so each is one click from here. */
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
            itemListElement: subjectOnlyPages.map((s, i) => ({
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
          <div className="container hb-hero-grid">
            <div>
              <h1>
                Online tutoring for Nigerian families <em>abroad</em>
              </h1>
              <p className="lp-intro">
                Private lessons with carefully vetted Nigerian teachers, following
                your child&apos;s own school curriculum, in your own time zone. Choose
                a subject, find your child&apos;s exam, or see how we work in your country.
              </p>
              <div className="lp-ctas">
                <Link href="/book?source=seo-subject" className="btn btn-coral">
                  Book a free consultation
                </Link>
                <Link href="/pricing" className="btn btn-ghost">
                  See pricing
                </Link>
              </div>
            </div>
            <nav className="hb-jump" aria-labelledby="hb-jump">
              <h2 id="hb-jump">Jump to</h2>
              <ul>
                {examPrepPages.slice(0, 2).map((s) => (
                  <li key={s.slug} className="hb-jump-exam">
                    <Link href={`/tutoring/${s.slug}`}>{s.linkLabel}</Link>
                  </li>
                ))}
                {subjectCards().map((s) => (
                  <li key={s.slug}>
                    <Link href={`/tutoring/${s.slug}`}>{s.name}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/exams">All exams →</Link>
                </li>
              </ul>
              <p>
                ✓ Teachers from the top 3% of applicants &nbsp; ✓ From {fromPrice("USD")} a
                session
              </p>
            </nav>
          </div>
        </section>

        <SubjectsSection
          headingId="subjects"
          heading="Subjects"
          bookingSource="tutoring"
          tint
        />

        <ExamsOverview />

        <section className="lp-section" aria-labelledby="countries">
          <div className="container">
            <h2 id="countries" className="lp-h2">
              Where we teach
            </h2>
            <p className="lp-sub">
              Families elsewhere, including Australia and Nigeria, are welcome too.
              Lessons are online and scheduled in your local time.
            </p>
            <div className="hb-countries">
              {countryPages.map((c) => (
                <Link key={c.slug} href={`/online-tutoring/${c.slug}`} className="hb-country">
                  <strong aria-hidden="true">{glyphFor(c.slug, c.country)}</strong>
                  <h3>{c.areaServed}</h3>
                  <p>{c.description}</p>
                  <span className="hb-more">Tutoring in {c.country} →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-final">
          <div className="container">
            <h2>Not sure where to start? Start with a free plan.</h2>
            <p>Fifteen minutes about your child. A written plan within 24 hours. No obligation.</p>
            <Link href="/book?source=tutoring-final" className="btn btn-coral">
              Book a free consultation
            </Link>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
