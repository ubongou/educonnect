import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { getGlobals } from "@/lib/marketing/content";
import { PickSessionButton } from "@/components/booking/PickSessionButton";

export const metadata: Metadata = {
  title: "One more step — Masani",
  description:
    "Pick a session time on the calendar to confirm your free trial booking.",
};

export default function BookThanksPage() {
  const globals = getGlobals();
  const calendarUrl = globals.bookingUrl;

  return (
    <div className="mkt-root">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content">
        <section className="contact" aria-labelledby="thanks-heading">
          <div className="container" style={{ maxWidth: 720 }}>
            <span className="eyebrow">One more step</span>
            <h1 id="thanks-heading" style={{ marginTop: 14 }}>
              You&apos;re almost there.
            </h1>
            <p className="lead">
              To complete your booking, choose a session time below.{" "}
              <strong>
                Your slot is not confirmed until you&apos;ve picked a time on
                the calendar.
              </strong>
            </p>

            <div style={{ marginTop: 32 }}>
              <PickSessionButton href={calendarUrl} />
              <p
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: "#6b7680",
                }}
              >
                After picking a time you&apos;ll receive a confirmation by
                email.
              </p>
            </div>

            <h2
              style={{
                marginTop: 48,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              During the session, we will:
            </h2>
            <ul
              style={{
                marginTop: 12,
                lineHeight: 1.8,
                paddingLeft: 22,
              }}
            >
              <li>Get to know you and your child</li>
              <li>Explore your child&apos;s current level and learning goals</li>
              <li>Answer any questions you might have</li>
            </ul>

            <div style={{ marginTop: 40 }}>
              <Link href="/" className="btn btn-ghost">
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
