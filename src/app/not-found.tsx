import Link from "next/link";
import "../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** Friendly 404 that sends people back to the pages that matter. */
export default function NotFound() {
  return (
    <div className="mkt-root">
      <Nav mode="marketing" />
      <main id="main-content" className="lp">
        <section className="lp-hero">
          <div className="container">
            <p className="eyebrow">Page not found</p>
            <h1>We couldn&apos;t find that page</h1>
            <p className="lp-intro">
              The link may be old or mistyped. Here are the places most parents are
              looking for.
            </p>
            <div className="lp-ctas">
              <Link href="/book?source=404" className="btn btn-coral">
                Book a free session
              </Link>
              <Link href="/" className="btn btn-ghost">
                Go to the homepage
              </Link>
            </div>
          </div>
        </section>
        <section className="lp-section">
          <div className="container lp-related">
            <nav aria-label="Popular pages">
              <h2>Popular pages</h2>
              <ul>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/tutoring">Subjects we teach</Link></li>
                <li><Link href="/our-promise">Our promise</Link></li>
                <li><Link href="/guides/online-tutoring-for-nigerian-families-abroad">How to choose an online tutor</Link></li>
                <li><Link href="/about">About Masani</Link></li>
              </ul>
            </nav>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
