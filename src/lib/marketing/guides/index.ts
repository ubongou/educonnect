import type { Guide } from "./types";
import { tutorCostGuide } from "./tutor-cost";
import { elevenPlusGuide } from "./eleven-plus";
import { ukSchoolSystemGuide } from "./uk-school-system";
import { movingWithChildrenGuide } from "./moving-with-children";
import { britishVsAmericanGuide } from "./british-vs-american";
import { onlineTutoringWorthItGuide } from "./online-tutoring-worth-it";
import { satPrepGuide } from "./sat-prep-by-grade";

export type { Guide } from "./types";

/** Parent guides rendered at /guides/[slug]. Order = order on /guides. */
export const guides: Guide[] = [
  tutorCostGuide,
  elevenPlusGuide,
  ukSchoolSystemGuide,
  movingWithChildrenGuide,
  britishVsAmericanGuide,
  onlineTutoringWorthItGuide,
  satPrepGuide,
];

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
