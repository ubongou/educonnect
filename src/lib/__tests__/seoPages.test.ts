import { describe, expect, it } from "vitest";
import { defaultPricingTiers } from "@/lib/marketing/defaults";
import { countryPages, subjectPages } from "@/lib/marketing/seoPages";

const symbol = { GBP: "£", USD: "$", CAD: "C$" } as const;
const fmt = (n: number) =>
  n.toLocaleString("en", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

describe("country page copy", () => {
  // Prices are written into prose (descriptions, FAQs) for search snippets and
  // AI answers. If the pricing table changes, these must change with it.
  for (const page of countryPages) {
    it(`quotes current ${page.currency} prices on /online-tutoring/${page.slug}`, () => {
      const sym = symbol[page.currency];
      const prices = defaultPricingTiers.tiers.map((t) => t.prices[page.currency]);
      const min = Math.min(...prices.map((p) => p.perSession));
      const text = [page.description, ...page.why, ...page.faqs.map((f) => f.answer)].join(" ");

      expect(page.description).toContain(`${sym}${fmt(min)} a session`);
      for (const p of prices) {
        expect(text).toContain(`${sym}${fmt(p.perSession)}`);
      }
      expect(text).toContain(`${sym}${fmt(prices[0].total)} for 8`);
    });
  }
});

describe("landing page copy", () => {
  const all = [...subjectPages, ...countryPages];

  it("has unique slugs, titles and descriptions", () => {
    for (const key of ["slug", "title", "description"] as const) {
      const values = all.map((p) => `${"country" in p ? "c" : "s"}:${p[key]}`);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("keeps meta descriptions within search snippet length", () => {
    for (const p of all) {
      expect(p.description.length, p.slug).toBeLessThanOrEqual(170);
      expect(p.title.length, p.slug).toBeLessThanOrEqual(62);
    }
  });

  it("uses no dashes in customer facing copy", () => {
    // RegExp fields serialise to {}, so they drop out on their own.
    const text = JSON.stringify(all);
    expect(text).not.toMatch(/[—–]/);
    expect(text).not.toMatch(/ - /);
  });
});
