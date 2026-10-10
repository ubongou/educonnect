/**
 * The Masani Promise: money back guarantee, unused session refunds and free
 * teacher changes. Single source of truth for every page that mentions it
 * (homepage, /our-promise, pricing FAQ, landing pages, llms.txt) so the terms
 * can never disagree with each other.
 *
 * Legal notes (keep these in mind when editing):
 * - US FTC Guides (16 CFR 239.3): a "money back guarantee" must refund the
 *   full purchase price at the customer's request, and any material
 *   conditions must be disclosed clearly near the claim. That is why every
 *   short mention links to /our-promise and the homepage box lists the
 *   "tell us first, 14 days to fix it" condition next to the headline.
 * - UK Consumer Contracts Regulations 2013 and Ontario rules: refunds within
 *   14 days. Keep REFUND_DAYS at 14 or lower.
 * - The promise is in addition to statutory rights, never instead of them.
 *
 * House style: no dashes in customer-facing copy.
 */

import { defaultPricingTiers } from "./defaults";

const minPerSession = (c: "GBP" | "USD" | "CAD") =>
  Math.min(...defaultPricingTiers.tiers.map((t) => t.prices[c].perSession)).toFixed(2);

/** "£9.63 / $13.13 / C$18.38", always in step with the pricing table. */
export const FROM_PRICES = `£${minPerSession("GBP")} / $${minPerSession("USD")} / C$${minPerSession("CAD")}`;

/**
 * Proof points shown under the hero and in llms.txt. Source: the admin portal.
 * Lessons per week = about 50, confirmed by Ubong on 10 Oct 2026 (up from
 * about 30 a week, mid August to end of September). Countries = where active families live. The satisfaction
 * figure was supplied by Masani; keep the survey or ratings it is based on.
 * Update these when the numbers move.
 */
export const proofStats = [
  // "50+": reports filed undercount lessons taught, so 50 is a floor.
  { value: "50+", label: "one to one lessons taught every week" },
  // US, Canada, Trinidad and Tobago, UK, Nigeria: North America, Europe, Africa.
  { value: "5", label: "countries, across 3 continents" },
  // Confirmed by Ubong on 3 Oct 2026 as backed by Masani's own parent
  // feedback. Keep that evidence on file; it's a published claim.
  { value: "98%", label: "parent satisfaction" },
  { value: "Top 3%", label: "of teachers who apply are accepted" },
];

export const PROMISE_PATH = "/our-promise";
export const GUIDE_PATH = "/guides/online-tutoring-for-nigerian-families-abroad";

export const GUARANTEE_DAYS = 90;
export const FIX_DAYS = 14;
export const PLAN_WORKING_DAYS = 2;
export const FREE_LESSON_DAYS = 30;
export const REFUND_DAYS = 14;

export const TEACHER_CHANGE = "Change your teacher at any time. Free, no questions asked.";

export const promiseSummary = [
  `Tell us if something is not right. We fix it within ${FIX_DAYS} days.`,
  `Still not happy? Choose a full refund, or up to ${FREE_LESSON_DAYS} days of free lessons while we get it right.`,
  "Unused sessions are always refunded, at any time.",
  TEACHER_CHANGE,
];

export const promisePillars = [
  {
    title: `Money back in your first ${GUARANTEE_DAYS} days`,
    body: `If we cannot put things right, you choose a full refund or up to ${FREE_LESSON_DAYS} days of free lessons.`,
  },
  {
    title: "Change your teacher any time",
    body: "Free, no questions asked. Just tell us.",
  },
  {
    title: "Unused sessions refunded",
    body: "Stop whenever you like and get back what you have not used.",
  },
];

export const promiseSteps = [
  {
    title: "Tell us what is not working",
    body: `Any time in your first ${GUARANTEE_DAYS} days, tell us however suits you: WhatsApp, email, a call, or your parent portal. We will confirm in writing that we have logged it.`,
  },
  {
    title: `We put it right within ${FIX_DAYS} days`,
    body: `Within ${PLAN_WORKING_DAYS} working days we agree a plan with you. That could be a new teacher, a new learning plan, or both. We then have ${FIX_DAYS} days to show you the difference.`,
  },
  {
    title: "Still not happy? You choose",
    body: "",
  },
];

export const promiseChoices = [
  {
    title: "A full refund",
    body: `Everything you paid us in your first ${GUARANTEE_DAYS} days, back to the card or account you paid from.`,
  },
  {
    title: "Free lessons",
    body: `We keep teaching your child at your usual schedule, free, for up to ${FREE_LESSON_DAYS} more days while we get it right.`,
  },
];

export const unusedSessionsText =
  "This is not limited to 90 days. If you stop, with 48 hours' notice, we refund every session you have paid for and not used, at the price you paid per session.";

export const fairPrint = [
  {
    title: "Raise it first.",
    body: `The money back guarantee applies when you have told us about the problem during your first ${GUARANTEE_DAYS} days and given us the ${FIX_DAYS} days to fix it. A refund request with no earlier concern is treated as a normal cancellation, and unused sessions are refunded.`,
  },
  {
    title: `Your first ${GUARANTEE_DAYS} days.`,
    body: `The ${GUARANTEE_DAYS} days start on the date of your child's first paid lesson. You make your choice within 30 days of the end of the ${FIX_DAYS} day fix period.`,
  },
  {
    title: "Lessons attended.",
    body: "Lessons missed without 48 hours' notice count as taken.",
  },
  {
    title: "Once per child.",
    body: `The guarantee covers each child's first ${GUARANTEE_DAYS} days with Masani, once.`,
  },
  {
    title: "One choice.",
    body: "If you choose free lessons, the refund option ends when they begin. If you choose a refund, your child's lessons end when it is paid.",
  },
  {
    title: "How you are paid.",
    body: `Refunds go back to the original payment method, in the currency you paid, within ${REFUND_DAYS} days. We cannot cover bank charges or exchange rate changes.`,
  },
  {
    title: "Your rights.",
    body: "This promise is in addition to your legal rights as a consumer, including any right to cancel, and does not replace them.",
  },
];

/** One line for llms.txt and other plain text summaries. */
export const promiseOneLiner = `Masani Promise: in the first ${GUARANTEE_DAYS} days, if a concern raised with Masani is not put right within ${FIX_DAYS} days, the family chooses a full refund or up to ${FREE_LESSON_DAYS} days of free lessons. Unused sessions are refunded at any time with 48 hours' notice. Teacher changes are free at any time, no questions asked.`;

/** Homepage FAQ. Plain text answers so they double as FAQPage JSON-LD. */
export const homeFaqs = [
  {
    question: "Who are Masani's teachers?",
    answer: "Carefully vetted Nigerian teachers. Only the top 3% of teachers who apply are accepted.",
  },
  {
    question: "Which curricula do you follow?",
    answer:
      "The UK, US, Canadian, Nigerian and international curricula, for children from primary through secondary school.",
  },
  {
    question: "Which countries do you teach families in?",
    answer:
      "Mainly the UK, the US and Canada, and also Australia and Nigeria. Lessons are online and scheduled in your own time zone.",
  },
  {
    question: "How much does Masani cost?",
    answer:
      `Packages of 8, 24 or 48 sessions, from ${FROM_PRICES} per session. Full prices are on our pricing page.`,
  },
  {
    question: "What if we are not happy?",
    answer: `Tell us. You can change your teacher at any time, free, no questions asked. In your first ${GUARANTEE_DAYS} days you are also covered by the Masani Promise: if we cannot put things right within ${FIX_DAYS} days, you choose a full refund or up to ${FREE_LESSON_DAYS} days of free lessons. Unused sessions are always refunded.`,
  },
  {
    question: "Do you prepare children for the 11+ and SAT or ACT?",
    answer:
      "Yes. We teach Maths, English, Science, 11+ preparation, SAT and ACT prep, Reading and creative writing, and Public speaking.",
  },
  {
    question: "How do we start?",
    answer:
      "Book a free 15 minute call with an education expert. You will get a written personalised learning plan within 24 hours.",
  },
];
