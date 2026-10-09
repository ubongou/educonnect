import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { ExamsByCountry } from "@/components/marketing/SubjectsAndExams";
import { EXAMS, examHref } from "@/lib/marketing/exams";
import { JsonLdScript, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Exam Preparation: 11+, SATs, GCSE, A Level, SAT and More",
  description:
    "One to one online exam preparation for children in the UK, US and Canada: 11+, SATs, GCSE, A level, SSAT, SAT and ACT, AP, EQAO, provincial exams and IB.",
  path: "/exams",
});

/**
 * Every exam we prepare for, grouped by country, with the subjects each one
 * covers. Exams with their own page link to it; every subject links to its
 * subject page, so this is the bridge between the two.
 */
export default function ExamsPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Exams", path: "/exams" },
  ];

  return (
    <div className="mkt-root">
      <JsonLdScript
        data={[
          breadcrumbJsonLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Exams Masani prepares children for",
            itemListElement: EXAMS.map((e, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: e.name,
              url: absoluteUrl(examHref(e) ?? `/exams#${e.id}`),
            })),
          },
        ]}
      />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" activeHref="/exams" />
      <main id="main-content" className="lp">
        <section className="lp-hero">
          <div className="container">
            <nav aria-label="Breadcrumb" className="lp-crumbs">
              <ol>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <span aria-current="page">Exams</span>
                </li>
              </ol>
            </nav>
            <p className="eyebrow">UK · US · Canada · International</p>
            <h1>Exams we prepare for</h1>
            <p className="lp-intro">
              One to one preparation for the tests and exams that shape your child&apos;s next
              step, from primary school checks to university entrance. Each exam lists the
              subjects it covers, so you can see exactly what your child&apos;s teacher will work on.
            </p>
            <div className="lp-ctas">
              <Link href="/book?source=exams" className="btn btn-coral">
                Book a free consultation
              </Link>
              <Link href="/tutoring" className="btn btn-ghost">
                See all subjects
              </Link>
            </div>
          </div>
        </section>

        <ExamsByCountry />

        <section className="lp-final">
          <div className="container">
            <h2>Don&apos;t see your child&apos;s exam?</h2>
            <p>
              Tell us what your child is preparing for. We&apos;ll match a teacher who knows it.
            </p>
            <Link href="/book?source=exams-any-exam" className="btn btn-coral">
              Ask about an exam
            </Link>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
