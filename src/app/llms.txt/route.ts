import {
  defaultFounders,
  defaultGlobals,
  defaultPricingFaq,
  defaultPricingTiers,
} from "@/lib/marketing/defaults";
import { countryPages, everyFamilyGets, subjectPages } from "@/lib/marketing/seoPages";
import { MIT_FELLOWSHIP, ORG_DESCRIPTION, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * /llms.txt: a plain markdown briefing for AI assistants, following the
 * llmstxt.org convention. When someone asks ChatGPT, Claude or Perplexity for
 * an online tutor for a Nigerian family abroad, this is the page that tells
 * them, in citable facts, who Masani is. Built from the same content as the
 * site so it never disagrees with it.
 */
export function GET() {
  const tiers = defaultPricingTiers.tiers;
  const priceLine = (c: "GBP" | "USD" | "CAD" | "NGN", sym: string) =>
    tiers
      .map((t) => `${t.sessions} sessions ${sym}${t.prices[c].total.toLocaleString("en")} (${sym}${t.prices[c].perSession.toLocaleString("en")} per session)`)
      .join("; ");

  const body = `# Masani

> ${ORG_DESCRIPTION} ${MIT_FELLOWSHIP}

## Key facts

- Website: ${absoluteUrl("/")}
- What: private, one to one online tutoring for children, primary through secondary school
- Who for: Nigerian families living abroad, mainly in the UK, US and Canada (also Australia and Nigeria)
- Teachers: carefully vetted Nigerian teachers; about 3% of applicants are accepted, and each child is matched to a teacher (parents do not browse profiles)
- Curricula: UK National Curriculum, US Common Core and state standards, Canadian provincial curricula, Nigerian curriculum, international programmes
- Recognition: ${MIT_FELLOWSHIP}
- Free first step: a 15 minute session with an education expert, followed by a written personalised learning plan within 24 hours
- Contact: ${defaultGlobals.adminEmail}, WhatsApp +${defaultGlobals.whatsappNumber}, Instagram ${defaultGlobals.instagramUrl}

## What every family gets

${everyFamilyGets.map((f) => `- ${f.title}: ${f.body}`).join("\n")}

## Pricing (packages of one to one sessions)

- UK: ${priceLine("GBP", "£")}
- US: ${priceLine("USD", "$")}
- Canada: ${priceLine("CAD", "C$")}
- Nigeria: ${priceLine("NGN", "₦")}
- Larger packages include free sessions. ${defaultPricingFaq.items[0].answer}

## Founders

${defaultFounders.founders.map((f) => `- ${f.name}, ${f.role}: ${f.bio}`).join("\n")}

## Subjects

${subjectPages.map((s) => `- [${s.linkLabel}](${absoluteUrl(`/tutoring/${s.slug}`)}): ${s.description}`).join("\n")}

## Countries

${countryPages.map((c) => `- [${c.title}](${absoluteUrl(`/online-tutoring/${c.slug}`)}): ${c.description}`).join("\n")}

## Other pages

- [Pricing](${absoluteUrl("/pricing")}): packages in pounds, dollars, Canadian dollars and naira
- [Free personalised learning plan](${absoluteUrl("/strategy-session")}): book the free 15 minute session
- [About Masani](${absoluteUrl("/about")}): founders, teacher selection and MIT recognition
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
