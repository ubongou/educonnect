import "../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { JsonLdScript, faqJsonLd, pageMetadata } from "@/lib/seo";
import { homeFaqs } from "@/lib/marketing/promise";
import { FamilyGets, HomeFaq, PricePromise, ProofStrip } from "@/components/marketing/HomeExtras";
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

export const metadata = pageMetadata({
  title: "Masani | Online Tutoring for Nigerian Families Abroad",
  absoluteTitle: true,
  description:
    "Private, one to one online tutoring from vetted Nigerian teachers for children in the UK, US and Canada. Maths, English, science, 11+ and SAT. Selected for the MIT Social Innovation Fellowship 2025.",
  path: "/",
});

export default function Home() {
  const home = getHomeContent();

  return (
    <div className="mkt-root">
      <MarketingScrollReveal />
      <JsonLdScript data={faqJsonLd(homeFaqs)} />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content">
        <Hero content={home.hero} />
        <Marquee content={home.marquee} />
        <ProofStrip />
        <FamilyGets />
        <WhyGrid content={home.whyGrid} />
        <HowItWorks content={home.howItWorks} />
        <Testimonials content={home.testimonials} />
        <PricePromise />
        <HomeFaq />
        <FoundersAbout content={home.founders} />
        <Contact content={home.contact} />
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
