import type { LegalSection } from "@/components/marketing/LegalPage";
import { defaultGlobals } from "./defaults";
import {
  FIX_DAYS,
  GUARANTEE_DAYS,
  PROMISE_PATH,
  REFUND_DAYS,
} from "./promise";

/**
 * Copy for the Terms of Service, Privacy notice and Safeguarding pages.
 *
 * Any value still starting with "TODO_" is a fact only the business can
 * supply. A unit test (legal.test.ts) fails while any TODO remains, so these
 * pages can never ship with a placeholder.
 *
 * House style: no dashes in customer-facing copy.
 */

export const COMPANY = {
  legalName: "Masani Tutors Ltd",
  country: "Nigeria",
  email: defaultGlobals.adminEmail,
  whatsapp: "+234 901 724 6528",
};

export const LEGAL_UPDATED = "1 October 2026";

const who = `${COMPANY.legalName} ("Masani", "we", "us") is a company registered in ${COMPANY.country}. You can contact us at ${COMPANY.email} or on WhatsApp at ${COMPANY.whatsapp}.`;

// -----------------------------------------------------------------------------
// Terms of Service
// -----------------------------------------------------------------------------

export const termsIntro =
  "These terms are the agreement between you and Masani when you buy tutoring for your child. We have kept them short and plain. Please read them with our Promise, Privacy notice and Safeguarding policy, which form part of them.";

export const termsSections: LegalSection[] = [
  { heading: "1. Who we are", paragraphs: [who] },
  {
    heading: "2. What we provide",
    paragraphs: [
      "Private, one to one online lessons for children from primary through secondary school, taught by teachers we select and match to your child. Each package includes a written report after every lesson, access to the parent portal, and recorded lessons where you have given consent.",
      "Tutoring supports your child's learning. We do not guarantee particular grades, exam results or school places.",
    ],
  },
  {
    heading: "3. Packages and payment",
    paragraphs: [
      "Lessons are sold in packages of 8, 24 or 48 sessions at the prices shown on our pricing page when you buy. Packages are paid in advance, in the currency shown on your invoice, by the payment method on that invoice. Lessons are scheduled once payment is received.",
      "Any discount, such as a sibling or promotional discount, is shown on your invoice and applies only as stated there.",
    ],
  },
  {
    heading: "4. Scheduling, missed lessons and changes",
    bullets: [
      "Lessons are scheduled in your own time zone at times agreed with you.",
      "To move or cancel a single lesson, tell us at least 48 hours before it starts. Lessons missed without 48 hours' notice count as taken.",
      "If your teacher has to cancel, we rearrange the lesson at no cost to you.",
      "You can change your teacher at any time. It is free, and no questions are asked.",
    ],
  },
  {
    heading: "5. Pausing, cancelling and refunds",
    paragraphs: [
      `You can pause or cancel your package at any time with 48 hours' notice. When you cancel, we refund every session you have paid for and not used, at the price you paid per session, within ${REFUND_DAYS} days, to the original payment method.`,
      `In your child's first ${GUARANTEE_DAYS} days you are also covered by the Masani Promise: if you raise a concern and we cannot put it right within ${FIX_DAYS} days, you choose a full refund or free lessons. The full terms of the Promise are on our promise page (joinmasani.com${PROMISE_PATH}).`,
    ],
  },
  {
    heading: "6. Your legal right to cancel",
    paragraphs: [
      "If you live in the UK, you have a legal right to cancel within 14 days of buying a package. If you ask us to start lessons within those 14 days, you agree that lessons taken before you cancel are paid for, and we refund the rest. Similar rights may apply where you live. Nothing in these terms takes away rights you have under the consumer law of your country.",
    ],
  },
  {
    heading: "7. What we ask of families",
    bullets: [
      "A device with a camera, microphone and a stable internet connection, and a quiet place for lessons.",
      "Respectful behaviour towards teachers and staff. We may end lessons, with a refund for unused sessions, if a teacher is treated abusively.",
    ],
  },
  {
    heading: "8. Lesson recordings and your child's information",
    paragraphs: [
      "We record lessons only with a parent's consent, and you can withdraw consent at any time. How we collect, use and protect your family's information, including recordings, is set out in our Privacy notice.",
    ],
  },
  {
    heading: "9. Our responsibility to you",
    paragraphs: [
      "We provide lessons with reasonable care and skill. If something goes wrong, our total responsibility to you is limited to the amount you paid for the package concerned. Nothing in these terms limits responsibility that cannot be limited by law.",
    ],
  },
  {
    heading: "10. Changes to these terms",
    paragraphs: [
      "We may update these terms. The version that applies to a package is the one on this page on the day you paid for it. If we make a change that affects you, we will tell you before it applies.",
    ],
  },
  {
    heading: "11. Law and complaints",
    paragraphs: [
      `These terms are governed by the laws of ${COMPANY.country}. If you live elsewhere, you also keep the protection of the mandatory consumer laws of your country. If you have a complaint, email ${COMPANY.email} and we will reply the same day.`,
    ],
  },
];

// -----------------------------------------------------------------------------
// Privacy notice
// -----------------------------------------------------------------------------

export const RECORDING_RETENTION = "3 months";

export const privacyIntro =
  "This notice explains what information Masani collects about you and your child, how we use it, and the choices you have.";

export const privacySections: LegalSection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      `${who} We are responsible for the information described here. We follow the Nigeria Data Protection Act 2023 and, for families in the UK, the UK GDPR.`,
    ],
  },
  {
    heading: "Information we collect",
    bullets: [
      "About you: your name, email address, phone or WhatsApp number, country and payment records.",
      "About your child: first name, age or school year, subjects, learning goals and anything you choose to tell us about how they learn.",
      "From lessons: lesson reports written by teachers, progress records in the parent portal, and lesson recordings where you have given consent.",
      "From the website: standard analytics such as pages viewed, referring links and campaign tags.",
    ],
  },
  {
    heading: "Your child's information and lesson recordings",
    paragraphs: [
      "We only collect what we need to teach your child well. A parent or guardian provides it and stays in control of it.",
      `We record lessons only with a parent's consent. Recordings are shared with you through the parent portal and can be viewed by your child's teacher and by Masani staff for quality and safeguarding. We do not use recordings for advertising, and we never share them publicly. We keep recordings for ${RECORDING_RETENTION}. You can withdraw consent or ask us to delete recordings at any time by emailing ${COMPANY.email}.`,
    ],
  },
  {
    heading: "How we use it",
    bullets: [
      "To arrange and deliver lessons, write reports and track your child's progress.",
      "To contact you about your child's lessons, payments and our services.",
      "To improve our website and advertising, using Google Analytics and the Meta Pixel, which may set cookies in your browser.",
    ],
  },
  {
    heading: "Sharing",
    paragraphs: [
      "We do not sell your information. We share it only with the service providers who help us run Masani, such as hosting, storage, email, scheduling, analytics and advertising partners, and where the law requires it. Some of these providers store information outside Nigeria and the UK; we use providers with appropriate safeguards.",
    ],
  },
  {
    heading: "Your choices and rights",
    paragraphs: [
      "You can ask us to access, correct or delete the information we hold about you or your child, withdraw consent for recordings, or stop marketing emails at any time. You can also control cookies through your browser settings. If you are unhappy with how we handle your information, you can complain to the Nigeria Data Protection Commission or, in the UK, the Information Commissioner's Office.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [`Questions about your privacy? Email us at ${COMPANY.email}.`],
  },
];

// -----------------------------------------------------------------------------
// Safeguarding
// -----------------------------------------------------------------------------

export const SAFEGUARDING = {
  teacherChecks:
    "references from two past employers, two interviews and a mock teaching session",
  platform: "Google Meet",
};

export const safeguardingIntro =
  "Every Masani lesson is one to one, online, with a child. Keeping children safe comes before everything else we do. This page sets out how.";

export const safeguardingSections: LegalSection[] = [
  {
    heading: "How we choose teachers",
    paragraphs: [
      `Only the top 3% of teachers who apply are accepted. Before a teacher meets any child, we take up ${SAFEGUARDING.teacherChecks}.`,
    ],
  },
  {
    heading: "How lessons are run",
    bullets: [
      `Lessons take place on ${SAFEGUARDING.platform}, using links issued by Masani.`,
      "Everything about lessons, from scheduling to feedback, is arranged with the parent.",
      "Parents receive a written report after every lesson, so you always know what happened.",
    ],
  },
  {
    heading: "Recordings",
    paragraphs: [
      `With a parent's consent, lessons are recorded. Recordings let you see exactly how your child is taught and help us check quality and safety. Only you, your child's teacher and Masani staff can view them, and we keep them for ${RECORDING_RETENTION}.`,
    ],
  },
  {
    heading: "Raising a concern",
    paragraphs: [
      `If you are worried about anything that happens in or around a lesson, tell us straight away at ${COMPANY.email} or on WhatsApp at ${COMPANY.whatsapp}. We reply the same day, take every concern seriously, and keep you informed. Where a child may be at risk, we will contact the relevant authorities.`,
      "You can also change your child's teacher at any time, free, no questions asked.",
    ],
  },
];
