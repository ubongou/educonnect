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
import { getGlobals, getHomeContent } from "@/lib/marketing/content";

export default async function Home() {
  const [globals, home] = await Promise.all([getGlobals(), getHomeContent()]);
  const bookingUrl = globals.content.bookingUrl;

  return (
    <>
      <Nav mode="marketing" bookingUrl={bookingUrl} />
      <Hero
        content={home.hero.content}
        bookingUrl={bookingUrl}
        updatedAt={home.hero.updatedAt}
      />
      <Marquee />
      <WhyGrid content={home.whyGrid.content} updatedAt={home.whyGrid.updatedAt} />
      <HowItWorks content={home.howItWorks.content} bookingUrl={bookingUrl} />
      <Testimonials content={home.testimonials.content} />
      <FoundersAbout
        content={home.founders.content}
        updatedAt={home.founders.updatedAt}
      />
      <FinalCta content={home.finalCta.content} bookingUrl={bookingUrl} />
      <Contact />
      <Footer mode="marketing" />
    </>
  );
}
