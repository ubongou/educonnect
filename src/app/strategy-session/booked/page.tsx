import type { Metadata } from "next";
import "../../../styles/strategy-session.css";
import { BookedCalendar } from "./BookedCalendar";

// Reached only after a real, validated /strategy-session submission (a hard
// navigation from StrategyBooking's onDone) — not meant to be indexed,
// bookmarked, or linked to directly.
export const metadata: Metadata = {
  title: "One last step: pick your time | Masani",
  robots: { index: false, follow: false },
};

export default function StrategySessionBookedPage() {
  return (
    <div className="mkt-root">
      <header className="ss-header" role="banner">
        <div className="container ss-header-inner">
          <span className="ss-brand-pill" aria-label="Masani">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-blue-bg.png" alt="Masani" />
          </span>
        </div>
      </header>

      <main id="main-content">
        <section className="ss-booked">
          <div className="ss-booked-card">
            <BookedCalendar />
          </div>
        </section>
      </main>

      <footer className="ss-footer" aria-label="Site footer">
        <div className="container">
          <p className="ss-foot-copy">© 2026 Masani · joinmasani.com</p>
        </div>
      </footer>
    </div>
  );
}
