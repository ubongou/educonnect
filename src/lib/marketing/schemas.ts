/**
 * Plain TypeScript content shapes for the marketing pages. These used to be
 * Zod schemas backing a database-editable CMS; content is now static
 * literals in `defaults.ts`, checked at compile time by these types.
 */

// -----------------------------------------------------------------------------
// Globals
// -----------------------------------------------------------------------------

export type GlobalsContent = {
  bookingUrl: string;
  adminEmail: string;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
};

// -----------------------------------------------------------------------------
// Home / Hero
// -----------------------------------------------------------------------------

export type HeroContent = {
  eyebrow: string;
  headingPart1: string;
  headingAccent: string;
  headingPart2: string;
  subheading: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  microcopy: string;
  card1Title: string;
  card1Body: string;
  card2Title: string;
  card2Body: string;
  heroImageAlt: string;
  mitBadgeAlt: string;
};

// -----------------------------------------------------------------------------
// Home / Marquee
// -----------------------------------------------------------------------------

export type MarqueeContent = {
  subjects: string[];
};

// -----------------------------------------------------------------------------
// Home / Why grid
// -----------------------------------------------------------------------------

export type WhyGridCard = {
  numLabel: string;
  title: string;
  body: string;
};

export type WhyGridContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cards: WhyGridCard[];
};

// -----------------------------------------------------------------------------
// Home / Data driven
// -----------------------------------------------------------------------------

export type HowItWorksContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageAlt: string;
};

// -----------------------------------------------------------------------------
// Home / Testimonials
// -----------------------------------------------------------------------------

export type TestimonialQuote = {
  body: string;
  author: string;
  where: string;
  initial: string;
};

export type TestimonialsContent = {
  eyebrow: string;
  title: string;
  quotes: TestimonialQuote[];
};

// -----------------------------------------------------------------------------
// Home / Founders
// -----------------------------------------------------------------------------

export type Founder = {
  name: string;
  role: string;
  bio: string;
  photoAlt: string;
};

export type FoundersContent = {
  eyebrow: string;
  headingLead: string;
  headingHighlight: string;
  intro: string;
  intro2: string;
  founders: Founder[];
};

// -----------------------------------------------------------------------------
// Home / Contact
// -----------------------------------------------------------------------------

export type ContactContent = {
  eyebrow: string;
  title: string;
  lead: string;
  email: string;
  instagramLabel: string;
  instagramUrl: string;
  facebookLabel: string;
  facebookUrl: string;
  whatsappLabel: string;
  whatsappUrl: string;
};

// -----------------------------------------------------------------------------
// Pricing / Intro
// -----------------------------------------------------------------------------

export type PricingIntroContent = {
  eyebrow: string;
  titlePart1: string;
  titleAccent: string;
  titlePart2: string;
  subtitle: string;
};

// -----------------------------------------------------------------------------
// Pricing / Tiers
// -----------------------------------------------------------------------------

export const currencyCodes = ["NGN", "USD", "GBP", "CAD"] as const;
export type CurrencyCode = (typeof currencyCodes)[number];

export type Price = {
  perSession: number;
  total: number;
  saving: number;
  free: number;
};

export type Tier = {
  sessions: number;
  duration: string;
  popular: boolean;
  noCommitmentMessage: string;
  prices: Record<CurrencyCode, Price>;
};

export type PricingTiersContent = {
  tiers: Tier[];
};

// -----------------------------------------------------------------------------
// Pricing / FAQ
// -----------------------------------------------------------------------------

export type FaqItem = {
  question: string;
  answer: string;
};

export type PricingFaqContent = {
  eyebrow: string;
  title: string;
  intro: string;
  items: FaqItem[];
};
