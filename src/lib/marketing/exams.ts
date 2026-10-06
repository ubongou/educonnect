/**
 * Subjects and exams, and how they link.
 *
 * One table (EXAMS, each with the subjects it covers) drives every link
 * between the two: an exam's "covers" list and a subject's "exams we prepare
 * for" block are both read from here, so they can never disagree. When an exam
 * gets its own page, set `pageSlug` and every related subject page links to it.
 *
 * Copy follows the seoPages house style: no dashes, general knowledge about
 * the exam only, no invented statistics.
 */
import { subjectBySlug, subjectOnlyPages } from "./seoPages";

export type ExamCountry = "uk" | "us" | "canada" | "international";

export const EXAM_COUNTRIES: Array<{
  id: ExamCountry;
  label: string;
  /** How the country reads mid sentence: "families in the UK". */
  inSentence: string;
  /** Short name for compact labels: "UK", "US". */
  short: string;
  /** The matching /online-tutoring/[slug] page, if there is one. */
  countryPageSlug?: string;
}> = [
  { id: "uk", label: "United Kingdom", inSentence: "the UK", short: "UK", countryPageSlug: "uk" },
  { id: "us", label: "United States", inSentence: "the US", short: "US", countryPageSlug: "usa" },
  { id: "canada", label: "Canada", inSentence: "Canada", short: "Canada", countryPageSlug: "canada" },
  { id: "international", label: "International", inSentence: "international schools", short: "International" },
];

/**
 * Subjects we teach that don't (yet) have their own page. `relatedPage` points
 * at the subject page that covers them, so the label can still link somewhere.
 */
export const EXTRA_SUBJECTS = [
  { id: "further-maths", label: "Further maths", relatedPage: "maths" },
  { id: "calculus", label: "Calculus", relatedPage: "maths" },
  { id: "statistics", label: "Statistics", relatedPage: "maths" },
  { id: "computer-science", label: "Computer science & coding" },
  { id: "french", label: "French" },
  { id: "spanish", label: "Spanish" },
  { id: "economics", label: "Economics" },
  { id: "english-literature", label: "English literature", relatedPage: "english" },
] as const satisfies ReadonlyArray<{ id: string; label: string; relatedPage?: string }>;

type ExtraSubjectId = (typeof EXTRA_SUBJECTS)[number]["id"];

/** A subject reference: a subject page slug, or one of EXTRA_SUBJECTS. */
export type SubjectRef =
  | "maths"
  | "english"
  | "science"
  | "biology"
  | "chemistry"
  | "physics"
  | "reading-and-creative-writing"
  | "public-speaking"
  | ExtraSubjectId;

export type Exam = {
  id: string;
  name: string;
  /** Shorter label for compact lists, where the full name would wrap. */
  shortName?: string;
  countries: ExamCountry[];
  /** When it's taken, in a parent's terms. */
  when: string;
  summary: string;
  /** Subjects this exam covers, most important first. */
  subjects: SubjectRef[];
  /** Skills an exam tests that aren't school subjects (e.g. 11+ reasoning). */
  alsoTests?: string;
  /** Set when the exam has its own page at /tutoring/[pageSlug]. */
  pageSlug?: string;
};

export const EXAMS: Exam[] = [
  // ----- United Kingdom ------------------------------------------------------
  {
    id: "ks2-sats",
    name: "KS2 SATs",
    countries: ["uk"],
    when: "Year 6, in May (age 10 to 11)",
    summary:
      "National tests in reading, maths, and grammar, punctuation and spelling at the end of primary school in England. Results go to your child's secondary school.",
    subjects: ["maths", "english"],
    pageSlug: "ks2-sats",
  },
  {
    id: "11-plus",
    name: "11+",
    countries: ["uk"],
    when: "September of Year 6 (age 10 to 11)",
    summary:
      "Entrance exams for grammar schools and many independent schools, usually covering English, maths, verbal reasoning and non verbal reasoning.",
    subjects: ["maths", "english"],
    alsoTests: "Verbal and non verbal reasoning",
    pageSlug: "11-plus",
  },
  {
    id: "common-entrance",
    name: "Common Entrance & ISEB pre tests",
    shortName: "Common Entrance",
    countries: ["uk"],
    when: "Age 10 to 13",
    summary:
      "Entrance assessments for independent senior schools: the ISEB Common Pre Test, usually taken around Year 6 or 7, and Common Entrance exams at 13.",
    subjects: ["maths", "english", "science", "french"],
    alsoTests: "Verbal and non verbal reasoning",
    pageSlug: "common-entrance",
  },
  {
    id: "gcse",
    name: "GCSE & IGCSE",
    countries: ["uk", "international"],
    when: "Year 11 (age 15 to 16)",
    summary:
      "The main qualifications at 16 in England, Wales and Northern Ireland, and widely taken in international schools. GCSEs are graded 9 to 1.",
    subjects: [
      "maths",
      "english",
      "biology",
      "chemistry",
      "physics",
      "further-maths",
      "english-literature",
      "computer-science",
      "french",
      "spanish",
      "economics",
    ],
    pageSlug: "gcse",
  },
  {
    id: "a-level",
    name: "A level",
    countries: ["uk", "international"],
    when: "Years 12 and 13 (age 16 to 18)",
    summary:
      "Usually three subjects studied over two years. Universities make offers based on predicted and final A level grades.",
    subjects: [
      "maths",
      "further-maths",
      "biology",
      "chemistry",
      "physics",
      "economics",
      "english-literature",
      "computer-science",
    ],
    pageSlug: "a-level",
  },
  {
    id: "scottish-qualifications",
    name: "National 5 & Highers",
    countries: ["uk"],
    when: "S4 to S6 in Scotland (age 15 to 18)",
    summary:
      "Scotland's main school qualifications. National 5s are usually taken in S4 and Highers in S5, and universities use Highers for offers.",
    subjects: ["maths", "english", "biology", "chemistry", "physics"],
    pageSlug: "national-5-highers",
  },

  // ----- United States -------------------------------------------------------
  {
    id: "gifted-tests",
    name: "Gifted & talented tests",
    shortName: "Gifted & talented",
    countries: ["us"],
    when: "Elementary school",
    summary:
      "Tests such as the CogAT, NNAT and OLSAT used to place children in gifted and talented programs. They focus on reasoning as much as school knowledge.",
    subjects: ["maths", "english"],
    alsoTests: "Verbal, quantitative and non verbal reasoning",
    pageSlug: "gifted-and-talented",
  },
  {
    id: "state-tests",
    name: "State tests",
    countries: ["us"],
    when: "Grades 3 to 8, and high school",
    summary:
      "Annual state assessments such as the STAAR in Texas and the Regents exams in New York, covering reading, math and science.",
    subjects: ["maths", "english", "science"],
  },
  {
    id: "ssat-isee",
    name: "SSAT & ISEE",
    countries: ["us", "canada"],
    when: "Grades 3 to 11, for private school entry",
    summary:
      "Admission tests for private and independent schools in the US and Canada, covering verbal skills, reading, math and a writing sample.",
    subjects: ["maths", "english"],
    alsoTests: "Verbal reasoning",
    pageSlug: "ssat-isee",
  },
  {
    id: "shsat",
    name: "SHSAT",
    countries: ["us"],
    when: "Grade 8 (or 9), New York City",
    summary:
      "The entrance test for New York City's specialized high schools, with an English language arts section and a math section.",
    subjects: ["maths", "english"],
    pageSlug: "shsat",
  },
  {
    id: "sat-act",
    name: "SAT & ACT",
    countries: ["us", "canada"],
    when: "Grades 11 and 12, with the PSAT before",
    summary:
      "College admission tests used by many US universities, also taken by students in Canada and elsewhere who are applying to the US.",
    subjects: ["maths", "english"],
    pageSlug: "sat-act",
  },
  {
    id: "ap",
    name: "AP exams",
    countries: ["us", "canada"],
    when: "High school, in May",
    summary:
      "College level courses and exams taken in high school, offered across the US and in many Canadian schools. Strong scores can earn college credit.",
    subjects: [
      "calculus",
      "statistics",
      "biology",
      "chemistry",
      "physics",
      "english-literature",
      "computer-science",
      "economics",
      "spanish",
      "french",
    ],
    pageSlug: "ap-exams",
  },

  // ----- Canada --------------------------------------------------------------
  {
    id: "eqao-osslt",
    name: "EQAO & OSSLT (Ontario)",
    shortName: "EQAO & OSSLT",
    countries: ["canada"],
    when: "Grades 3, 6 and 9, and the Grade 10 literacy test",
    summary:
      "Ontario's provincial assessments in reading, writing and math, and the Ontario Secondary School Literacy Test needed to graduate.",
    subjects: ["maths", "english"],
    pageSlug: "eqao-osslt",
  },
  {
    id: "alberta",
    name: "Alberta PATs & Diploma exams",
    shortName: "Alberta PATs & Diplomas",
    countries: ["canada"],
    when: "Grades 6 and 9, and Grade 12",
    summary:
      "Provincial Achievement Tests in Grades 6 and 9, and Diploma exams in Grade 12 courses such as Math 30, Biology 30, Chemistry 30, Physics 30 and English 30.",
    subjects: ["maths", "english", "science", "biology", "chemistry", "physics"],
    pageSlug: "alberta-pats-diplomas",
  },
  {
    id: "bc-assessments",
    name: "BC Graduation Assessments",
    shortName: "BC graduation tests",
    countries: ["canada"],
    when: "Grades 10 and 12",
    summary:
      "British Columbia's graduation numeracy assessment and literacy assessments, required to graduate.",
    subjects: ["maths", "english"],
  },
  {
    id: "quebec-ministry",
    name: "Quebec Ministry exams",
    countries: ["canada"],
    when: "Secondary 4 and 5",
    summary:
      "Uniform exams set by Quebec's Ministry of Education, including mathematics, science and languages, that count towards the secondary school diploma.",
    subjects: ["maths", "science", "english", "french"],
  },
  {
    id: "cat4",
    name: "CAT4 & gifted assessments",
    shortName: "CAT4 & gifted tests",
    countries: ["canada"],
    when: "Elementary and middle school",
    summary:
      "Reasoning tests such as the CAT4, used by many school boards and private schools for gifted identification and admission.",
    subjects: ["maths", "english"],
    alsoTests: "Verbal, quantitative and non verbal reasoning",
  },
  {
    id: "waterloo-contests",
    name: "Waterloo math contests",
    countries: ["canada"],
    when: "Grades 7 to 12",
    summary:
      "The University of Waterloo's math contests, from Gauss to Euclid, taken by students across Canada and valued by competitive university programs.",
    subjects: ["maths"],
  },
  {
    id: "delf",
    name: "DELF French diplomas",
    shortName: "DELF French",
    countries: ["canada", "international"],
    when: "Any age",
    summary:
      "Official French language diplomas, popular with French immersion and core French students in Canada.",
    subjects: ["french"],
  },

  // ----- International -------------------------------------------------------
  {
    id: "ib",
    name: "IB (PYP, MYP & Diploma)",
    shortName: "IB",
    countries: ["international"],
    when: "Primary to age 18",
    summary:
      "The International Baccalaureate, taught in international schools worldwide and in many UK, US and Canadian schools. The Diploma is taken at 16 to 18.",
    subjects: [
      "maths",
      "english",
      "biology",
      "chemistry",
      "physics",
      "economics",
      "french",
      "spanish",
      "computer-science",
    ],
    pageSlug: "ib",
  },
];

// -----------------------------------------------------------------------------
// Lookups
// -----------------------------------------------------------------------------

export type SubjectLink = { label: string; href?: string };

/** Display label and link (if any) for a subject reference. */
export function subjectLink(ref: SubjectRef): SubjectLink {
  const page = subjectBySlug(ref);
  if (page) return { label: page.name, href: `/tutoring/${page.slug}` };
  const extra = EXTRA_SUBJECTS.find((e) => e.id === ref);
  if (!extra) return { label: ref };
  const related = "relatedPage" in extra ? extra.relatedPage : undefined;
  return { label: extra.label, href: related ? `/tutoring/${related}` : undefined };
}

export function examHref(exam: Exam): string | undefined {
  return exam.pageSlug ? `/tutoring/${exam.pageSlug}` : undefined;
}

export function examsForCountry(country: ExamCountry): Exam[] {
  return EXAMS.filter((e) => e.countries.includes(country));
}

/** Exams for a /online-tutoring/[slug] country page, plus international ones. */
export function examsForCountryPage(countryPageSlug: string): Exam[] {
  const c = EXAM_COUNTRIES.find((x) => x.countryPageSlug === countryPageSlug);
  if (!c) return [];
  return EXAMS.filter((e) => e.countries.includes(c.id) || e.countries.includes("international"));
}

/** Exams that cover a subject page (directly, or through an extra subject it hosts). */
export function examsForSubject(subjectSlug: string): Exam[] {
  const hosted = EXTRA_SUBJECTS.filter(
    (e) => "relatedPage" in e && e.relatedPage === subjectSlug,
  ).map((e) => e.id as SubjectRef);
  const refs = new Set<SubjectRef>([subjectSlug as SubjectRef, ...hosted]);
  return EXAMS.filter((e) => e.subjects.some((s) => refs.has(s)));
}

/** The exam behind an exam preparation page (11+, SAT and ACT). */
export function examForPage(pageSlug: string): Exam | undefined {
  return EXAMS.find((e) => e.pageSlug === pageSlug);
}

/**
 * Exams grouped by country for display, in EXAM_COUNTRIES order. Within a
 * country, its own exams come first and ones shared with another country
 * (Canada's SSAT, SAT and AP) after, so each list leads with what's local.
 */
export function examsByCountry(exams: Exam[] = EXAMS) {
  return EXAM_COUNTRIES.map((c) => {
    const here = exams.filter((e) => e.countries.includes(c.id));
    const own = here.filter((e) => e.countries[0] === c.id);
    const shared = here.filter((e) => e.countries[0] !== c.id);
    return { ...c, exams: [...own, ...shared] };
  }).filter((g) => g.exams.length > 0);
}

/** The subject cards, in display order. */
export const SUBJECT_CARD_ORDER = [
  "maths",
  "english",
  "science",
  "biology",
  "chemistry",
  "physics",
  "reading-and-creative-writing",
  "public-speaking",
] as const;

export function subjectCards() {
  return SUBJECT_CARD_ORDER.map((slug) => subjectOnlyPages.find((s) => s.slug === slug)).filter(
    (s): s is NonNullable<typeof s> => Boolean(s),
  );
}

/** The short label a subject card shows for its age range, where it has one. */
export const SUBJECT_CARD_AGES: Partial<Record<(typeof SUBJECT_CARD_ORDER)[number], string>> = {
  science: "Ages 5 to 11",
  biology: "Ages 11 to 18",
  chemistry: "Ages 11 to 18",
  physics: "Ages 11 to 18",
};

/** One line per subject card. Short on purpose: the page has the detail. */
export const SUBJECT_CARD_BLURBS: Record<(typeof SUBJECT_CARD_ORDER)[number], string> = {
  maths: "Number, algebra, geometry and problem solving, from times tables to calculus.",
  english: "Reading, writing, grammar and comprehension, at your child's level.",
  science: "Curious questions, simple experiments and the big ideas of primary science.",
  biology: "Cells, the human body, genetics and ecology, up to GCSE, A level, AP and IB.",
  chemistry: "Atoms, reactions, equations and moles, up to GCSE, A level, AP and IB.",
  physics: "Forces, energy, electricity and waves, up to GCSE, A level, AP and IB.",
  "reading-and-creative-writing":
    "A love of books, strong comprehension and confident, creative writing.",
  "public-speaking": "The confidence to speak up, present and debate, in class and beyond.",
};
