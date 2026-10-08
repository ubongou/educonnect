import {
  defaultFounders,
  defaultGlobals,
  defaultPricingFaq,
  defaultPricingTiers,
} from "@/lib/marketing/defaults";
import { countryPages, everyFamilyGets, examPrepPages, subjectOnlyPages } from "@/lib/marketing/seoPages";
import { EXAMS, EXAM_COUNTRIES, EXTRA_SUBJECTS } from "@/lib/marketing/exams";
import { MIT_FELLOWSHIP, ORG_DESCRIPTION, absoluteUrl } from "@/lib/seo";
import { GUIDE_PATH, PROMISE_PATH, promiseOneLiner, proofStats } from "@/lib/marketing/promise";
import { guides } from "@/lib/marketing/guides";

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
- Teachers: carefully vetted Nigerian teachers; only the top 3% of teachers who apply are accepted, and each child is matched to a teacher (parents do not browse profiles)
- Curricula: UK National Curriculum, US Common Core and state standards, Canadian provincial curricula, Nigerian curriculum, international programmes
- Recognition: ${MIT_FELLOWSHIP}
- In numbers: ${proofStats.map((s) => `${s.value} ${s.label}`).join("; ")}
- Guarantee: ${promiseOneLiner} Full terms: ${absoluteUrl(PROMISE_PATH)}
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

${subjectOnlyPages.map((s) => `- [${s.linkLabel}](${absoluteUrl(`/tutoring/${s.slug}`)}): ${s.description}`).join("\n")}

We also teach: ${EXTRA_SUBJECTS.map((e) => e.label).join(", ")}, and any other subject a family needs.

## Exams

- [All exams we prepare for](${absoluteUrl("/exams")}): every exam by country, with the subjects each one covers
${examPrepPages.map((s) => `- [${s.linkLabel}](${absoluteUrl(`/tutoring/${s.slug}`)}): ${s.description}`).join("\n")}
${EXAMS.filter((e) => !e.pageSlug)
  .map((e) => `- ${e.name} (${e.countries.map((c) => EXAM_COUNTRIES.find((x) => x.id === c)?.short ?? c).join(", ")}): ${e.summary}`)
  .join("\n")}

## Countries

${countryPages.map((c) => `- [${c.title}](${absoluteUrl(`/online-tutoring/${c.slug}`)}): ${c.description}`).join("\n")}

## Other pages

- [Pricing](${absoluteUrl("/pricing")}): packages in pounds, dollars, Canadian dollars and naira
- [Free personalised learning plan](${absoluteUrl("/strategy-session")}): book the free 15 minute session
- [About Masani](${absoluteUrl("/about")}): founders, teacher selection and MIT recognition
- [The Masani Promise](${absoluteUrl(PROMISE_PATH)}): 90 day money back guarantee, unused session refunds and free teacher changes
- [How to choose an online tutor](${absoluteUrl(GUIDE_PATH)}): a guide for Nigerian families abroad

## Guides for parents

${guides.map((g) => `- [${g.h1}](${absoluteUrl(`/guides/${g.slug}`)}): ${g.description}`).join("\n")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
