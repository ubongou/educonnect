import { z } from "zod";

/**
 * Zod shapes for every section of the marketing CMS. Each schema is the
 * source of truth for both the admin form (to validate on save) and the
 * read-side parser in `content.ts` (to validate on read with a defaults
 * fallback).
 *
 * Image fields store either `""` (use the bundled /public asset) or a
 * Storage path under the `marketing-assets` bucket — never a full URL.
 * The resolver in `assetUrl.ts` turns the path into a CDN URL at render
 * time and appends a cachebuster.
 */

const nonEmpty = (msg = "Required") => z.string().trim().min(1, msg);
const optionalText = z.string().trim().default("");
const imagePath = z.string().trim().default("");

// -----------------------------------------------------------------------------
// Globals
// -----------------------------------------------------------------------------

export const globalsSchema = z.object({
  bookingUrl: nonEmpty("Booking URL is required").url("Must be a valid URL"),
  adminEmail: nonEmpty("Admin email is required").email("Must be a valid email"),
  websiteUrl: nonEmpty("Website URL is required").url("Must be a valid URL"),
  instagramUrl: optionalText,
  facebookUrl: optionalText,
});

export type GlobalsContent = z.infer<typeof globalsSchema>;

// -----------------------------------------------------------------------------
// Home / Hero
// -----------------------------------------------------------------------------

export const heroSchema = z.object({
  eyebrow: nonEmpty(),
  headingPart1: optionalText,
  headingAccent: optionalText,
  headingPart2: optionalText,
  subheading: nonEmpty(),
  primaryCtaLabel: nonEmpty(),
  secondaryCtaLabel: nonEmpty(),
  microcopy: nonEmpty(),
  card1Title: nonEmpty(),
  card1Body: nonEmpty(),
  card2Title: nonEmpty(),
  card2Body: nonEmpty(),
  heroImagePath: imagePath,
  heroImageAlt: nonEmpty(),
  mitBadgePath: imagePath,
  mitBadgeAlt: nonEmpty(),
});

export type HeroContent = z.infer<typeof heroSchema>;

// -----------------------------------------------------------------------------
// Home / Marquee
// -----------------------------------------------------------------------------

export const marqueeSchema = z.object({
  subjects: z.array(nonEmpty()).min(2).max(24),
});

export type MarqueeContent = z.infer<typeof marqueeSchema>;

// -----------------------------------------------------------------------------
// Home / Why grid
// -----------------------------------------------------------------------------

const whyGridCardSchema = z.object({
  numLabel: nonEmpty(),
  title: nonEmpty(),
  body: nonEmpty(),
});

export const whyGridSchema = z.object({
  eyebrow: nonEmpty(),
  title: nonEmpty(),
  subtitle: nonEmpty(),
  cards: z.array(whyGridCardSchema).length(3),
});

export type WhyGridContent = z.infer<typeof whyGridSchema>;

// -----------------------------------------------------------------------------
// Home / Data driven (was "how it works" in v1 — section_key kept for
// migration continuity, content shape rewritten to match the new design)
// -----------------------------------------------------------------------------

export const howItWorksSchema = z.object({
  eyebrow: nonEmpty(),
  title: nonEmpty(),
  subtitle: nonEmpty(),
  imagePath: imagePath,
  imageAlt: nonEmpty(),
});

export type HowItWorksContent = z.infer<typeof howItWorksSchema>;

// -----------------------------------------------------------------------------
// Home / Testimonials
// -----------------------------------------------------------------------------

const testimonialQuoteSchema = z.object({
  body: nonEmpty(),
  author: nonEmpty(),
  where: nonEmpty(),
  initial: z.string().trim().min(1).max(2),
});

export const testimonialsSchema = z.object({
  eyebrow: nonEmpty(),
  title: nonEmpty(),
  quotes: z.array(testimonialQuoteSchema).length(3),
});

export type TestimonialsContent = z.infer<typeof testimonialsSchema>;

// -----------------------------------------------------------------------------
// Home / Founders
// -----------------------------------------------------------------------------

const founderSchema = z.object({
  name: nonEmpty(),
  role: nonEmpty(),
  bio: nonEmpty(),
  photoPath: imagePath,
  photoAlt: nonEmpty(),
});

export const foundersSchema = z.object({
  eyebrow: nonEmpty(),
  headingLead: nonEmpty(),
  headingHighlight: nonEmpty(),
  intro: nonEmpty(),
  intro2: optionalText,
  founders: z.array(founderSchema).length(2),
});

export type FoundersContent = z.infer<typeof foundersSchema>;

// -----------------------------------------------------------------------------
// Home / Contact
// -----------------------------------------------------------------------------

export const contactSchema = z.object({
  eyebrow: nonEmpty(),
  title: nonEmpty(),
  lead: nonEmpty(),
  email: nonEmpty().email(),
  instagramLabel: nonEmpty(),
  instagramUrl: optionalText,
  facebookLabel: nonEmpty(),
  facebookUrl: optionalText,
});

export type ContactContent = z.infer<typeof contactSchema>;

// -----------------------------------------------------------------------------
// Pricing / Intro
// -----------------------------------------------------------------------------

export const pricingIntroSchema = z.object({
  eyebrow: nonEmpty(),
  titlePart1: optionalText,
  titleAccent: optionalText,
  titlePart2: optionalText,
  subtitle: nonEmpty(),
});

export type PricingIntroContent = z.infer<typeof pricingIntroSchema>;

// -----------------------------------------------------------------------------
// Pricing / Tiers
// -----------------------------------------------------------------------------

export const currencyCodes = ["NGN", "USD", "GBP", "CAD"] as const;
export type CurrencyCode = (typeof currencyCodes)[number];

const priceSchema = z.object({
  perSession: z.number().nonnegative(),
  total: z.number().nonnegative(),
  saving: z.number().nonnegative(),
  free: z.number().int().nonnegative(),
});

const tierSchema = z.object({
  sessions: z.number().int().positive(),
  duration: nonEmpty(),
  popular: z.boolean(),
  noCommitmentMessage: nonEmpty(),
  prices: z.object({
    NGN: priceSchema,
    USD: priceSchema,
    GBP: priceSchema,
    CAD: priceSchema,
  }),
});

export const pricingTiersSchema = z.object({
  tiers: z.array(tierSchema).length(3),
});

export type PricingTiersContent = z.infer<typeof pricingTiersSchema>;
export type Tier = z.infer<typeof tierSchema>;
export type Price = z.infer<typeof priceSchema>;

// -----------------------------------------------------------------------------
// Pricing / FAQ
// -----------------------------------------------------------------------------

const faqItemSchema = z.object({
  question: nonEmpty(),
  answer: nonEmpty(),
});

export const pricingFaqSchema = z.object({
  eyebrow: nonEmpty(),
  title: nonEmpty(),
  intro: nonEmpty(),
  items: z.array(faqItemSchema).min(1).max(12),
});

export type PricingFaqContent = z.infer<typeof pricingFaqSchema>;

// -----------------------------------------------------------------------------
// Section registry — couples a (page_slug, section_key) with its schema.
// -----------------------------------------------------------------------------

export const sectionRegistry = {
  globals: { pageSlug: "globals", sectionKey: "globals", schema: globalsSchema },
  hero: { pageSlug: "home", sectionKey: "hero", schema: heroSchema },
  marquee: { pageSlug: "home", sectionKey: "marquee", schema: marqueeSchema },
  why_grid: { pageSlug: "home", sectionKey: "why_grid", schema: whyGridSchema },
  how_it_works: {
    pageSlug: "home",
    sectionKey: "how_it_works",
    schema: howItWorksSchema,
  },
  testimonials: {
    pageSlug: "home",
    sectionKey: "testimonials",
    schema: testimonialsSchema,
  },
  founders: { pageSlug: "home", sectionKey: "founders", schema: foundersSchema },
  contact: { pageSlug: "home", sectionKey: "contact", schema: contactSchema },
  pricing_intro: {
    pageSlug: "pricing",
    sectionKey: "intro",
    schema: pricingIntroSchema,
  },
  pricing_tiers: {
    pageSlug: "pricing",
    sectionKey: "tiers",
    schema: pricingTiersSchema,
  },
  pricing_faq: {
    pageSlug: "pricing",
    sectionKey: "faq",
    schema: pricingFaqSchema,
  },
} as const;

export type SectionId = keyof typeof sectionRegistry;
