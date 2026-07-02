import type { Metadata } from "next";
import "../../styles/strategy-session.css";
import { MarketingScrollReveal } from "@/components/marketing/MarketingScrollReveal";
import { bundledAssets } from "@/lib/marketing/defaults";
import { StrategyCTA } from "./StrategyCTA";
import { StrategyFAQ, type FaqItem } from "./StrategyFAQ";
import { ScrollDepthTracker } from "./ScrollDepthTracker";
import { StickyMobileCTA } from "./StickyMobileCTA";

// -----------------------------------------------------------------------------
// A/B TEST: swap this single value to change the hero headline. The three
// approved variants live in HERO_HEADLINES below.
// -----------------------------------------------------------------------------
const HERO_HEADLINE_VARIANT: "A" | "B" | "C" = "A";

const HERO_HEADLINES: Record<"A" | "B" | "C", string> = {
  A: "Discover what's holding your child back, in just 15 minutes",
  B: "A clear academic plan for your child, from Nigeria's finest teachers",
  C: "Give your child the academic support you wish you could give yourself",
};

export const metadata: Metadata = {
  title: "Free 15-Minute Strategy Session for Your Child | Masani",
  description:
    "Book a free 15-minute strategy session and get a personalised academic roadmap for your child, built by an education specialist. One-on-one tutoring for diaspora African families in the UK, US, Canada, and Australia.",
};

// ---- Copy (kept dash-free per brand rules) ----------------------------------

const problemPoints = [
  "Grades slipping, even though your child is trying",
  "Losing confidence in a subject they used to enjoy",
  "Great one term, struggling the next",
  "You want them to be a top student, not just getting by",
  "You are far from home and cannot always be hands-on",
  "You have tried tutors before who did not understand your child, or your background",
];

const offerPoints = [
  "A one-on-one consultation with a Masani education specialist",
  "Direct interaction with a Top 3% Masani teacher",
  "A personalised review of your child's strengths and challenges",
  "Subject-specific recommendations for improvement",
  "A customised learning roadmap",
  "Tutor matching recommendations where appropriate",
  "Clear next steps, whether or not you enrol",
];

const steps = [
  {
    title: "Book your free 15-minute session",
    body: "Two minutes to book, at no cost.",
  },
  {
    title: "Talk with a Masani education specialist",
    body: "Share your child's specific challenges and goals.",
  },
  {
    title: "Receive a personalised academic roadmap",
    body: "Yours to keep, whether or not you enrol.",
  },
  {
    title: "Get matched with your child's ideal teacher",
    body: "Optional. Start learning whenever you are ready.",
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Will my child actually connect with the tutor?",
    answer:
      "Our perfect tutor match guarantee means free rematching if it is not working.",
  },
  {
    question: "What if I do not see improvement?",
    answer:
      "Our first-month satisfaction guarantee means a full refund if we do not deliver.",
  },
  {
    question: "Will my child enjoy the sessions or resist them?",
    answer:
      "Every teacher is selected and matched to your child's personality and learning style, not just the subject.",
  },
  {
    question: "How do I know this is the right fit?",
    answer:
      "That is exactly what the free strategy session is for. No commitment required.",
  },
  {
    question: "How is Masani different from other tutoring services?",
    answer:
      "Top 3% of applicants, an approach backed by MIT, and teachers who understand your cultural background. We place the right teacher for your child rather than handing you a list to browse.",
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

const whyPoints = [
  {
    icon: <ShieldIcon />,
    title: "Top 3% of applicants",
    body: "Fewer than 1 in 10 teachers who apply are accepted.",
  },
  {
    icon: <CapIcon />,
    title: "Backed by MIT",
    body: "An educational approach grounded in credible, rigorous standards.",
  },
  {
    icon: <GlobeIcon />,
    title: "Built for diaspora families",
    body: "Nigerian teachers who understand both academic excellence and cultural context. We select and place the right teacher for each child rather than handing you a list to browse.",
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
                Book a free 15-minute strategy session and get a personalised
                academic roadmap for your child, built by an education
                specialist, backed by MIT.
              </p>
              <div className="hero-ctas reveal delay-3">
                <StrategyCTA source="hero" />
              </div>
              <div className="hero-microcopy reveal delay-3">
                <span className="dot" aria-hidden="true" /> No cost. No
                obligation. Booking takes 2 minutes.
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
                <div className="hero-photo" aria-hidden="true">
                  <span className="blob-y" />
                  <span className="blob-c" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bundledAssets.heroImage}
                    alt="A Masani student in a one-on-one lesson"
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

        {/* ---------- 2. THE PROBLEM ---------- */}
        <section className="ss-section ss-alt">
          <div className="container">
            <div className="ss-head reveal">
              <h2>If any of this sounds familiar, you are not alone.</h2>
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
            <p className="ss-closing reveal">Masani was built for exactly this.</p>
          </div>
        </section>

        {/* ---------- 3. THE OFFER ---------- */}
        <section className="ss-section">
          <div className="container">
            <div className="ss-head reveal">
              <h2>Your free strategy session includes:</h2>
            </div>
            <div className="ss-checklist ss-offer">
              {offerPoints.map((point, i) => (
                <div key={i} className="ss-check reveal">
                  <span className="ss-check-ico">
                    <CheckIcon />
                  </span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
            <div className="ss-cta-row reveal">
              <StrategyCTA source="after_offer" />
              <span className="ss-cta-note">
                <span className="dot" aria-hidden="true" /> No cost. No
                obligation. Booking takes 2 minutes.
              </span>
            </div>
          </div>
        </section>

        {/* ---------- 4. WHY MASANI ---------- */}
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

        {/* ---------- 5. SOCIAL PROOF ---------- */}
        <section className="ss-section">
          <div className="container">
            <div className="ss-head reveal">
              <h2>Real results, real families</h2>
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
                    <span>
                      <span className="who">{t.author}</span>
                      <span className="where">{t.where}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="ss-cta-row reveal">
              <StrategyCTA source="after_testimonials" />
              <span className="ss-cta-note">
                <span className="dot" aria-hidden="true" /> No cost. No
                obligation. Booking takes 2 minutes.
              </span>
            </div>
          </div>
        </section>

        {/* ---------- 6. RISK REVERSAL ---------- */}
        <section className="ss-section ss-alt">
          <div className="container">
            <div className="ss-head reveal">
              <h2>We remove the risk. You just show up.</h2>
            </div>
            <div className="ss-guarantees">
              <div className="ss-guarantee reveal">
                <div className="ss-g-badge">
                  <ShieldIcon />
                </div>
                <h3>Perfect tutor match guarantee</h3>
                <p>
                  Not clicking with your child&apos;s tutor after the first two
                  sessions? We rematch at no extra cost.
                </p>
              </div>
              <div className="ss-guarantee reveal">
                <div className="ss-g-badge">
                  <ShieldIcon />
                </div>
                <h3>First-month satisfaction guarantee</h3>
                <p>
                  Not seeing the experience you were promised in month one? Full
                  refund.
                </p>
              </div>
            </div>
            <p className="ss-fineprint reveal">
              Standard conditions apply (attendance, communicated concerns, and
              so on).
            </p>
            <div className="ss-cta-row reveal">
              <StrategyCTA source="after_guarantee" />
              <span className="ss-cta-note">
                <span className="dot" aria-hidden="true" /> No cost. No
                obligation. Booking takes 2 minutes.
              </span>
            </div>
          </div>
        </section>

        {/* ---------- 7. HOW IT WORKS ---------- */}
        <section className="ss-section">
          <div className="container">
            <div className="ss-head reveal">
              <h2>How it works</h2>
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

        {/* ---------- 8. FAQ ---------- */}
        <section className="ss-section ss-alt ss-faq">
          <div className="container">
            <div className="ss-head reveal">
              <h2>Questions parents ask</h2>
            </div>
            <div className="reveal">
              <StrategyFAQ items={faqItems} />
            </div>
          </div>
        </section>

        {/* ---------- 9. FINAL CTA ---------- */}
        <section className="ss-final">
          <div className="ss-final-content">
            <h2 className="reveal">
              Give your child the clarity and support they need, starting with{" "}
              <span className="accent">one free conversation.</span>
            </h2>
            <p className="reveal">
              Book a free 15-minute strategy session and walk away with a
              personalised roadmap for your child, whether or not you enrol.
            </p>
            <div className="ss-cta-row reveal">
              <StrategyCTA source="final" />
              <span className="ss-cta-note">
                No cost. No obligation. Booking takes 2 minutes.
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
    </div>
  );
}
