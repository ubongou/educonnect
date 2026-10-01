/**
 * A parent guide. Written in Unyime Okorosobo's voice (co-founder, academic
 * lead). Every fact either comes from a cited source or from Masani's own
 * published facts. House style: no dashes in customer-facing copy.
 */
export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "table"; caption?: string; head: string[]; rows: string[][] }
  | { type: "note"; title: string; text: string };

export type Guide = {
  slug: string;
  /** <title> without the " | Masani" suffix. */
  title: string;
  description: string;
  h1: string;
  /** Opening paragraph, shown large under the H1. */
  intro: string;
  published: string;
  /** Short label for cards and breadcrumbs. */
  shortTitle: string;
  sections: Array<{ heading: string; blocks: GuideBlock[] }>;
  faqs?: Array<{ question: string; answer: string }>;
  sources: Array<{ label: string; url: string }>;
};
