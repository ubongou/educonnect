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

// Trim then enforce min length so empty strings don't sneak through.
const nonEmpty = (msg = "Required") =>
  z.string().trim().min(1, msg);

const optionalText = z.string().trim().default("");

// Storage path inside marketing-assets bucket, e.g. "hero/hero.png".
// Empty = fall back to the bundled /public asset.
const imagePath = z.string().trim().default("");

// -----------------------------------------------------------------------------
// Globals — the booking URL + social links + admin email
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
  heading: nonEmpty(),
  subheading: nonEmpty(),
  primaryCtaLabel: nonEmpty(),
  secondaryCtaLabel: nonEmpty(),
  disclaimer: nonEmpty(),
  heroImagePath: imagePath,
  heroImageAlt: nonEmpty(),
  mitBadgePath: imagePath,
  mitBadgeAlt: nonEmpty(),
});

export type HeroContent = z.infer<typeof heroSchema>;

// -----------------------------------------------------------------------------
// Home / Why grid (3 cards + 3 polaroid photos)
// -----------------------------------------------------------------------------

const whyGridCardSchema = z.object({
  title: nonEmpty(),
  body: nonEmpty(),
});

const whyGridPolaroidSchema = z.object({
  imagePath: imagePath,
  alt: nonEmpty(),
});

export const whyGridSchema = z.object({
  eyebrow: nonEmpty(),
  title: nonEmpty(),
  subtitle: nonEmpty(),
  cards: z.array(whyGridCardSchema).length(3),
  polaroids: z.array(whyGridPolaroidSchema).length(3),
});

export type WhyGridContent = z.infer<typeof whyGridSchema>;

// -----------------------------------------------------------------------------
// Home / How it works (4 steps)
// -----------------------------------------------------------------------------

const howItWorksStepSchema = z.object({
  title: nonEmpty(),
  body: nonEmpty(),
});

export const howItWorksSchema = z.object({
  eyebrow: nonEmpty(),
  title: nonEmpty(),
  subtitle: nonEmpty(),
  ctaLabel: nonEmpty(),
  steps: z.array(howItWorksStepSchema).length(4),
});

export type HowItWorksContent = z.infer<typeof howItWorksSchema>;

// -----------------------------------------------------------------------------
// Home / Testimonials (3 quotes)
// -----------------------------------------------------------------------------

const testimonialQuoteSchema = z.object({
  body: nonEmpty(),
  author: nonEmpty(),
});

export const testimonialsSchema = z.object({
  eyebrow: nonEmpty(),
  title: nonEmpty(),
  quotes: z.array(testimonialQuoteSchema).length(3),
});

export type TestimonialsContent = z.infer<typeof testimonialsSchema>;

// -----------------------------------------------------------------------------
// Home / Founders (2 founders, alternating layout)
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
  founders: z.array(founderSchema).length(2),
});

export type FoundersContent = z.infer<typeof foundersSchema>;

// -----------------------------------------------------------------------------
// Home / Final CTA
// -----------------------------------------------------------------------------

export const finalCtaSchema = z.object({
  heading: nonEmpty(),
  subheading: nonEmpty(),
  ctaLabel: nonEmpty(),
  disclaimer: nonEmpty(),
});

export type FinalCtaContent = z.infer<typeof finalCtaSchema>;

// -----------------------------------------------------------------------------
// Pricing / Intro
// -----------------------------------------------------------------------------

export const pricingIntroSchema = z.object({
  eyebrow: nonEmpty(),
  title: nonEmpty(),
  subtitle: nonEmpty(),
});

export type PricingIntroContent = z.infer<typeof pricingIntroSchema>;

// -----------------------------------------------------------------------------
// Pricing / Tiers (3 tiers × 4 currencies × {perSession,total,saving,free})
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
// Pricing / Info cards (3 cards under the tier table)
// -----------------------------------------------------------------------------

const infoCardSchema = z.object({
  title: nonEmpty(),
  body: nonEmpty(),
});

export const pricingInfoCardsSchema = z.object({
  cards: z.array(infoCardSchema).length(3),
});

export type PricingInfoCardsContent = z.infer<typeof pricingInfoCardsSchema>;

// -----------------------------------------------------------------------------
// Section registry — couples a (page_slug, section_key) with its schema.
// Used by both the read path and the admin form router.
// -----------------------------------------------------------------------------

export const sectionRegistry = {
  globals: { pageSlug: "globals", sectionKey: "globals", schema: globalsSchema },
  hero: { pageSlug: "home", sectionKey: "hero", schema: heroSchema },
  why_grid: { pageSlug: "home", sectionKey: "why_grid", schema: whyGridSchema },
  how_it_works: { pageSlug: "home", sectionKey: "how_it_works", schema: howItWorksSchema },
  testimonials: { pageSlug: "home", sectionKey: "testimonials", schema: testimonialsSchema },
  founders: { pageSlug: "home", sectionKey: "founders", schema: foundersSchema },
  final_cta: { pageSlug: "home", sectionKey: "final_cta", schema: finalCtaSchema },
  pricing_intro: { pageSlug: "pricing", sectionKey: "intro", schema: pricingIntroSchema },
  pricing_tiers: { pageSlug: "pricing", sectionKey: "tiers", schema: pricingTiersSchema },
  pricing_info_cards: {
    pageSlug: "pricing",
    sectionKey: "info_cards",
    schema: pricingInfoCardsSchema,
  },
} as const;

export type SectionId = keyof typeof sectionRegistry;
