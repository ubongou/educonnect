import type { Metadata } from "next";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { PricingTable } from "@/components/marketing/PricingTable";
import { FinalCta } from "@/components/marketing/FinalCta";

export const metadata: Metadata = {
  title: "Pricing | EduConnect",
  description:
    "EduConnect pricing — transparent session packages for families in Nigeria, the UK, the US, and Canada.",
};

export default function PricingPage() {
  return (
    <>
      <Nav mode="marketing" activeHref="/pricing" />
      <main className="bg-g50">
        <PricingTable />
        <FinalCta />
      </main>
      <Footer mode="marketing" />
    </>
  );
}
