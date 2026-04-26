import type { Metadata } from "next";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { PricingTable } from "@/components/marketing/PricingTable";
import { FinalCta } from "@/components/marketing/FinalCta";
import { getGlobals, getPricingContent } from "@/lib/marketing/content";
import { getSectionForEdit } from "@/lib/marketing/content";
import { finalCtaSchema } from "@/lib/marketing/schemas";
import { defaultFinalCta } from "@/lib/marketing/defaults";

export const metadata: Metadata = {
  title: "Pricing | EduConnect",
  description:
    "EduConnect pricing — transparent session packages for families in Nigeria, the UK, the US, and Canada.",
};

export default async function PricingPage() {
  const [globals, pricing, finalCta] = await Promise.all([
    getGlobals(),
    getPricingContent(),
    getSectionForEdit("home", "final_cta", finalCtaSchema, defaultFinalCta),
  ]);
  const bookingUrl = globals.content.bookingUrl;

  return (
    <>
      <Nav mode="marketing" activeHref="/pricing" bookingUrl={bookingUrl} />
      <main className="bg-g50">
        <PricingTable
          intro={pricing.intro.content}
          tiers={pricing.tiers.content}
          infoCards={pricing.infoCards.content}
        />
        <FinalCta content={finalCta.content} bookingUrl={bookingUrl} />
      </main>
      <Footer mode="marketing" />
    </>
  );
}
