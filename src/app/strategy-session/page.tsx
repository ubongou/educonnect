import type { Metadata } from "next";
import "../../styles/strategy-session.css";
import { ClarityScript } from "@/components/ClarityScript";
import { MarketingScrollReveal } from "@/components/marketing/MarketingScrollReveal";
import { bundledAssets } from "@/lib/marketing/defaults";
import { StrategyBookingProvider } from "./StrategyBooking";
import { StrategyCTA } from "./StrategyCTA";
import { StrategyFAQ, type FaqItem } from "./StrategyFAQ";
import { ScrollDepthTracker } from "./ScrollDepthTracker";
import { StickyMobileCTA } from "./StickyMobileCTA";

// Warm, on-audience hero: a student engaged in online learning at home.
// Kept local to this page so it never affects the main-site hero.
const HERO_IMAGE = "/brand-v2/strategy-hero.jpg";

// -----------------------------------------------------------------------------
// A/B TEST: swap this single value to change the hero headline. The three
// approved variants live in HERO_HEADLINES below.
// -----------------------------------------------------------------------------
const HERO_HEADLINE_VARIANT: "A" | "B" | "C" = "A";

const HERO_HEADLINES: Record<"A" | "B" | "C", string> = {
  A: "Your child deserves a personalised learning plan to help them reach their full potential.",
  B: "A free learning plan for your child, built around how they actually learn.",
  C: "Give us 15 minutes about your child. We will write the plan that fits them.",
};

export const metadata: Metadata = {
  title: "Your Child's Free Personalised Learning Plan | Masani",
  description:
    "Give us 15 minutes and we'll help you uncover how your child learns best, then hand you a personalised plan to build confidence and improve results",
};

// ---- Copy (kept dash-free per brand rules) ----------------------------------

// The offer is split in two: the strategy session is the mechanism, the written
// plan is the product. Collapsing them into one list hides the only thing the
// parent keeps, and turns distinct deliverables into synonyms for "advice".
const sessionPoints = [
  "Where your child is now, what is working and what is not",
  "Straight answers on their subjects, their exams, and what is realistic",
  "Fifteen minutes with one of our experts",
];

const planPoints = [
  "Your child's strengths, and the gaps worth closing first",
  "What to do about each one, subject by subject",
  "What you can do at home, and what needs a teacher",
  "Written after the session and sent within 24 hours",
];

// "Does this sound like your child?" — the parent recognises their own
// situation here. Broad on purpose: struggling, coasting and high-achieving
// children all have a line they fit.
const problemPoints = [
  "Finding schoolwork harder than it should be?",
  "Working hard without the results to show for it?",
  "Losing confidence in a subject?",
  "Doing well, but capable of more?",
  "Facing exams or a change of school?",
  "Bright and curious, but not consistent?",
  "Ready to work more independently?",
];

// The four steps live inside the offer section. They used to be a separate
// "what happens next" block, which meant the page explained the same sequence
// three times over.
const steps = [
  {
    title: "Book your session",
    body: "Pick a time that suits you. Every slot shows in your own timezone.",
  },
  {
    title: "Speak to an expert",
    body: "Fifteen minutes about your child.",
  },
  {
    title: "Get the personalised plan",
    body: "Written after the session, sent within 24 hours by WhatsApp or email.",
  },
  {
    title: "Decide",
    body: "If Masani fits your child, we say how. If not, we say that too.",
  },
];

// The comparison carries the whole "why us" argument now. The three pillar
// cards that used to sit above it said the same things in more words, so their
// content was folded into the right-hand column and the cards removed.
const traditionalPoints = [
  "The same teaching style for every child",
  "Focused on finishing tonight's homework",
  "Help arrives after the problem shows up",
  "You hear how it went only if you ask",
  "No record of what was covered",
  "Reach them during lesson hours, if at all",
];

// Ordered by what matters most to a parent choosing: the plan first, the
// credential last.
const masaniPoints = [
  "A personalised learning plan for your child",
  "A teacher chosen from the top 3% of applicants",
  "Built for Nigerian families abroad",
  "Focus on confidence and long term growth",
  "A written report after every lesson",
  "Every class recorded, so your child can rewatch it",
  "Progress tracked skill by skill in our online parent portal",
  "Support 24 hours a day, 7 days a week",
  "Backed by MIT",
];

const faqItems: FaqItem[] = [
  {
    question: "Is the plan really free?",
    answer:
      "Yes. No hidden fees, nothing to buy. We write and send the plan whatever you decide afterwards, and tutoring is never compulsory. If we think Masani can help, we explain how. If not, we point you to what we believe is better for your child.",
  },
  {
    question: "How and when do I get the plan?",
    answer:
      "Within 24 hours of the session, on whichever channel you told us you prefer: WhatsApp, email or text. You keep it. Nothing to log into, nothing that expires.",
  },
  {
    question: "Does my child need to be on the call?",
    answer:
      "No. This session is for you as the parent. Fifteen minutes on your own is usually more useful because you can speak freely about what worries you. You are welcome to have your child there, but it is not needed.",
  },
  {
    question: "Who will I be speaking to?",
    answer:
      "One of our education experts, usually Grace or Unyime. They are also the people who write your child's plan, so nothing you say gets handed off or lost along the way.",
  },
  {
    question: "What ages and curricula do you cover?",
    answer:
      "Primary through secondary school, across the UK, Nigerian, American and international curricula. Every lesson is one to one and fully online, so your child learns from home wherever your family is.",
  },
  {
    question: "Can you work around our time zone?",
    answer:
      "Yes. When you pick a slot, every time appears in your own local time automatically, so there is nothing to convert and nothing to get wrong. We hold sessions across UK, US, Canada and Australia hours.",
  },
  {
    question: "Can I reschedule if something comes up?",
    answer:
      "Yes. Your confirmation email has a link to reschedule or cancel in one click. You can also reply to it or message us on WhatsApp and we will sort it out.",
  },
];

const testimonials = [
  {
    body: "The tutors have been outstanding, patient, professional, and deeply committed. I would wholeheartedly recommend Masani to any parent looking to see tangible improvement in their children's learning journey.",
    author: "Mr. Ugbehe",
    where: "Scotland, UK",
    initial: "U",
  },
  {
    body: "Since I started using this service, my child's performance has improved. The lesson teacher is good at what she does, and I have recommended their services to other parents and will continue to do so.",
    author: "Mrs. Frilster",
    where: "United Kingdom",
    initial: "F",
  },
  {
    body: "Our daughter gets excited to connect with her Masani tutor. Her attitude toward learning mathematics has changed completely. Her self-confidence has increased and she is eager to learn new concepts.",
    author: "Mrs. Joanne",
    where: "United States",
    initial: "J",
  },
  {
    // Real review from a parent, kept anonymous at her request.
    body: "My daughter is very happy with her tutor. She looks forward to every English class, and I am really pleased with the quality of what she is getting. I am confident she will keep improving.",
    author: "Mrs. Keisha",
    where: "United Kingdom",
    initial: "K",
  },
];

// FAQ structured data for SEO / answer engines.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

// ---- Small inline icons -----------------------------------------------------

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// -----------------------------------------------------------------------------

export default function StrategySessionPage() {
  const heading = HERO_HEADLINES[HERO_HEADLINE_VARIANT];

  return (
    <div className="mkt-root">
      <ClarityScript />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Every CTA on the page opens the shared booking form in this provider's
          modal, then sends the visitor to /booked to pick a time. */}
      <StrategyBookingProvider>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Minimal header — no nav links, keeps the visitor on the page. */}
        <header className="ss-header" role="banner">
          <div className="container ss-header-inner">
            <span className="ss-brand-pill" aria-label="Masani">
              {/* Non-clickable logo: no exit paths away from booking. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-blue-bg.png" alt="Masani" />
            </span>
          </div>
        </header>

        <main id="main-content">
          {/* ---------- 1. HERO ---------- */}
          <section className="hero ss-hero" id="top">
            <div className="container hero-grid">
              <div className="hero-copy">
                <h1 className="reveal delay-1">{heading}</h1>
                <p className="lead reveal delay-2">
                  Whether they&apos;re struggling, keeping up, or already
                  excelling, every child learns differently. Give us just 15
                  minutes, and we&apos;ll help you uncover how your child learns
                  best. Completely free.
                </p>
                <div className="hero-ctas reveal delay-3">
                  <StrategyCTA source="ss-hero" />
                </div>
                <div className="hero-microcopy reveal delay-3">
                  <span className="dot" aria-hidden="true" /> No obligation. Free
                  expert guidance built around your child.
                </div>
                <div className="ss-trustbar reveal delay-3">
                  <span className="ss-trust-item">
                    <CheckIcon /> Backed by MIT
                  </span>
                  <span className="ss-trust-sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="ss-trust-item">
                    <CheckIcon /> Top 3% of teachers accepted
                  </span>
                  <span className="ss-trust-sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="ss-trust-item">
                    <CheckIcon /> Families in the UK, US, Canada and Australia
                  </span>
                </div>
              </div>

              <div className="hero-visual reveal delay-2">
                <div className="mit-banner">
                  <div className="mit-pill">
                    <span className="backed">Backed by</span>
                    <span className="sep" aria-hidden="true" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bundledAssets.mitBadge}
                      alt="Backed by MIT"
                      width={120}
                      height={46}
                    />
                  </div>
                </div>
                <div className="hero-photo-shell">
                  <div className="hero-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={HERO_IMAGE}
                      alt="A young student concentrating on an online lesson at home, writing beside her laptop"
                      width={573}
                      height={860}
                      loading="eager"
                    />
                  </div>
                  <div className="hero-card c1" aria-hidden="true">
                    <div className="tick-icon">★</div>
                    <div className="label">
                      <strong>Vetted teachers</strong>
                      Top 3% of applicants
                    </div>
                  </div>
                  <div className="hero-card c2" aria-hidden="true">
                    <div className="avatar-stack">
                      <span className="a1">A</span>
                      <span className="a2">M</span>
                      <span className="a3">J</span>
                      <span className="a4">+</span>
                    </div>
                    <div className="label">
                      <strong>Trusted worldwide</strong>
                      UK · US · Canada · Australia
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- 2. PROOF BAND ----------
              Reads as a timeline: what you notice first, what the school
              notices next, how long families end up staying. */}
          <section className="ss-proof" aria-label="Results families see">
            <div className="container ss-proof-grid">
              <div className="ss-proof-item reveal">
                <div className="ss-proof-num">3 years</div>
                <div className="ss-proof-label">
                  How long families stay with us
                </div>
              </div>
              <div className="ss-proof-item reveal">
                <div className="ss-proof-num">Month one</div>
                <div className="ss-proof-label">
                  When you start to notice the difference
                </div>
              </div>
              <div className="ss-proof-item reveal">
                <div className="ss-proof-num">3 months</div>
                <div className="ss-proof-label">
                  Parents report better grades and more confidence
                </div>
              </div>
            </div>
          </section>

          {/* ---------- 3. WHAT YOU GET ----------
              Merged from three former sections: "what you'll discover", "what
              the session is", and "what happens next". */}
          <section className="ss-section">
            <div className="container">
              <div className="ss-head reveal">
                <h2>What you get</h2>
                <p>
                  A 15 minute strategy session, then your child&apos;s
                  personalised plan in writing.
                </p>
              </div>

              <div className="ss-offer-split">
                <div className="ss-offer-col reveal">
                  <h3>The session</h3>
                  <ul>
                    {sessionPoints.map((point, i) => (
                      <li key={i}>
                        <span className="ss-check-ico">
                          <CheckIcon />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* The plan is the product, so it gets the visual weight. */}
                <div className="ss-offer-col is-primary reveal">
                  <h3>The plan</h3>
                  <ul>
                    {planPoints.map((point, i) => (
                      <li key={i}>
                        <span className="ss-check-ico">
                          <CheckIcon />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Answers "how can you know anything in 15 minutes?" by removing
                  the constraint rather than defending it. */}
              <p className="ss-closing is-note reveal">
                Fifteen minutes may not be enough. If it isn&apos;t, we book
                another session, still free, until we know your child well
                enough to write the plan properly.
              </p>

              <div className="ss-steps">
                {steps.map((step, i) => (
                  <div key={i} className="ss-step reveal">
                    <div className="ss-step-num">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                ))}
              </div>

              <div className="ss-cta-row reveal">
                <StrategyCTA source="ss-discover" />
                <span className="ss-cta-note">
                  <span className="dot" aria-hidden="true" /> Completely free.
                  Fifteen minutes.
                </span>
              </div>
            </div>
          </section>

          {/* ---------- 4. DOES THIS SOUND LIKE YOUR CHILD? ---------- */}
          <section className="ss-section ss-alt">
            <div className="container">
              <div className="ss-head reveal">
                <h2>Does this sound like your child?</h2>
                <p>
                  Your child does not lack ability. Nobody has looked closely
                  enough to work out how they learn best.
                </p>
              </div>
              <div className="ss-checklist ss-problem">
                {problemPoints.map((point, i) => (
                  <div key={i} className="ss-check reveal">
                    <span className="ss-check-ico">
                      <CheckIcon />
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <p className="ss-closing reveal">
                Every term you wait is a term they do not get back.
              </p>
              <div className="ss-cta-row reveal">
                <StrategyCTA source="ss-problem" />
                <span className="ss-cta-note">
                  <span className="dot" aria-hidden="true" /> Completely free. No
                  obligation.
                </span>
              </div>
            </div>
          </section>

          {/* ---------- 5. WHY FAMILIES CHOOSE MASANI ----------
              Table only. The three pillar cards that used to sit above it are
              folded into the right-hand column. */}
          <section className="ss-section">
            <div className="container">
              <div className="ss-head reveal">
                <h2>Why families choose Masani</h2>
              </div>
              <div className="ss-compare">
                <div className="ss-compare-card is-old reveal">
                  <h3>Traditional tutoring</h3>
                  <ul className="ss-compare-list">
                    {traditionalPoints.map((point, i) => (
                      <li key={i}>
                        <span className="ss-compare-ico">
                          <CrossIcon />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="ss-compare-card is-masani reveal">
                  <h3>The Masani approach</h3>
                  <ul className="ss-compare-list">
                    {masaniPoints.map((point, i) => (
                      <li key={i}>
                        <span className="ss-compare-ico">
                          <CheckIcon />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- 6. SOCIAL PROOF ---------- */}
          <section className="ss-section ss-alt">
            <div className="container">
              <div className="ss-head reveal">
                <h2>Real families. Real progress.</h2>
                <p>
                  Every success story begins with understanding a child&apos;s
                  unique needs.
                </p>
              </div>
              <div className="testi-grid" style={{ marginTop: 0 }}>
                {testimonials.map((t, i) => (
                  <figure key={i} className="testi reveal">
                    <div className="quote-mark" aria-hidden="true">
                      &ldquo;
                    </div>
                    <blockquote>{t.body}</blockquote>
                    <figcaption className="by">
                      <span className="av" aria-hidden="true">
                        {t.initial}
                      </span>
                      <span className="by-text">
                        <span className="who">{t.author}</span>
                        <span className="where">{t.where}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="ss-cta-row reveal">
                <StrategyCTA source="ss-testimonials" />
                <span className="ss-cta-note">
                  <span className="dot" aria-hidden="true" /> Completely free.
                  Fifteen minutes.
                </span>
              </div>
            </div>
          </section>

          {/* ---------- 7. WHY THIS IS FREE ---------- */}
          <section className="ss-section">
            <div className="container">
              <div className="ss-whyfree reveal">
                <span className="ss-free-badge is-lead">Completely free</span>
                <h2>Why this is free</h2>
                <p>
                  You should not have to guess whether we are any good. Read the
                  plan, judge it yourself, then decide.
                </p>
                <p>
                  Fifteen minutes with an educator who cares whether your child
                  does well. The sooner we speak, the sooner you have the plan.
                </p>
              </div>
              <div className="ss-cta-row reveal">
                <StrategyCTA source="ss-whyfree" />
                <span className="ss-cta-note">
                  <span className="dot" aria-hidden="true" /> Completely free. No
                  obligation.
                </span>
              </div>
            </div>
          </section>

          {/* ---------- 8. THE CLOSE ---------- */}
          <section className="ss-final">
            <div className="ss-final-content">
              <h2 className="reveal">
                Every child has incredible potential. Sometimes they just need{" "}
                <span className="accent">the right strategy.</span>
              </h2>
              <p className="reveal">
                Your child&apos;s future isn&apos;t defined by today&apos;s
                grades. With the right support and a learning approach designed
                specifically for them, they can become more confident, more
                capable, and more successful. Let&apos;s discover what&apos;s
                possible, together.
              </p>
              <div className="ss-cta-row reveal">
                <StrategyCTA source="ss-final" />
                <span className="ss-cta-note">
                  Help your child learn smarter, grow faster, and reach their
                  full potential.
                </span>
              </div>
            </div>
          </section>

          {/* ---------- 9. FAQ ----------
              Sits below the close on purpose. It answers doubts for the
              visitor who did not act, rather than delaying the one who would. */}
          <section className="ss-section ss-alt ss-faq">
            <div className="container">
              <div className="ss-head reveal">
                <h2>Frequently asked questions</h2>
              </div>
              <div className="reveal">
                <StrategyFAQ items={faqItems} />
              </div>
            </div>
          </section>
        </main>

        {/* Minimal footer — logo, contact, legal only. No exit navigation. */}
        <footer className="ss-footer" aria-label="Site footer">
          <div className="container">
            <span className="ss-foot-brand" aria-label="Masani">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-navy-bg.png" alt="Masani" />
            </span>
            <div className="ss-foot-links">
              <a href="mailto:admin@joinmasani.com">admin@joinmasani.com</a>
              <a href="/privacy">Privacy</a>
            </div>
            <p className="ss-foot-copy">© 2026 Masani · joinmasani.com</p>
          </div>
        </footer>

        <StickyMobileCTA />
        <MarketingScrollReveal />
        <ScrollDepthTracker />
      </StrategyBookingProvider>
    </div>
  );
}
