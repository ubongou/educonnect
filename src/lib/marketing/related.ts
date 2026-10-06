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
