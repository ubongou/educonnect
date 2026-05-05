import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Marquee } from "@/components/marketing/Marquee";
import { WhyGrid } from "@/components/marketing/WhyGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FoundersAbout } from "@/components/marketing/FoundersAbout";
import { Contact } from "@/components/marketing/Contact";
import { MarketingScrollReveal } from "@/components/marketing/MarketingScrollReveal";
import { getHomeContent } from "@/lib/marketing/content";

export default async function Home() {
  const home = await getHomeContent();

  return (
    <div className="mkt-root">
      <MarketingScrollReveal />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content">
        <Hero
          content={home.hero.content}
          updatedAt={home.hero.updatedAt}
        />
        <Marquee content={home.marquee.content} />
        <WhyGrid content={home.whyGrid.content} />
        <HowItWorks
          content={home.howItWorks.content}
          updatedAt={home.howItWorks.updatedAt}
        />
        <Testimonials content={home.testimonials.content} />
        <FoundersAbout
          content={home.founders.content}
          updatedAt={home.founders.updatedAt}
        />
        <Contact content={home.contact.content} />
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
