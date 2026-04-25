import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Marquee } from "@/components/marketing/Marquee";
import { WhyGrid } from "@/components/marketing/WhyGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FoundersAbout } from "@/components/marketing/FoundersAbout";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Contact } from "@/components/marketing/Contact";

export default function Home() {
  return (
    <>
      <Nav mode="marketing" />
      <Hero />
      <Marquee />
      <WhyGrid />
      <HowItWorks />
      <Testimonials />
      <FoundersAbout />
      <FinalCta />
      <Contact />
      <Footer mode="marketing" />
    </>
  );
}
