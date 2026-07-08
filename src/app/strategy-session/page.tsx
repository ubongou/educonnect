import type { Metadata } from "next";
import "../../styles/strategy-session.css";
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
  A: "Your child deserves a personalised learning strategy to help them learn smarter, grow faster, and reach their full potential.",
  B: "A clear academic plan for your child, from Nigeria's finest teachers",
  C: "Give your child the academic support you wish you could give yourself",
};

export const metadata: Metadata = {
  title: "Free 15-Minute Academic Strategy Session for Your Child | Masani",
  description:
    "Give us 15 minutes and we'll help you uncover how your child learns best, then hand you a personalised roadmap to build confidence and improve results. One-on-one tutoring for diaspora Nigerian families in the UK, US, Canada, and Australia.",
};

// ---- Copy (kept dash-free per brand rules) ----------------------------------

// What the parent leaves the session with (hero-adjacent outcomes).
const discoverPoints = [
  "How your child learns best",
  "The hidden opportunities that could accelerate their academic growth",
  "Practical recommendations tailored specifically to your child",
  "A personalised roadmap to help them achieve lasting academic success",
];

// "Is your child..." — the parent recognises their own situation here.
const problemPoints = [
  "Finding schoolwork more challenging than it should be?",
  "Working hard but not seeing the results they deserve?",
  "Losing confidence in certain subjects?",
  "Doing well but capable of achieving even higher grades?",
  "Preparing for important exams or school transitions?",
  "Bright and curious, but not consistently reaching their potential?",
  "Ready to become a more confident, independent learner?",
];

// What happens together during the session (the four phases).
const approach = [
  {
    title: "Understand",
    body: "Identify your child's learning strengths, challenges, and opportunities.",
  },
  {
    title: "Discover",
    body: "Uncover the learning approaches most likely to help your child thrive.",
  },
  {
    title: "Plan",
    body: "Receive personalised recommendations based on your child's unique needs, not generic advice.",
  },
  {
    title: "Move forward",
    body: "Leave with a clear roadmap you can begin using immediately, whether you continue with Masani or not.",
  },
];

const traditionalPoints = [
  "The same teaching style for every child",
  "Focuses mainly on completing schoolwork",
  "Reactive support after problems appear",
  "Limited parent involvement",
];

const masaniPoints = [
  "A personalised learning strategy",
  "Individual tutor matching",
  "Focus on confidence and long-term growth",
  "Parents included throughout the learning journey",
  "Recommendations tailored to your child's goals",
];

// What happens after they book.
const steps = [
  {
    title: "Book your session",
    body: "Choose a convenient time online.",
  },
  {
    title: "Meet with an education specialist",
    body: "We listen carefully to your concerns, learn about your child's goals, strengths, and challenges, and answer your questions.",
  },
  {
    title: "Receive your personalised roadmap",
    body: "You leave with practical recommendations and a clearer understanding of the best path forward.",
  },
  {
    title: "Decide your next step",
    body: "If Masani is the right fit, we recommend the most suitable plan. If another solution is better, we tell you honestly. Your child's success always comes first.",
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Is the strategy session really free?",
    answer:
      "Yes. There are no hidden fees or obligations. This session is our opportunity to understand your child's needs and give you meaningful guidance.",
  },
  {
    question: "Is this only for children who are struggling?",
    answer:
      "Not at all. Many families come to us because their children are already doing well and they want to help them achieve even more. Whether your child needs support, enrichment, or preparation for future academic goals, this session is designed to give you clarity and direction.",
  },
  {
    question: "Will I receive recommendations even if I don't enrol?",
    answer:
      "Absolutely. Our goal is for every family to leave with valuable insights and practical next steps they can put into action immediately.",
  },
  {
    question: "What ages do you support?",
    answer:
      "We work with children from primary through secondary school, across the UK, Nigerian, American, and international curricula.",
  },
  {
    question: "How long does the session take?",
    answer: "Around 15 minutes.",
  },
  {
    question: "Is tutoring compulsory afterwards?",
    answer:
      "No. The strategy session is completely independent. If we believe Masani can help, we explain how. If not, we point you toward the option we believe is best for your child.",
  },
  {
    question: "How are the sessions delivered?",
    answer:
      "Every session is one-on-one and fully online, so your child learns from home wherever your family is in the world.",
  },
  {
    question: "Can you work around our time zone?",
    answer:
      "Yes. We schedule around your family's time zone across the UK, US, Canada, and Australia, including evenings and weekends.",
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

function ShieldIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4L2 9l10 5 10-5-10-5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 11v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Icons for the four session phases.
function LensIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1 1 2v.5h6V15c0-1 .3-1.4 1-2A6 6 0 0 0 12 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const approachIcons = [<LensIcon key="l" />, <BulbIcon key="b" />, <MapIcon key="m" />, <ArrowIcon key="a" />];

const whyPoints = [
  {
    icon: <ShieldIcon />,
    title: "Top 3% of applicants",
    body: "Fewer than 3% of teachers who apply are accepted. We choose each one for their subject mastery, their empathy, and their gift for building real confidence in the students they teach.",
  },
  {
    icon: <CapIcon />,
    title: "Backed by MIT",
    body: "Masani was selected for the MIT Social Innovation Fellowship in 2025. Our teaching is built on the same rigorous, evidence-led standards.",
  },
  {
    icon: <GlobeIcon />,
    title: "Built for diaspora families",
    body: "The best Nigerian teachers, matched to diaspora Nigerian families who want academic excellence and cultural understanding in one place. We select and place the right teacher for your child, so you never sort through a list.",
  },
];

// -----------------------------------------------------------------------------

export default function StrategySessionPage() {
  const heading = HERO_HEADLINES[HERO_HEADLINE_VARIANT];

  return (
    <div className="mkt-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Every CTA on the page opens the shared booking form in this provider's
          modal, then reveals the calendar inline on submit. */}
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
                  best, then hand you a personalised roadmap to build confidence,
                  improve academically, and reach even greater success.
                </p>
                <div className="hero-ctas reveal delay-3">
                  <StrategyCTA source="ss-hero" />
                </div>
                <div className="hero-microcopy reveal delay-3">
                  <span className="dot" aria-hidden="true" /> No obligation. No
                  pressure. Just expert guidance built around your child.
                </div>
                <div className="ss-trustbar reveal delay-3">
                  <span className="ss-trust-item">
                    <CheckIcon /> Backed by MIT
                  </span>
                  <span className="ss-trust-sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="ss-trust-item">
                    <CheckIcon /> Top 3% of applicants
                  </span>
                  <span className="ss-trust-sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="ss-trust-item">
                    <CheckIcon /> Trusted by families in the UK, US, Canada, and
                    Australia
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

          {/* ---------- PROOF BAND (quantified outcomes) ---------- */}
          <section className="ss-proof" aria-label="Results families see">
            <div className="container ss-proof-grid">
              <div className="ss-proof-item reveal">
                <div className="ss-proof-num">3 years</div>
                <div className="ss-proof-label">
                  The average time families stay with Masani
                </div>
              </div>
              <div className="ss-proof-item reveal">
                <div className="ss-proof-num">First month</div>
                <div className="ss-proof-label">
                  When many families start seeing results
                </div>
              </div>
              <div className="ss-proof-item reveal">
                <div className="ss-proof-num">Higher grades</div>
                <div className="ss-proof-label">
                  Students move up as skills and confidence grow
                </div>
              </div>
            </div>
          </section>

          {/* ---------- 2. WHAT YOU'LL DISCOVER ---------- */}
          <section className="ss-section">
            <div className="container">
              <div className="ss-head reveal">
                <h2>
                  During your free 15-minute academic strategy session, you&apos;ll
                  discover:
                </h2>
              </div>
              <div className="ss-checklist ss-offer">
                {discoverPoints.map((point, i) => (
                  <div key={i} className="ss-check reveal">
                    <span className="ss-check-ico">
                      <CheckIcon />
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <div className="ss-cta-row reveal">
                <StrategyCTA source="ss-discover" />
                <span className="ss-cta-note">
                  <span className="dot" aria-hidden="true" /> No obligation. Just
                  expert guidance designed around your child.
                </span>
              </div>
            </div>
          </section>

          {/* ---------- 3. THE PROBLEM ---------- */}
          <section className="ss-section ss-alt">
            <div className="container">
              <div className="ss-head reveal">
                <h2>
                  Every child learns differently. The right strategy makes all
                  the difference.
                </h2>
                <p>
                  Some children need extra support. Some simply need a different
                  approach. Others are already performing well and could achieve
                  even more. The challenge is rarely intelligence. It is finding
                  the learning approach that works best for your child. That is
                  why we begin with understanding, not assumptions.
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
                Wherever your child is today, the right strategy can help them
                move forward.
              </p>
              <div className="ss-cta-row reveal">
                <StrategyCTA source="ss-problem" />
                <span className="ss-cta-note">
                  <span className="dot" aria-hidden="true" /> No cost. No
                  obligation. Booking takes 2 minutes.
                </span>
              </div>
            </div>
          </section>

          {/* ---------- 4. WHAT THE SESSION IS ---------- */}
          <section className="ss-section">
            <div className="container">
              <div className="ss-head reveal">
                <h2>A planning session focused entirely on your child</h2>
                <p>
                  This isn&apos;t a tutoring sales call. It is a personalised
                  academic planning session focused entirely on your child.
                  Together we&apos;ll help you:
                </p>
              </div>
              <div className="ss-approach">
                {approach.map((item, i) => (
                  <div key={i} className="ss-approach-card reveal">
                    <div className="icon">{approachIcons[i]}</div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
              <p className="ss-closing reveal">
                Our goal isn&apos;t simply better grades. It is helping your child
                become a more confident learner for years to come.
              </p>
            </div>
          </section>

          {/* ---------- 5. WHY MASANI ---------- */}
          <section className="ss-section ss-alt ss-why">
            <div className="container">
              <div className="ss-head reveal">
                <h2>Why families choose Masani</h2>
              </div>
              <div className="pillars">
                {whyPoints.map((point, i) => (
                  <div key={i} className={`pillar p${i + 1} reveal`}>
                    <div className="icon">{point.icon}</div>
                    <h3>{point.title}</h3>
                    <p>{point.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- 6. WHAT MAKES MASANI DIFFERENT ---------- */}
          <section className="ss-section">
            <div className="container">
              <div className="ss-head reveal">
                <h2>What makes Masani different</h2>
              </div>
              <div className="ss-prose reveal">
                <p>
                  Every child deserves more than one-size-fits-all tutoring. We
                  believe meaningful progress begins with understanding the
                  child, not just the curriculum. Our approach combines
                  experienced educators, personalised learning strategies, and
                  ongoing support to help children build confidence, improve
                  performance, and enjoy learning again.
                </p>
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

          {/* ---------- 7. SOCIAL PROOF ---------- */}
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
                  <span className="dot" aria-hidden="true" /> No cost. No
                  obligation. Booking takes 2 minutes.
                </span>
              </div>
            </div>
          </section>

          {/* ---------- 8. WHAT HAPPENS NEXT ---------- */}
          <section className="ss-section">
            <div className="container">
              <div className="ss-head reveal">
                <h2>Here&apos;s what happens next</h2>
              </div>
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
            </div>
          </section>

          {/* ---------- 9. WHY WE OFFER THIS FREE ---------- */}
          <section className="ss-section ss-alt">
            <div className="container">
              <div className="ss-whyfree reveal">
                <span className="ss-free-badge">Completely free</span>
                <h2>Why we offer this session free</h2>
                <p>
                  Choosing the right educational support shouldn&apos;t involve
                  guesswork. We believe parents deserve clarity before making
                  important decisions about their child&apos;s learning.
                </p>
                <p>
                  That is why this session is completely free. No obligation. No
                  pressure. Just thoughtful guidance from educators who genuinely
                  care about helping children succeed.
                </p>
              </div>
              <div className="ss-cta-row reveal">
                <StrategyCTA source="ss-whyfree" />
                <span className="ss-cta-note">
                  <span className="dot" aria-hidden="true" /> No cost. No
                  obligation. Booking takes 2 minutes.
                </span>
              </div>
            </div>
          </section>

          {/* ---------- 10. FAQ ---------- */}
          <section className="ss-section ss-faq">
            <div className="container">
              <div className="ss-head reveal">
                <h2>Frequently asked questions</h2>
              </div>
              <div className="reveal">
                <StrategyFAQ items={faqItems} />
              </div>
            </div>
          </section>

          {/* ---------- 11. FINAL CTA ---------- */}
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
