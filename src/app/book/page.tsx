import { Suspense } from "react";
import type { Metadata } from "next";
import "../../styles/booking.css";
import { pageMetadata } from "@/lib/seo";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { MarketingScrollReveal } from "@/components/marketing/MarketingScrollReveal";
import { BookingFormRoute } from "@/components/booking/BookingFormRoute";

export const metadata: Metadata = pageMetadata({
  title: "Book a Free Consultation",
  description:
    "Book a free 15 minute call with a Masani education expert about your child. Tell us about them, then pick a time that suits you.",
  path: "/book",
});

export default function BookPage() {
  return (
    <div className="mkt-root">
      <MarketingScrollReveal />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" activeHref="/book" />
      <main id="main-content">
        {/* Suspense is required because BookingFormRoute calls useSearchParams. */}
        <Suspense fallback={null}>
          <BookingFormRoute />
        </Suspense>
      </main>
      <Footer mode="marketing" showWhatsApp={false} />
    </div>
  );
}
