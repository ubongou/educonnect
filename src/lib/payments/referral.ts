import { defaultGlobals } from "@/lib/marketing/defaults";

/**
 * The referral offer shown to parents.
 *
 * Lives here rather than inline in the templates so the email and the on-screen
 * report can't drift apart — if the percentage changes, it changes in one
 * place. Same reasoning as lib/marketing/defaults.ts: static business content,
 * edited and deployed.
 *
 * Copy is deliberately light on mechanics. The actual terms are 50% off the
 * next 8 sessions per referred child who signs up, but spelling that out in a
 * lesson report turns a warm aside into terms and conditions — the detail is
 * settled in the conversation.
 */
export const REFERRAL_OFFER = {
  percent: 50,
  headline: "Get 50% off — refer a friend",
  body: "Know a parent whose child would love this? You'll get 50% off for every child you refer who signs up.",
  cta: "Refer on WhatsApp",
  /**
   * Shown under the button. The offer shouldn't feel like it only counts if you
   * use the button — a parent who just messages us later is referring too.
   */
  fallback: "Or message us any time and we'll sort it out.",
} as const;

/**
 * Prefilled WhatsApp message. Left as a fill-in-the-blanks template rather than
 * a complete sentence: the parent sends it with the details typed in, which
 * gives us something actionable instead of "hi, I have a friend".
 */
const REFERRAL_MESSAGE = [
  "Hi Masani! I'd like to refer a parent.",
  "",
  "Their name:",
  "Their phone or email:",
].join("\n");

/**
 * A wa.me deep link. Chosen over `mailto:` because it opens reliably on every
 * device — `mailto:` frequently does nothing at all in Gmail or Outlook on the
 * web — and because WhatsApp is where these parents actually talk to us.
 */
export function whatsappReferralUrl(message = REFERRAL_MESSAGE): string {
  return `https://wa.me/${defaultGlobals.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Human-readable form of the WhatsApp number, for plain-text email bodies. */
export function whatsappDisplayNumber(): string {
  const n = defaultGlobals.whatsappNumber;
  // 2349017246528 -> +234 901 724 6528
  return `+${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;
}

/**
 * Plain-text form of the whole offer. Deliberately the same sentences as the
 * HTML block — a text-only client should read the same offer, not a paraphrase.
 */
export function referralText(): string {
  return [
    `${REFERRAL_OFFER.headline}. ${REFERRAL_OFFER.body}`,
    `${REFERRAL_OFFER.cta}: ${whatsappReferralUrl()}`,
    `${REFERRAL_OFFER.fallback} ${whatsappDisplayNumber()}`,
  ].join("\n");
}

/**
 * Shown on every Nth lesson report rather than all of them.
 *
 * A child studying twice a week generates two reports a week; a referral ask on
 * each one stops reading as an offer and starts reading as nagging. Four means
 * roughly fortnightly, and — since it counts the child's reports — never on the
 * very first one, where the report should stand on its own.
 */
export const REFERRAL_EVERY_N_REPORTS = 4;

export function shouldShowReferral(reportNumber: number): boolean {
  return reportNumber > 0 && reportNumber % REFERRAL_EVERY_N_REPORTS === 0;
}
