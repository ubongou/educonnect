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

export default function Home() {
  const home = getHomeContent();

  return (
    <div className="mkt-root">
      <MarketingScrollReveal />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content">
        <Hero content={home.hero} />
        <Marquee content={home.marquee} />
        <WhyGrid content={home.whyGrid} />
        <HowItWorks content={home.howItWorks} />
        <Testimonials content={home.testimonials} />
        <FoundersAbout content={home.founders} />
        <Contact content={home.contact} />
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
