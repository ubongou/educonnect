import Link from "next/link";
import { LinkCardGrid } from "@/components/marketing/LandingPage";
import {
  EXAMS,
  EXTRA_SUBJECTS,
  SUBJECT_CARD_AGES,
  SUBJECT_CARD_BLURBS,
  examHref,
  examsByCountry,
  subjectCards,
  subjectLink,
  type Exam,
} from "@/lib/marketing/exams";
import { GUIDE_AUTHOR, guides, readMinutes } from "@/lib/marketing/guides";

/**
 * The Subjects, Exams and Guides blocks shared by the home page, /tutoring and
 * /exams. Server components with every link in the HTML, so search engines and
 * AI crawlers see the whole map of the site from the home page.
 */

/** Exams without their own page link to their card on /exams. */
function examLink(e: Exam): string {
  return examHref(e) ?? `/exams#${e.id}`;
}

export function SubjectsSection({
  headingId = "subjects-heading",
  heading = "Whatever your child needs to learn",
  intro = "One to one lessons in your child's own curriculum, from first times tables to final exams.",
  bookingSource,
  tint = false,
}: {
  headingId?: string;
  heading?: string;
  intro?: string;
  bookingSource: string;
  tint?: boolean;
}) {
  const cards = subjectCards();
  return (
    <section className={`lp-section${tint ? " lp-tint" : ""}`} aria-labelledby={headingId}>
      <div className="container">
        <h2 id={headingId} className="lp-h2">
          {heading}
        </h2>
        <p className="lp-sub">{intro}</p>
        <div className="lp-grid lp-grid-subjects">
          {cards.map((s) => {
            const slug = s.slug as keyof typeof SUBJECT_CARD_BLURBS;
            return (
              <article key={s.slug} className="lp-tile lp-tile-link">
                <h3>
                  <Link href={`/tutoring/${s.slug}`}>{s.name}</Link>
                </h3>
                {SUBJECT_CARD_AGES[slug] && <p className="lp-tile-meta">{SUBJECT_CARD_AGES[slug]}</p>}
                <p className="lp-tile-blurb">{SUBJECT_CARD_BLURBS[slug]}</p>
              </article>
            );
          })}
          <article className="lp-tile lp-any">
            <div>
              <h3>Don&apos;t see your child&apos;s subject?</h3>
              <p>Tell us what they need. We&apos;ll find the right teacher for any subject, at any level.</p>
            </div>
            <Link href={`/book?source=${bookingSource}-any-subject`} className="btn btn-coral">
              Ask about a subject
            </Link>
          </article>
        </div>
        <div className="lp-also">
          <h3>We also teach</h3>
          <ul className="lp-chips" aria-label="Other subjects we teach">
            {EXTRA_SUBJECTS.map((e) => {
              const l = subjectLink(e.id);
              return <li key={e.id}>{l.href ? <Link href={l.href}>{l.label}</Link> : <span>{l.label}</span>}</li>;
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Compact exams block for the home page: every exam, grouped by country. */
export function ExamsOverview({ tint = false }: { tint?: boolean }) {
  return (
    <section className={`lp-section${tint ? " lp-tint" : ""}`} aria-labelledby="exams-heading">
      <div className="container">
        <h2 id="exams-heading" className="lp-h2">
          Exams we prepare for
        </h2>
        <p className="lp-sub">
          From primary school tests to university entrance, in the UK, US and Canada.
        </p>
        <div className="lp-exam-groups">
          {examsByCountry().map((g) => (
            <div key={g.id} className="lp-tile lp-exam-group">
              <h3>
                <span aria-hidden="true">{g.flag}</span> {g.label}
              </h3>
              <ul className="lp-chips lp-chips-nowrap" aria-label={`Exams in ${g.label}`}>
                {g.exams.map((e) => (
                  <li key={e.id}>
                    <Link href={examLink(e)}>{e.shortName ?? e.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="lp-sub" style={{ marginTop: 20 }}>
          <Link href="/exams" className="lp-link">
            See every exam and the subjects it covers
          </Link>
        </p>
      </div>
    </section>
  );
}

/** Full exams list for /exams: a card per exam, linked to its subjects. */
export function ExamsByCountry() {
  return (
    <>
      {examsByCountry().map((g, i) => (
        <section
          key={g.id}
          id={g.id}
          className={`lp-section lp-exam-country${i % 2 === 1 ? " lp-tint" : ""}`}
          aria-labelledby={`exams-${g.id}`}
        >
          <div className="container">
            <h2 id={`exams-${g.id}`} className="lp-h2">
              <span aria-hidden="true">{g.flag}</span> {g.label}
            </h2>
            {g.countryPageSlug && (
              <p className="lp-sub">
                <Link href={`/online-tutoring/${g.countryPageSlug}`} className="lp-link">
                  How we teach families in {g.inSentence}
                </Link>
              </p>
            )}
            <LinkCardGrid
              cards={g.exams.map((e) => ({
                // Anchor ids only on the exam's first country, so they stay unique.
                id: e.countries[0] === g.id ? e.id : undefined,
                title: e.name,
                href: examHref(e),
                meta: e.when,
                body: e.alsoTests ? `${e.summary} Also tests: ${e.alsoTests.toLowerCase()}.` : e.summary,
                tags: e.subjects.map(subjectLink),
              }))}
            />
          </div>
        </section>
      ))}
    </>
  );
}

/** Total count, for copy like "20 exams". */
export const EXAM_COUNT = EXAMS.length;

const FEATURED_GUIDES = [
  "how-much-does-a-tutor-cost",
  "uk-school-system-explained-for-nigerian-parents",
  "when-to-start-11-plus-preparation",
  "is-online-tutoring-worth-it",
];

export function GuidesSection({ tint = false }: { tint?: boolean }) {
  const featured = FEATURED_GUIDES.map((slug) => guides.find((g) => g.slug === slug)).filter(
    (g) => g !== undefined,
  );
  return (
    <section className={`lp-section${tint ? " lp-tint" : ""}`} aria-labelledby="guides-heading">
      <div className="container">
        <h2 id="guides-heading" className="lp-h2">
          Guides for parents, from our academic lead
        </h2>
        <p className="lp-sub">
          Straight answers to the questions families ask us most, written by {GUIDE_AUTHOR.name}.
        </p>
        <LinkCardGrid
          cards={featured.map((g) => ({
            title: g.shortTitle,
            href: `/guides/${g.slug}`,
            meta: `${readMinutes(g)} min read`,
            body: g.description,
          }))}
        />
        <p className="lp-sub" style={{ marginTop: 20 }}>
          <Link href="/guides" className="lp-link">
            See all {guides.length} guides
          </Link>
        </p>
      </div>
    </section>
  );
}
