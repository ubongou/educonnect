import { describe, expect, it } from "vitest";
import {
  EXAMS,
  EXAM_COUNTRIES,
  EXTRA_SUBJECTS,
  SUBJECT_CARD_BLURBS,
  SUBJECT_CARD_ORDER,
  examForPage,
  examsForCountryPage,
  examsForSubject,
  subjectCards,
  subjectLink,
} from "@/lib/marketing/exams";
import { GUIDE_RELATIONS, guidesForSubject, relatedForGuide } from "@/lib/marketing/related";
import { guides } from "@/lib/marketing/guides";
import {
  countryPages,
  examPrepPages,
  subjectBySlug,
  subjectOnlyPages,
} from "@/lib/marketing/seoPages";

describe("subjects and exams", () => {
  it("keeps exam prep pages out of the subject list", () => {
    expect(examPrepPages.map((p) => p.slug).sort()).toEqual(
      [
        "11-plus",
        "a-level",
        "alberta-pats-diplomas",
        "ap-exams",
        "common-entrance",
        "eqao-osslt",
        "gcse",
        "gifted-and-talented",
        "ib",
        "ks2-sats",
        "national-5-highers",
        "sat-act",
        "shsat",
        "ssat-isee",
      ].sort(),
    );
    expect(subjectOnlyPages.some((p) => p.kind === "exam")).toBe(false);
  });

  it("shows a card for every subject page, in order", () => {
    expect(subjectCards().map((s) => s.slug)).toEqual([...SUBJECT_CARD_ORDER]);
    expect(subjectOnlyPages.map((s) => s.slug).sort()).toEqual([...SUBJECT_CARD_ORDER].sort());
    for (const slug of SUBJECT_CARD_ORDER) expect(SUBJECT_CARD_BLURBS[slug]).toBeTruthy();
  });

  it("resolves every subject an exam covers", () => {
    for (const e of EXAMS) {
      expect(e.subjects.length, e.id).toBeGreaterThan(0);
      for (const ref of e.subjects) {
        const known = subjectBySlug(ref) || EXTRA_SUBJECTS.some((x) => x.id === ref);
        expect(known, `${e.id} → ${ref}`).toBeTruthy();
      }
    }
  });

  it("points exam page links at real exam prep pages, and back", () => {
    for (const e of EXAMS.filter((x) => x.pageSlug)) {
      expect(subjectBySlug(e.pageSlug!)?.kind, e.id).toBe("exam");
    }
    for (const p of examPrepPages) expect(examForPage(p.slug), p.slug).toBeDefined();
  });

  it("gives every country page its exams, and every science page its exams", () => {
    for (const c of countryPages) expect(examsForCountryPage(c.slug).length, c.slug).toBeGreaterThan(3);
    for (const s of ["biology", "chemistry", "physics", "maths", "english"]) {
      expect(examsForSubject(s).length, s).toBeGreaterThan(2);
    }
    // Calculus lives on the maths page, so AP shows up there.
    expect(examsForSubject("maths").map((e) => e.id)).toContain("ap");
  });

  it("lists more than one exam for Canada", () => {
    const canada = EXAMS.filter((e) => e.countries.includes("canada")).map((e) => e.id);
    expect(canada).toEqual(
      expect.arrayContaining(["eqao-osslt", "alberta", "bc-assessments", "quebec-ministry"]),
    );
  });

  it("only links extra subjects to pages that exist", () => {
    for (const e of EXTRA_SUBJECTS) {
      const l = subjectLink(e.id);
      if ("relatedPage" in e) expect(l.href, e.id).toBe(`/tutoring/${e.relatedPage}`);
      else expect(l.href, e.id).toBeUndefined();
    }
  });

  it("has unique exam ids and known countries", () => {
    const ids = EXAMS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const countries = new Set(EXAM_COUNTRIES.map((c) => c.id));
    for (const e of EXAMS) for (const c of e.countries) expect(countries.has(c), e.id).toBe(true);
  });

  it("uses no dashes in customer facing copy", () => {
    const text = JSON.stringify({ EXAMS, EXTRA_SUBJECTS, SUBJECT_CARD_BLURBS, EXAM_COUNTRIES });
    expect(text).not.toMatch(/[—–]/);
    expect(text).not.toMatch(/ - /);
  });
});

describe("related links", () => {
  it("only refers to guides, exams and countries that exist", () => {
    const guideSlugs = new Set(guides.map((g) => g.slug));
    const examIds = new Set(EXAMS.map((e) => e.id));
    const countrySlugs = new Set(countryPages.map((c) => c.slug));
    for (const [slug, r] of Object.entries(GUIDE_RELATIONS)) {
      expect(guideSlugs.has(slug), slug).toBe(true);
      for (const g of r.guides) expect(guideSlugs.has(g), `${slug} → ${g}`).toBe(true);
      for (const e of r.exams ?? []) expect(examIds.has(e), `${slug} → ${e}`).toBe(true);
      for (const c of r.countries ?? []) expect(countrySlugs.has(c), `${slug} → ${c}`).toBe(true);
    }
  });

  it("gives every guide related links", () => {
    for (const g of guides) {
      const r = relatedForGuide(g.slug);
      expect(r.guides.length, g.slug).toBeGreaterThan(0);
    }
  });

  it("links maths and English pages to guides", () => {
    expect(guidesForSubject("maths").length).toBeGreaterThan(0);
    expect(guidesForSubject("english").length).toBeGreaterThan(0);
  });
});
