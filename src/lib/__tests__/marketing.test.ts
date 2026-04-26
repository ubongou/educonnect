import { describe, expect, it } from "vitest";
import {
  defaultFinalCta,
  defaultFounders,
  defaultGlobals,
  defaultHero,
  defaultHowItWorks,
  defaultPricingInfoCards,
  defaultPricingIntro,
  defaultPricingTiers,
  defaultTestimonials,
  defaultWhyGrid,
} from "@/lib/marketing/defaults";
import {
  finalCtaSchema,
  foundersSchema,
  globalsSchema,
  heroSchema,
  howItWorksSchema,
  pricingInfoCardsSchema,
  pricingIntroSchema,
  pricingTiersSchema,
  sectionRegistry,
  testimonialsSchema,
  whyGridSchema,
} from "@/lib/marketing/schemas";
import { resolveAssetUrl } from "@/lib/marketing/assetUrl";

describe("marketing/schemas — defaults round-trip", () => {
  it.each([
    ["globals", globalsSchema, defaultGlobals],
    ["hero", heroSchema, defaultHero],
    ["why_grid", whyGridSchema, defaultWhyGrid],
    ["how_it_works", howItWorksSchema, defaultHowItWorks],
    ["testimonials", testimonialsSchema, defaultTestimonials],
    ["founders", foundersSchema, defaultFounders],
    ["final_cta", finalCtaSchema, defaultFinalCta],
    ["pricing_intro", pricingIntroSchema, defaultPricingIntro],
    ["pricing_tiers", pricingTiersSchema, defaultPricingTiers],
    ["pricing_info_cards", pricingInfoCardsSchema, defaultPricingInfoCards],
  ] as const)("%s default parses cleanly", (_, schema, defaults) => {
    const parsed = schema.safeParse(defaults);
    expect(parsed.success).toBe(true);
  });
});

describe("marketing/schemas — rejection cases", () => {
  it("rejects empty hero heading", () => {
    const result = heroSchema.safeParse({ ...defaultHero, heading: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an extra why-grid card", () => {
    const result = whyGridSchema.safeParse({
      ...defaultWhyGrid,
      cards: [...defaultWhyGrid.cards, defaultWhyGrid.cards[0]],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing how-it-works step", () => {
    const result = howItWorksSchema.safeParse({
      ...defaultHowItWorks,
      steps: defaultHowItWorks.steps.slice(0, 3),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL booking URL", () => {
    const result = globalsSchema.safeParse({
      ...defaultGlobals,
      bookingUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative tier price", () => {
    const tiers = structuredClone(defaultPricingTiers);
    tiers.tiers[0].prices.NGN.total = -1;
    const result = pricingTiersSchema.safeParse(tiers);
    expect(result.success).toBe(false);
  });

  it("rejects a missing currency from a tier", () => {
    const tiers = structuredClone(defaultPricingTiers) as {
      tiers: Array<{
        prices: Record<string, unknown>;
      }>;
    };
    delete tiers.tiers[0].prices.USD;
    const result = pricingTiersSchema.safeParse(tiers);
    expect(result.success).toBe(false);
  });
});

describe("marketing/schemas — section registry", () => {
  it("has every section pinned to a (pageSlug, sectionKey)", () => {
    const ids = Object.keys(sectionRegistry);
    expect(ids).toContain("hero");
    expect(ids).toContain("globals");
    expect(ids).toContain("pricing_tiers");
    expect(ids.length).toBe(10);
  });

  it("uses unique (pageSlug, sectionKey) tuples", () => {
    const tuples = Object.values(sectionRegistry).map(
      (s) => `${s.pageSlug}/${s.sectionKey}`,
    );
    expect(new Set(tuples).size).toBe(tuples.length);
  });
});

describe("marketing/assetUrl", () => {
  const ENV = process.env.NEXT_PUBLIC_SUPABASE_URL;

  it("returns the bundled fallback when storage path is empty", () => {
    expect(resolveAssetUrl("", "/home/hero.png")).toBe("/home/hero.png");
    expect(resolveAssetUrl("   ", "/home/hero.png")).toBe("/home/hero.png");
  });

  it("returns the fallback when SUPABASE_URL is unset", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(resolveAssetUrl("hero/hero.png", "/home/hero.png")).toBe(
      "/home/hero.png",
    );
    if (ENV) process.env.NEXT_PUBLIC_SUPABASE_URL = ENV;
  });

  it("builds a public storage URL when SUPABASE_URL is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const url = resolveAssetUrl("hero/hero.png", "/home/hero.png");
    expect(url).toBe(
      "https://example.supabase.co/storage/v1/object/public/marketing-assets/hero/hero.png",
    );
    if (ENV) process.env.NEXT_PUBLIC_SUPABASE_URL = ENV;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  });

  it("appends a cachebuster when updatedAt is supplied", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const url = resolveAssetUrl(
      "hero/hero.png",
      "/home/hero.png",
      "2026-04-26T12:00:00.000Z",
    );
    expect(url).toContain("?v=");
    expect(url).toContain(encodeURIComponent("2026-04-26T12:00:00.000Z"));
    if (ENV) process.env.NEXT_PUBLIC_SUPABASE_URL = ENV;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  });

  it("strips a leading slash on the storage path", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const url = resolveAssetUrl("/hero/hero.png", "/home/hero.png");
    expect(url).toBe(
      "https://example.supabase.co/storage/v1/object/public/marketing-assets/hero/hero.png",
    );
    if (ENV) process.env.NEXT_PUBLIC_SUPABASE_URL = ENV;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  });
});
