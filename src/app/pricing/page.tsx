import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { PricingTable } from "@/components/marketing/PricingTable";
import { PricingFAQ } from "@/components/marketing/PricingFAQ";
import { MarketingScrollReveal } from "@/components/marketing/MarketingScrollReveal";
import { getPricingContent } from "@/lib/marketing/content";
import { JsonLdScript, faqJsonLd, pageMetadata, serviceJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Online Tutoring Prices in £, $, C$ and ₦",
  description:
    "Transparent prices for one to one online tutoring with Masani. Packages of 8, 24 or 48 sessions from £9.63, $13.13 or C$18.38 a session, with free sessions on larger plans.",
  path: "/pricing",
});

export default function PricingPage() {
  const pricing = getPricingContent();

  return (
    <div className="mkt-root">
      <MarketingScrollReveal />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <JsonLdScript
        data={[
          serviceJsonLd({
            name: "One to one online tutoring",
            description:
              "Private online lessons with vetted Nigerian teachers, sold in packages of 8, 24 or 48 sessions.",
            path: "/pricing",
            serviceType: "Online private tutoring",
            currency: "USD",
          }),
          faqJsonLd(pricing.faq.items),
        ]}
      />
      <Nav mode="marketing" activeHref="/pricing" />
      <main id="main-content">
        <PricingTable intro={pricing.intro} tiers={pricing.tiers} />
        <PricingFAQ content={pricing.faq} />
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
