/**
 * Which guides, subjects, exams and countries relate to each other, so every
 * page can point to its neighbours. Declared once per guide; subject, exam and
 * country pages find their guides by reading this in reverse.
 */
import { guides, type Guide } from "./guides";
import { EXAMS, examHref, subjectLink, type SubjectRef } from "./exams";
import { countryPages } from "./seoPages";

type GuideRelations = {
  guides: string[];
  subjects?: SubjectRef[];
  /** Exam ids from EXAMS. */
  exams?: string[];
  /** Country page slugs. */
  countries?: string[];
};

export const GUIDE_RELATIONS: Record<string, GuideRelations> = {
  "hiring-a-nigerian-tutor-what-to-check": {
    guides: ["red-flags-hiring-online-tutor", "questions-to-ask-free-tutoring-consultation", "keeping-your-child-safe-in-online-lessons"],
    exams: ["ks2-sats", "11-plus", "gcse", "sat-act"],
    countries: ["uk", "usa", "canada"],
  },
  "nigerian-tutor-or-local-tutor": {
    guides: ["hiring-a-nigerian-tutor-what-to-check", "how-much-does-a-tutor-cost", "is-online-tutoring-worth-it"],
    countries: ["uk", "usa", "canada"],
  },
  "red-flags-hiring-online-tutor": {
    guides: ["hiring-a-nigerian-tutor-what-to-check", "keeping-your-child-safe-in-online-lessons", "is-tutoring-working-what-to-look-for"],
    countries: ["uk", "usa", "canada"],
  },
  "questions-to-ask-free-tutoring-consultation": {
    guides: ["hiring-a-nigerian-tutor-what-to-check", "red-flags-hiring-online-tutor", "how-much-tutoring-does-my-child-need"],
    countries: ["uk", "usa", "canada"],
  },
  "keeping-your-child-safe-in-online-lessons": {
    guides: ["hiring-a-nigerian-tutor-what-to-check", "red-flags-hiring-online-tutor", "questions-to-ask-free-tutoring-consultation"],
    countries: ["uk", "usa", "canada"],
  },
  "how-much-tutoring-does-my-child-need": {
    guides: ["is-tutoring-working-what-to-look-for", "is-online-tutoring-worth-it", "get-your-child-to-study-independently"],
    exams: ["11-plus", "gcse", "sat-act"],
    countries: ["uk", "usa", "canada"],
  },
  "is-tutoring-working-what-to-look-for": {
    guides: ["how-much-tutoring-does-my-child-need", "red-flags-hiring-online-tutor", "is-online-tutoring-worth-it"],
    countries: ["uk", "usa", "canada"],
  },
  "child-put-in-lower-grade-after-moving-from-nigeria": {
    guides: ["uk-school-system-explained-for-nigerian-parents", "us-school-system-explained-for-nigerian-parents", "canadian-school-system-explained-for-nigerian-parents"],
    exams: ["ks2-sats", "eqao-osslt", "gifted-tests"],
    countries: ["uk", "usa", "canada"],
  },
  "us-school-system-explained-for-nigerian-parents": {
    guides: ["sat-vs-act-which-test", "sat-prep-by-grade", "child-put-in-lower-grade-after-moving-from-nigeria"],
    exams: ["state-tests", "sat-act", "ap", "ib", "gifted-tests", "shsat", "ssat-isee"],
    countries: ["usa"],
  },
  "canadian-school-system-explained-for-nigerian-parents": {
    guides: ["child-put-in-lower-grade-after-moving-from-nigeria", "moving-from-nigeria-with-children-school-checklist", "sat-vs-act-which-test"],
    exams: ["eqao-osslt", "alberta", "bc-assessments", "quebec-ministry", "waterloo-contests"],
    countries: ["canada"],
  },
  "state-or-private-school-after-moving-abroad": {
    guides: ["grammar-school-admissions-by-area", "uk-school-system-explained-for-nigerian-parents", "us-school-system-explained-for-nigerian-parents"],
    exams: ["11-plus", "common-entrance", "ssat-isee", "shsat"],
    countries: ["uk", "usa", "canada"],
  },
  "grammar-school-admissions-by-area": {
    guides: ["when-to-start-11-plus-preparation", "state-or-private-school-after-moving-abroad", "what-is-spag-ks2"],
    exams: ["11-plus", "ks2-sats", "common-entrance"],
    countries: ["uk"],
  },
  "gcse-grades-explained": {
    guides: ["uk-school-system-explained-for-nigerian-parents", "british-vs-american-curriculum", "good-at-maths-struggles-with-writing"],
    exams: ["gcse", "a-level", "scottish-qualifications"],
    countries: ["uk"],
  },
  "what-is-spag-ks2": {
    guides: ["good-at-maths-struggles-with-writing", "when-to-start-11-plus-preparation", "careless-mistakes-running-out-of-time-in-exams"],
    subjects: ["english"],
    exams: ["ks2-sats", "11-plus"],
    countries: ["uk"],
  },
  "different-maths-methods-school": {
    guides: ["help-your-child-with-school-when-you-work-full-time", "uk-school-system-explained-for-nigerian-parents", "british-vs-american-curriculum"],
    subjects: ["maths"],
    exams: ["ks2-sats", "11-plus", "state-tests"],
    countries: ["uk", "usa"],
  },
  "good-at-maths-struggles-with-writing": {
    guides: ["what-is-spag-ks2", "get-your-child-to-study-independently", "child-put-in-lower-grade-after-moving-from-nigeria"],
    subjects: ["english", "reading-and-creative-writing"],
    exams: ["ks2-sats", "gcse"],
    countries: ["uk", "usa", "canada"],
  },
  "careless-mistakes-running-out-of-time-in-exams": {
    guides: ["get-your-child-to-study-independently", "how-much-tutoring-does-my-child-need", "what-is-spag-ks2"],
    subjects: ["maths"],
    exams: ["ks2-sats", "11-plus", "gcse", "sat-act"],
    countries: ["uk", "usa", "canada"],
  },
  "get-your-child-to-study-independently": {
    guides: ["careless-mistakes-running-out-of-time-in-exams", "help-your-child-with-school-when-you-work-full-time", "how-much-tutoring-does-my-child-need"],
    exams: ["ks2-sats", "11-plus", "gcse", "sat-act"],
    countries: ["uk", "usa", "canada"],
  },
  "help-your-child-with-school-when-you-work-full-time": {
    guides: ["different-maths-methods-school", "get-your-child-to-study-independently", "how-much-tutoring-does-my-child-need"],
    subjects: ["maths", "english"],
    countries: ["uk", "usa", "canada"],
  },
  "sat-vs-act-which-test": {
    guides: ["sat-prep-by-grade", "us-school-system-explained-for-nigerian-parents", "careless-mistakes-running-out-of-time-in-exams"],
    exams: ["sat-act", "ap"],
    countries: ["usa", "canada"],
  },
  "how-much-does-a-tutor-cost": {
    guides: ["is-online-tutoring-worth-it", "uk-school-system-explained-for-nigerian-parents"],
    subjects: ["maths", "english"],
    countries: ["uk", "usa", "canada"],
  },
  "when-to-start-11-plus-preparation": {
    guides: ["uk-school-system-explained-for-nigerian-parents", "how-much-does-a-tutor-cost"],
    subjects: ["maths", "english"],
    exams: ["11-plus", "ks2-sats", "common-entrance"],
    countries: ["uk"],
  },
  "uk-school-system-explained-for-nigerian-parents": {
    guides: [
      "when-to-start-11-plus-preparation",
      "moving-from-nigeria-with-children-school-checklist",
      "british-vs-american-curriculum",
    ],
    exams: ["ks2-sats", "11-plus", "gcse", "a-level", "scottish-qualifications"],
    countries: ["uk"],
  },
  "moving-from-nigeria-with-children-school-checklist": {
    guides: ["uk-school-system-explained-for-nigerian-parents", "british-vs-american-curriculum"],
    exams: ["eqao-osslt", "ks2-sats"],
    countries: ["uk", "canada"],
  },
  "british-vs-american-curriculum": {
    guides: ["sat-prep-by-grade", "uk-school-system-explained-for-nigerian-parents"],
    subjects: ["maths", "english"],
    exams: ["gcse", "a-level", "sat-act", "ap"],
    countries: ["uk", "usa"],
  },
  "is-online-tutoring-worth-it": {
    guides: ["how-much-does-a-tutor-cost", "when-to-start-11-plus-preparation"],
    subjects: ["maths", "english", "reading-and-creative-writing"],
  },
  "sat-prep-by-grade": {
    guides: ["british-vs-american-curriculum", "is-online-tutoring-worth-it"],
    subjects: ["maths", "english"],
    exams: ["sat-act", "ap"],
    countries: ["usa", "canada"],
  },
};

type Link = { href: string; label: string };

function guideLink(slug: string): Link | null {
  const g = guides.find((x) => x.slug === slug);
  return g ? { href: `/guides/${g.slug}`, label: g.shortTitle } : null;
}

/** Related links for the bottom of a guide. */
export function relatedForGuide(slug: string) {
  const r = GUIDE_RELATIONS[slug];
  if (!r) return { guides: [], subjectsAndExams: [], countries: [] };

  const subjectLinks = (r.subjects ?? [])
    .map(subjectLink)
    .filter((s): s is Link => Boolean(s.href));
  const examLinks = (r.exams ?? [])
    .map((id) => EXAMS.find((e) => e.id === id))
    .filter((e) => e !== undefined)
    .flatMap((e) => {
      const href = examHref(e);
      // Exams without a page link to the exams list, anchored to that exam.
      return [{ href: href ?? `/exams#${e.id}`, label: href ? `${e.name} preparation` : e.name }];
    });

  return {
    guides: r.guides.map(guideLink).filter((l): l is Link => l !== null),
    subjectsAndExams: [...subjectLinks, ...examLinks],
    countries: (r.countries ?? [])
      .map((c) => countryPages.find((p) => p.slug === c))
      .filter((c) => c !== undefined)
      .map((c) => ({ href: `/online-tutoring/${c.slug}`, label: `Online tutoring in ${c.country}` })),
  };
}

function guidesWhere(test: (r: GuideRelations) => boolean): Link[] {
  return guides
    .filter((g: Guide) => {
      const r = GUIDE_RELATIONS[g.slug];
      return r ? test(r) : false;
    })
    .map((g) => ({ href: `/guides/${g.slug}`, label: g.shortTitle }));
}

/** Guides for a subject page. */
export function guidesForSubject(slug: string): Link[] {
  return guidesWhere((r) => (r.subjects ?? []).includes(slug as SubjectRef));
}

/** Guides for an exam (by exam id). */
export function guidesForExam(examId: string): Link[] {
  return guidesWhere((r) => (r.exams ?? []).includes(examId));
}

/** Guides for a country page. */
export function guidesForCountry(countrySlug: string): Link[] {
  return guidesWhere((r) => (r.countries ?? []).includes(countrySlug));
}
