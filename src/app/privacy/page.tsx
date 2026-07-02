import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/strategy-session.css";

export const metadata: Metadata = {
  title: "Privacy Notice | Masani",
  description:
    "How Masani collects and uses information when you visit our site and book a strategy session.",
};

// Concise, honest privacy notice covering what the marketing pages actually do
// (booking, analytics, and advertising pixels). Have counsel review before any
// large ad spend, and expand as data practices grow.
export default function PrivacyPage() {
  return (
    <div className="mkt-root">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="ss-header" role="banner">
        <div className="container ss-header-inner">
          <Link href="/" className="ss-brand-pill" aria-label="Masani — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-blue-bg.png" alt="Masani" />
          </Link>
        </div>
      </header>

      <main id="main-content" className="ss-section">
        <div
          className="container"
          style={{ maxWidth: 760, marginInline: "auto" }}
        >
          <h1
            style={{
              fontSize: "clamp(30px, 4vw, 44px)",
              letterSpacing: "-0.03em",
              marginBottom: 8,
            }}
          >
            Privacy notice
          </h1>
          <p style={{ color: "var(--ink-3)", marginBottom: 28 }}>
            Last updated 2 July 2026
          </p>

          <div
            style={{
              display: "grid",
              gap: 22,
              color: "var(--ink-2)",
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            <p>
              This notice explains what information Masani collects when you
              visit our website and book a strategy session, and how we use it.
            </p>

            <div>
              <h2
                style={{
                  fontSize: 22,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Information we collect
              </h2>
              <p>
                When you book a session you share details such as your name,
                email address, and the information you choose to tell us about
                your child&apos;s learning. When you use the site we also
                collect standard analytics data such as pages viewed, referring
                links, and campaign parameters (for example UTM tags) so we
                understand which of our efforts are helpful.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: 22,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                How we use it
              </h2>
              <p>
                We use this information to arrange your strategy session, to
                follow up about tutoring for your child, and to improve our
                website and advertising. We use Google Analytics to understand
                site usage and the Meta Pixel to measure and improve our
                advertising. These tools may set cookies in your browser.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: 22,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Sharing
              </h2>
              <p>
                We do not sell your information. We share it only with the
                service providers who help us run Masani (for example our
                scheduling, analytics, and advertising partners) and where the
                law requires it.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: 22,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Your choices
              </h2>
              <p>
                You can ask us to access, correct, or delete the information we
                hold about you at any time. You can also control cookies through
                your browser settings.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: 22,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Contact
              </h2>
              <p>
                Questions about your privacy? Email us at{" "}
                <a
                  href="mailto:admin@joinmasani.com"
                  style={{ color: "var(--coral-deep)", fontWeight: 500 }}
                >
                  admin@joinmasani.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="ss-footer" aria-label="Site footer">
        <div className="container">
          <span className="ss-foot-brand" aria-label="Masani">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-navy-bg.png" alt="Masani" />
          </span>
          <div className="ss-foot-links">
            <a href="mailto:admin@joinmasani.com">admin@joinmasani.com</a>
            <Link href="/strategy-session">Back to booking</Link>
          </div>
          <p className="ss-foot-copy">© 2026 Masani · joinmasani.com</p>
        </div>
      </footer>
    </div>
  );
}
