import type {
  FinalCtaContent,
  FoundersContent,
  GlobalsContent,
  HeroContent,
  HowItWorksContent,
  PricingInfoCardsContent,
  PricingIntroContent,
  PricingTiersContent,
  TestimonialsContent,
  WhyGridContent,
} from "./schemas";

/**
 * Hardcoded fallback values for every CMS-managed section. These are used:
 *  • when the `site_sections` row is missing (e.g., fresh deploy before
 *    the migration seed has applied),
 *  • when a row is present but fails Zod parse (e.g., a future schema
 *    field was added and the row hasn't been re-saved yet),
 *  • during unit tests / static analysis where a DB isn't available.
 *
 * Image fields point at the bundled /public assets so the page renders
 * identically whether or not an admin has uploaded a replacement.
 */

// -----------------------------------------------------------------------------
// Bundled image paths (under /public). The `assetUrl` resolver returns these
// directly when the corresponding storage path is empty.
// -----------------------------------------------------------------------------

export const bundledAssets = {
  heroImage: "/home/hero.png",
  mitBadge: "/mit_badge.svg",
  whyGridPolaroids: [
    "/gallery/photo-5.webp",
    "/gallery/session-large.webp",
    "/gallery/proof-large.webp",
  ] as const,
  founderPhotos: [
    "/founders/unyime-okorosobo.jpeg",
    "/founders/grace-amoka.png",
  ] as const,
};

// -----------------------------------------------------------------------------
// Globals
// -----------------------------------------------------------------------------

export const defaultGlobals: GlobalsContent = {
  bookingUrl: "https://calendar.app.google/ZiNbAvQkBaYHMVY69",
  adminEmail: "admin@joineduconnect.com",
  websiteUrl: "https://www.joineduconnect.com",
  instagramUrl: "https://www.instagram.com/educonnectng/",
  facebookUrl: "https://www.facebook.com/profile.php?id=61572098883786",
};

// -----------------------------------------------------------------------------
// Home
// -----------------------------------------------------------------------------

export const defaultHero: HeroContent = {
  heading: "Personal Tutoring from Nigeria's Best Teachers",
  subheading:
    "EduConnect is a tutoring service that provides your children with private, one-on-one instruction from Nigeria's finest educators — rigorously vetted, carefully matched, and deeply invested in every child they teach.",
  primaryCtaLabel: "Book a free session",
  secondaryCtaLabel: "How it works",
  disclaimer: "No commitment. Takes 15 minutes.",
  heroImagePath: "",
  heroImageAlt: "EduConnect student engaged in a one-on-one lesson",
  mitBadgePath: "",
  mitBadgeAlt: "Backed by MIT — Massachusetts Institute of Technology",
};

export const defaultWhyGrid: WhyGridContent = {
  eyebrow: "Why EduConnect",
  title: "What sets our teachers apart",
  subtitle:
    "We do not list tutors for parents to browse. We select, vet, and place the right teacher for each child.",
  cards: [
    {
      title: "Exceptional Teachers",
      body: "Learn from passionate educators who bring out the best in every student. Our teachers are carefully selected for their expertise, empathy, and ability to inspire confidence in learners.",
    },
    {
      title: "Flexible, Child-Centered Learning",
      body: "We work around your schedule, not the other way around. Choose the times, formats, and goals that suit your child's needs — all while staying informed and involved every step of the way.",
    },
    {
      title: "Academic and Personal Growth",
      body: "Our approach goes beyond test scores. We help students build confidence, resilience, and a genuine love for learning. Every session is a step toward becoming a more capable, self-assured learner.",
    },
  ],
  polaroids: [
    { imagePath: "", alt: "Student working through maths problems at home" },
    {
      imagePath: "",
      alt: "EduConnect student working through a live lesson on their laptop",
    },
    { imagePath: "", alt: "Student celebrating progress during a session" },
  ],
};

export const defaultHowItWorks: HowItWorksContent = {
  eyebrow: "How it works",
  title: "Four steps to better results",
  subtitle:
    "From your first conversation to visible progress at school — here is what to expect.",
  ctaLabel: "Book a free session",
  steps: [
    {
      title: "Book a free consultation",
      body: "Tell us your child's year group, subjects, and goals. Takes 15 minutes.",
    },
    {
      title: "We match your teacher",
      body: "We select a teacher based on your child's needs, learning style, and personality — not just availability.",
    },
    {
      title: "Sessions begin",
      body: "Flexible scheduling, one-on-one, fully online. Lessons adapt as your child grows.",
    },
    {
      title: "Results and updates",
      body: "Better grades, stronger confidence, and a changed attitude toward learning. You receive regular progress updates throughout.",
    },
  ],
};

export const defaultTestimonials: TestimonialsContent = {
  eyebrow: "What parents say",
  title: "Real results, real families",
  quotes: [
    {
      body: "The tutors have been outstanding — patient, professional, and deeply committed. I would wholeheartedly recommend EduConnect to any parent looking to see tangible improvement in their children's learning journey.",
      author: "Andrew Ugbehe — Scotland, UK",
    },
    {
      body: "Since I started using this service, my child's performance has improved. The lesson teacher is good at what she does, and I have recommended their services to other parents and will continue to do so.",
      author: "Mrs. Frilster — United Kingdom",
    },
    {
      body: "Our daughter gets excited to connect with her EduConnect tutor. Her attitude toward learning mathematics has changed completely. Her self-confidence has increased and she is eager to learn new concepts.",
      author: "Mrs. Joanne — United States",
    },
  ],
};

export const defaultFounders: FoundersContent = {
  eyebrow: "About EduConnect",
  headingLead: "Built on one belief: ",
  headingHighlight: "teaching quality determines everything.",
  intro:
    "EduConnect was built on a simple belief: the quality of teaching determines everything. We recruit and vet Nigeria's most capable teachers, then work with families around the world to give every child access to genuinely excellent instruction. We are a tutoring service — not a platform — and stay accountable for every teacher we place and every child we serve.",
  founders: [
    {
      name: "Unyime Okorosobo",
      role: "Co-founder · Curriculum & Pedagogy",
      bio: "Unyime holds a Master's in International Education from the University of Manchester and a B.Sc. in Computer Science from Bowen University. A third-generation educator with more than 15 years in classrooms and school leadership, she was named one of Nigeria's 50 Most Inspirational Teachers in 2023. She is a Microsoft Certified Educator, has trained thousands of teachers on classroom technology integration, and runs Strategic Maths — an initiative transforming how numeracy is taught across Nigerian schools.",
      photoPath: "",
      photoAlt: "Unyime Okorosobo",
    },
    {
      name: "Grace Amoka",
      role: "Co-founder · Operations & Product",
      bio: "Grace holds a degree in Computer Engineering from Covenant University and a Master's in Educational Technology from the University of Ilorin. With over nine years of experience as a teacher, coach, and education consultant, she has worked across K-12 systems on three continents, consulted for the World Bank, and served as a programme coordinator at the African Leadership Academy and Teach for Nigeria — training over 400 educators across more than seven countries.",
      photoPath: "",
      photoAlt: "Grace Amoka",
    },
  ],
};

export const defaultFinalCta: FinalCtaContent = {
  heading: "Ready to get started?",
  subheading:
    "Book a free consultation and we'll find the right teacher for your child.",
  ctaLabel: "Book a free session",
  disclaimer: "No commitment. Takes 15 minutes.",
};

// -----------------------------------------------------------------------------
// Pricing
// -----------------------------------------------------------------------------

export const defaultPricingIntro: PricingIntroContent = {
  eyebrow: "Pricing",
  title: "Session packages, not subscriptions",
  subtitle:
    "All sessions are one-on-one. Pay once for the package that fits, the more sessions you commit to, the lower the per-session rate.",
};

export const defaultPricingTiers: PricingTiersContent = {
  tiers: [
    {
      sessions: 8,
      duration: "~1 month at 2x / week",
      popular: false,
      noCommitmentMessage: "Standard rate — no commitment",
      prices: {
        NGN: { perSession: 20000, total: 160000, saving: 0, free: 0 },
        USD: { perSession: 15, total: 120, saving: 0, free: 0 },
        GBP: { perSession: 11, total: 88, saving: 0, free: 0 },
        CAD: { perSession: 21, total: 168, saving: 0, free: 0 },
      },
    },
    {
      sessions: 24,
      duration: "~3 months at 2x / week",
      popular: true,
      noCommitmentMessage: "Standard rate — no commitment",
      prices: {
        NGN: { perSession: 18333, total: 440000, saving: 40000, free: 2 },
        USD: { perSession: 13.75, total: 330, saving: 30, free: 2 },
        GBP: { perSession: 10.08, total: 242, saving: 22, free: 2 },
        CAD: { perSession: 19.25, total: 462, saving: 42, free: 2 },
      },
    },
    {
      sessions: 48,
      duration: "~6 months at 2x / week",
      popular: false,
      noCommitmentMessage: "Standard rate — no commitment",
      prices: {
        NGN: { perSession: 17500, total: 840000, saving: 120000, free: 6 },
        USD: { perSession: 13.13, total: 630, saving: 90, free: 6 },
        GBP: { perSession: 9.63, total: 462, saving: 66, free: 6 },
        CAD: { perSession: 18.38, total: 882, saving: 126, free: 6 },
      },
    },
  ],
};

export const defaultPricingInfoCards: PricingInfoCardsContent = {
  cards: [
    {
      title: "All sessions are one-on-one",
      body: "Every session is private, focused entirely on your child. No shared classes, no group settings.",
    },
    {
      title: "Flexible scheduling",
      body: "Sessions are booked at times that work for your family. Reschedule with 24 hours notice.",
    },
    {
      title: "Not sure which package?",
      body: "Book a free consultation first. We'll recommend the right package after understanding your child's needs.",
    },
  ],
};
