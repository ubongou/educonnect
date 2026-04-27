import type { Metadata } from "next";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { PricingTable } from "@/components/marketing/PricingTable";
import { PricingFAQ } from "@/components/marketing/PricingFAQ";
import { MarketingScrollReveal } from "@/components/marketing/MarketingScrollReveal";
import { getGlobals, getPricingContent } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Pricing — EduConnect",
  description:
    "Flexible, transparent pricing for EduConnect tutoring. Choose the package that works for your family — 8, 24, or 48 sessions with no hidden fees.",
};

export default async function PricingPage() {
  const [globals, pricing] = await Promise.all([
    getGlobals(),
    getPricingContent(),
  ]);
  const bookingUrl = globals.content.bookingUrl;

  return (
    <div className="mkt-root">
      <MarketingScrollReveal />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" activeHref="/pricing" bookingUrl={bookingUrl} />
      <main id="main-content">
        <PricingTable
          intro={pricing.intro.content}
          tiers={pricing.tiers.content}
          bookingUrl={bookingUrl}
        />
        <PricingFAQ content={pricing.faq.content} />
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
