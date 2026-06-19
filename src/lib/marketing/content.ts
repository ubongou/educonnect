import {
  defaultContact,
  defaultFounders,
  defaultGlobals,
  defaultHero,
  defaultHowItWorks,
  defaultMarquee,
  defaultPricingFaq,
  defaultPricingIntro,
  defaultPricingTiers,
  defaultTestimonials,
  defaultWhyGrid,
} from "./defaults";
import type {
  ContactContent,
  FoundersContent,
  GlobalsContent,
  HeroContent,
  HowItWorksContent,
  MarqueeContent,
  PricingFaqContent,
  PricingIntroContent,
  PricingTiersContent,
  TestimonialsContent,
  WhyGridContent,
} from "./schemas";

export type HomeContent = {
  hero: HeroContent;
  marquee: MarqueeContent;
  whyGrid: WhyGridContent;
  howItWorks: HowItWorksContent;
  testimonials: TestimonialsContent;
  founders: FoundersContent;
  contact: ContactContent;
};

export type PricingContent = {
  intro: PricingIntroContent;
  tiers: PricingTiersContent;
  faq: PricingFaqContent;
};

export function getGlobals(): GlobalsContent {
  return defaultGlobals;
}

export function getHomeContent(): HomeContent {
  return {
    hero: defaultHero,
    marquee: defaultMarquee,
    whyGrid: defaultWhyGrid,
    howItWorks: defaultHowItWorks,
    testimonials: defaultTestimonials,
    founders: defaultFounders,
    contact: defaultContact,
  };
}

export function getPricingContent(): PricingContent {
  return {
    intro: defaultPricingIntro,
    tiers: defaultPricingTiers,
    faq: defaultPricingFaq,
  };
}
