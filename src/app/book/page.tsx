import { Suspense } from "react";
import type { Metadata } from "next";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { MarketingScrollReveal } from "@/components/marketing/MarketingScrollReveal";
import { BookingFormRoute } from "@/components/booking/BookingFormRoute";

export const metadata: Metadata = {
  title: "Book a free trial — Masani",
  description:
    "Tell us about your child and we'll match you with a tutor for a free trial session.",
};

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
      <Footer mode="marketing" />
    </div>
  );
}
