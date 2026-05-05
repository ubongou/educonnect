import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Booking received — EduConnect",
  description: "Thank you — we'll be in touch shortly to confirm your trial.",
};

export default function BookThanksPage() {
  return (
    <div className="mkt-root">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content">
        <section className="contact" aria-labelledby="thanks-heading">
          <div className="container" style={{ maxWidth: 720 }}>
            <span className="eyebrow">Booking received</span>
            <h1 id="thanks-heading" style={{ marginTop: 14 }}>
              Thank you — we&apos;ll be in touch soon.
            </h1>
            <p className="lead">
              After booking, a tutor will be assigned to your child and you
              will receive a confirmation message on WhatsApp.
            </p>

            <h2
              style={{
                marginTop: 40,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              During the trial session, the tutor will:
            </h2>
            <ul
              style={{
                marginTop: 12,
                lineHeight: 1.8,
                paddingLeft: 22,
              }}
            >
              <li>Teach a short interactive lesson</li>
              <li>Assess your child&apos;s strengths and gaps</li>
              <li>
                Share feedback and a recommended learning plan after the
                session.
              </li>
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
