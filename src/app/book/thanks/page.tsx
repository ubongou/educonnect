import type { Metadata } from "next";
import "../../../styles/booking.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { ConsultationCalendar } from "@/components/booking/ConsultationCalendar";

// /book now shows the calendar on the same page after the form is submitted.
// This route is kept for older links and bookmarks: it shows the same Cal.com
// calendar so anyone landing here can still book.
export const metadata: Metadata = {
  title: "Pick a time for your free consultation",
  description:
    "Pick a time on the calendar to confirm your free consultation.",
  robots: { index: false, follow: false },
};

export default function BookThanksPage() {
  return (
    <div className="mkt-root">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content">
        <section className="booking" aria-labelledby="thanks-heading">
          <div className="container booking-container">
            <span className="eyebrow">Free consultation</span>
            <h1 id="thanks-heading" className="booking-title">
              Last step: pick a time for your call
            </h1>
            <p className="lead booking-lead">
              You are <strong>not booked yet</strong>. Choose a slot below.
              Times show in your own timezone.
            </p>
            <ConsultationCalendar source="direct" />
          </div>
        </section>
      </main>
      <Footer mode="marketing" showWhatsApp={false} />
    </div>
  );
}
