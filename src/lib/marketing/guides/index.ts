import type { Guide } from "./types";
import { tutorCostGuide } from "./tutor-cost";
import { elevenPlusGuide } from "./eleven-plus";
import { ukSchoolSystemGuide } from "./uk-school-system";
import { movingWithChildrenGuide } from "./moving-with-children";
import { britishVsAmericanGuide } from "./british-vs-american";
import { onlineTutoringWorthItGuide } from "./online-tutoring-worth-it";
import { satPrepGuide } from "./sat-prep-by-grade";
import { hiringNigerianTutorGuide } from "./hiring-nigerian-tutor";
import { nigerianOrLocalTutorGuide } from "./nigerian-or-local-tutor";
import { redFlagsTutorGuide } from "./red-flags-online-tutor";
import { consultationQuestionsGuide } from "./consultation-questions";
import { onlineSafetyGuide } from "./online-lesson-safety";
import { howMuchTutoringGuide } from "./how-much-tutoring";
import { isTutoringWorkingGuide } from "./is-tutoring-working";
import { lowerGradeAfterMoveGuide } from "./lower-grade-after-move";
import { usSchoolSystemGuide } from "./us-school-system";
import { canadaSchoolSystemGuide } from "./canada-school-system";
import { stateVsPrivateSchoolGuide } from "./state-vs-private-school";
import { grammarSchoolAdmissionsGuide } from "./grammar-school-admissions";
import { gcseGradesGuide } from "./gcse-grades";
import { spagGuide } from "./what-is-spag";
import { mathsMethodsGuide } from "./maths-methods";
import { writingHelpGuide } from "./struggles-with-writing";
import { carelessMistakesGuide } from "./careless-mistakes";
import { independentStudyGuide } from "./independent-study";
import { busyParentsGuide } from "./busy-parents";
import { satVsActGuide } from "./sat-vs-act";

export type { Guide } from "./types";

/** Guides grouped into the topic shelves on /guides, in display order. */
export const guideTopics: Array<{ id: string; title: string; sub: string; guides: Guide[] }> = [
  {
    id: "choosing",
    title: "Choosing and checking a tutor",
    sub: "What to ask, what to watch for, and whether it is working.",
    guides: [
      hiringNigerianTutorGuide,
      nigerianOrLocalTutorGuide,
      redFlagsTutorGuide,
      consultationQuestionsGuide,
      onlineSafetyGuide,
      tutorCostGuide,
      onlineTutoringWorthItGuide,
      howMuchTutoringGuide,
      isTutoringWorkingGuide,
    ],
  },
  {
    id: "schools",
    title: "School systems and moving",
    sub: "For families relocating or settling in.",
    guides: [
      ukSchoolSystemGuide,
      usSchoolSystemGuide,
      canadaSchoolSystemGuide,
      movingWithChildrenGuide,
      lowerGradeAfterMoveGuide,
      stateVsPrivateSchoolGuide,
      britishVsAmericanGuide,
    ],
  },
  {
    id: "exams",
    title: "Exams",
    sub: "Timelines, formats and what to practise.",
    guides: [
      elevenPlusGuide,
      grammarSchoolAdmissionsGuide,
      spagGuide,
      gcseGradesGuide,
      satPrepGuide,
      satVsActGuide,
    ],
  },
  {
    id: "home",
    title: "Helping at home",
    sub: "Small habits that make lessons stick.",
    guides: [
      busyParentsGuide,
      mathsMethodsGuide,
      writingHelpGuide,
      carelessMistakesGuide,
      independentStudyGuide,
    ],
  },
];

/** Parent guides rendered at /guides/[slug]. Order = order on /guides. */
export const guides: Guide[] = guideTopics.flatMap((t) => t.guides);

export function guideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

/** The byline on every guide. Facts from lib/marketing/defaults.ts. */
export const GUIDE_AUTHOR = {
  name: "Unyime Okorosobo",
  role: "Co-founder and academic lead, Masani",
  bio: "Unyime holds a Master's in International Education from the University of Manchester. A third generation educator with more than 15 years in teaching and education leadership, she was named one of Nigeria's 50 Most Inspirational Teachers in 2023.",
  photo: "/brand-v2/founder-unyime.webp",
};

/** Rough reading time, at about 220 words a minute. */
export function readMinutes(g: Guide): number {
  const words = [
    g.intro,
    ...g.sections.flatMap((s) => [
      s.heading,
      ...s.blocks.map((b) => {
        if (b.type === "p") return b.text;
        if (b.type === "list") return b.items.join(" ");
        if (b.type === "table") return [...b.head, ...b.rows.flat()].join(" ");
        return `${b.title} ${b.text}`;
      }),
    ]),
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
