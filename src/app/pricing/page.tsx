import type { Metadata } from "next";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { PricingTable } from "@/components/marketing/PricingTable";
import { PricingFAQ } from "@/components/marketing/PricingFAQ";
import { MarketingScrollReveal } from "@/components/marketing/MarketingScrollReveal";
import { getPricingContent } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Pricing — EduConnect",
  description:
    "Flexible, transparent pricing for EduConnect tutoring. Choose the package that works for your family — 8, 24, or 48 sessions with no hidden fees.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const pricing = await getPricingContent();

  return (
    <div className="mkt-root">
      <MarketingScrollReveal />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" activeHref="/pricing" />
      <main id="main-content">
        <PricingTable
          intro={pricing.intro.content}
          tiers={pricing.tiers.content}
        />
        <PricingFAQ content={pricing.faq.content} />
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
