import Link from "next/link";
import "../../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { GUIDE_PATH, PROMISE_PATH, FROM_PRICES } from "@/lib/marketing/promise";
import {
  JsonLdScript,
  MIT_FELLOWSHIP,
  ORG_ID,
  absoluteUrl,
  breadcrumbJsonLd,
  pageMetadata,
} from "@/lib/seo";

const TITLE = "Online Tutoring for Nigerian Families Abroad: What to Look For";
const DESCRIPTION =
  "A practical guide for Nigerian parents in the UK, US and Canada choosing an online tutor: teachers, curriculum, time zones, progress reports and cost.";
const PUBLISHED = "2026-09-30";

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: GUIDE_PATH });

const sections: Array<{ q: string; advice: string; atMasani: React.ReactNode }> = [
  {
    q: "1. Who will actually teach my child?",
    advice:
      "Ask how teachers are chosen and what share of applicants are accepted. Ask whether you will be matched with one teacher or see a different person each week.",
    atMasani:
      "Lessons are taught by carefully vetted Nigerian teachers. Only the top 3% of teachers who apply are accepted, and each child is matched with their own teacher.",
  },
  {
    q: "2. Does the teacher know my child's curriculum?",
    advice:
      "A tutor who does not know your child's syllabus will spend lessons catching up instead of teaching. Ask which curricula they follow and whether they prepare for the exams your child will sit.",
    atMasani:
      "We follow the UK, US, Canadian, Nigerian and international curricula, for children from primary through secondary school. Subjects are Maths, English, Science, 11+ preparation, SAT and ACT prep, Reading and creative writing, and Public speaking.",
  },
  {
    q: "3. Will lessons fit our time zone?",
    advice:
      "Lessons that clash with school runs, homework or dinner do not last. Ask when lessons can take place and whether times are set in your time zone.",
    atMasani: "Every lesson is scheduled in your own time zone.",
  },
  {
    q: "4. How will I know it is working?",
    advice:
      "You should not have to wait for a school report to find out. Ask what you will see after each lesson.",
    atMasani:
      "Every family gets a written report after every lesson, recorded lessons, and skill by skill progress tracking in a parent portal.",
  },
  {
    q: "5. What if it is not the right fit?",
    advice:
      "Ask what happens if your child does not click with the teacher, how much notice you need to give to stop, and whether you can get your money back.",
    atMasani: (
      <>
        You can change your teacher at any time, free, no questions asked. Your first
        90 days are covered by the Masani Promise, and unused sessions are always
        refunded. <Link href={PROMISE_PATH}>How our promise works</Link>
      </>
    ),
  },
  {
    q: "6. What will it cost?",
    advice: "Ask for the price per session and the total for a package, in your own currency.",
    atMasani: (
      <>
        Packages of 8, 24 or 48 sessions, from {FROM_PRICES} per session. Full prices
        are on our <Link href="/pricing">pricing page</Link>.
      </>
    ),
  },
];

export default function GuidePage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Choosing an online tutor", path: GUIDE_PATH },
  ];

  return (
    <div className="mkt-root">
      <JsonLdScript
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: TITLE,
            description: DESCRIPTION,
            url: absoluteUrl(GUIDE_PATH),
            mainEntityOfPage: absoluteUrl(GUIDE_PATH),
            datePublished: PUBLISHED,
            dateModified: PUBLISHED,
            author: { "@id": ORG_ID },
            publisher: { "@id": ORG_ID },
            inLanguage: "en",
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
            <p className="eyebrow">Guide for parents</p>
            <h1 style={{ maxWidth: "22ch" }}>
              Online tutoring for Nigerian families abroad: what to look for
            </h1>
            <p className="lp-intro">
              If you are raising children in the UK, the US or Canada, you have
              probably thought about a tutor who understands both where your child is
              now and where your family comes from. This guide sets out the questions
              worth asking any online tutoring service before you commit, and how
              Masani answers them.
            </p>
          </div>
        </section>

        <section className="lp-section">
          <div className="container lp-prose">
            {sections.map((s) => (
              <div key={s.q}>
                <h2 className="lp-h2">{s.q}</h2>
                <p>{s.advice}</p>
                <p className="gd-at" style={{ marginTop: 12 }}>
                  <strong>At Masani</strong>
                  {s.atMasani}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-final">
          <div className="container">
            <h2>How to start with Masani</h2>
            <p>
              Book a free 15 minute call with an education expert. Within 24 hours you
              will receive a written personalised learning plan for your child.
            </p>
            <Link href="/book?source=guide" className="btn btn-coral">
              Book your free call
            </Link>
          </div>
        </section>

        <section className="lp-section">
          <div className="container lp-prose">
            <p>
              {MIT_FELLOWSHIP} Read about our founders, Unyime Okorosobo and Grace
              Amoka, on our <Link href="/about">About page</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
