import { createClient } from "@/lib/supabase/server";
import {
  defaultContact,
  defaultFounders,
  defaultGlobals,
  defaultHero,
  defaultHowItWorks,
  defaultMarquee,
  defaultPricingFaq,
  defaultPricingIntro,
  defaultPricingTiers,
  defaultTestimonials,
  defaultWhyGrid,
} from "./defaults";
import type {
  ContactContent,
  FoundersContent,
  GlobalsContent,
  HeroContent,
  HowItWorksContent,
  MarqueeContent,
  PricingFaqContent,
  PricingIntroContent,
  PricingTiersContent,
  TestimonialsContent,
  WhyGridContent,
} from "./schemas";
import {
  contactSchema,
  foundersSchema,
  globalsSchema,
  heroSchema,
  howItWorksSchema,
  marqueeSchema,
  pricingFaqSchema,
  pricingIntroSchema,
  pricingTiersSchema,
  testimonialsSchema,
  whyGridSchema,
} from "./schemas";
import type { ZodType } from "zod";

type SectionRow = {
  page_slug: string;
  section_key: string;
  content: unknown;
  updated_at: string;
};

type SectionMap = Map<string, SectionRow>;

function key(pageSlug: string, sectionKey: string): string {
  return `${pageSlug}/${sectionKey}`;
}

function pickSection<T>(
  map: SectionMap,
  pageSlug: string,
  sectionKey: string,
  schema: ZodType<T>,
  fallback: T,
): { content: T; updatedAt: string | null } {
  const row = map.get(key(pageSlug, sectionKey));
  if (!row) return { content: fallback, updatedAt: null };

  const parsed = schema.safeParse(row.content);
  if (!parsed.success) {
    console.warn(
      `[marketing] ${pageSlug}/${sectionKey} failed parse — using defaults:`,
      parsed.error.issues[0]?.message,
    );
    return { content: fallback, updatedAt: row.updated_at };
  }
  return { content: parsed.data, updatedAt: row.updated_at };
}

async function fetchSections(pageSlugs: string[]): Promise<SectionMap> {
  const map: SectionMap = new Map();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_sections")
      .select("page_slug, section_key, content, updated_at")
      .in("page_slug", pageSlugs);

    if (error) {
      console.warn("[marketing] site_sections fetch failed:", error.message);
      return map;
    }

    for (const row of data ?? []) {
      map.set(key(row.page_slug, row.section_key), row as SectionRow);
    }
  } catch (err) {
    console.warn("[marketing] site_sections fetch threw:", err);
  }
  return map;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export type WithUpdatedAt<T> = { content: T; updatedAt: string | null };

export type HomeContent = {
  hero: WithUpdatedAt<HeroContent>;
  marquee: WithUpdatedAt<MarqueeContent>;
  whyGrid: WithUpdatedAt<WhyGridContent>;
  howItWorks: WithUpdatedAt<HowItWorksContent>;
  testimonials: WithUpdatedAt<TestimonialsContent>;
  founders: WithUpdatedAt<FoundersContent>;
  contact: WithUpdatedAt<ContactContent>;
};

export type PricingContent = {
  intro: WithUpdatedAt<PricingIntroContent>;
  tiers: WithUpdatedAt<PricingTiersContent>;
  faq: WithUpdatedAt<PricingFaqContent>;
};

export async function getGlobals(): Promise<WithUpdatedAt<GlobalsContent>> {
  const map = await fetchSections(["globals"]);
  return pickSection(map, "globals", "globals", globalsSchema, defaultGlobals);
}

export async function getHomeContent(): Promise<HomeContent> {
  const map = await fetchSections(["home"]);
  return {
    hero: pickSection(map, "home", "hero", heroSchema, defaultHero),
    marquee: pickSection(map, "home", "marquee", marqueeSchema, defaultMarquee),
    whyGrid: pickSection(map, "home", "why_grid", whyGridSchema, defaultWhyGrid),
    howItWorks: pickSection(
      map,
      "home",
      "how_it_works",
      howItWorksSchema,
      defaultHowItWorks,
    ),
    testimonials: pickSection(
      map,
      "home",
      "testimonials",
      testimonialsSchema,
      defaultTestimonials,
    ),
    founders: pickSection(map, "home", "founders", foundersSchema, defaultFounders),
    contact: pickSection(map, "home", "contact", contactSchema, defaultContact),
  };
}

export async function getPricingContent(): Promise<PricingContent> {
  const map = await fetchSections(["pricing"]);
  return {
    intro: pickSection(map, "pricing", "intro", pricingIntroSchema, defaultPricingIntro),
    tiers: pickSection(map, "pricing", "tiers", pricingTiersSchema, defaultPricingTiers),
    faq: pickSection(map, "pricing", "faq", pricingFaqSchema, defaultPricingFaq),
  };
}

/**
 * Admin-side helper: load one section's raw content for editing.
 */
export async function getSectionForEdit<T>(
  pageSlug: string,
  sectionKey: string,
  schema: ZodType<T>,
  fallback: T,
): Promise<{ content: T; updatedAt: string | null }> {
  const map = await fetchSections([pageSlug]);
  return pickSection(map, pageSlug, sectionKey, schema, fallback);
}
