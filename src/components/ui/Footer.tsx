import Link from "next/link";
import { WhatsAppButton } from "@/components/marketing/WhatsAppButton";
import { BrandLogo } from "./BrandLogo";
import { countryPages, examPrepPages, subjectOnlyPages } from "@/lib/marketing/seoPages";

type Mode = "marketing" | "authed";

const parentLinks = [
  { href: "/dashboard", label: "My children" },
  { href: "/dashboard/settings", label: "Settings" },
];

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/enrollments", label: "Enrollments" },
  { href: "/admin/reports", label: "Reports" },
];

export function Footer({
  mode = "marketing",
  role,
}: {
  mode?: Mode;
  role?: "parent" | "admin";
}) {
  if (mode === "marketing") {
    return <MarketingFooter />;
  }
  return <AuthedFooter role={role} />;
}

function MarketingFooter() {
  return (
    <>
    <WhatsAppButton />
    <footer className="footer" aria-label="Site footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-col">
            <Link href="/" className="brand" aria-label="Masani, go to home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-navy-bg.png" alt="Masani" loading="lazy" />
            </Link>
            <p>
              Personal tutoring from Nigeria&apos;s best teachers, for families
              everywhere.
            </p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li>
                <Link href="/#why">Why Masani</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/our-promise">Our promise</Link>
              </li>
              <li>
                <Link href="/guides">Guides for parents</Link>
              </li>
              <li>
                <Link href="/#contact">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Subjects</h4>
            <ul>
              {subjectOnlyPages.map((s) => (
                <li key={s.slug}>
                  <Link href={`/tutoring/${s.slug}`}>{s.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Exams</h4>
            <ul>
              {examPrepPages.map((s) => (
                <li key={s.slug}>
                  <Link href={`/tutoring/${s.slug}`}>{s.name}</Link>
                </li>
              ))}
              <li>
                <Link href="/exams">All exams</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Where we teach</h4>
            <ul>
              {countryPages.map((c) => (
                <li key={c.slug}>
                  <Link href={`/online-tutoring/${c.slug}`}>{c.areaServed}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <ul>
              <li>
                <Link href="/login">Log in</Link>
              </li>
              <li>
                <Link href="/book?source=footer">Book a free session</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Get in touch</h4>
            <ul>
              <li>
                <a href="mailto:admin@joinmasani.com">
                  admin@joinmasani.com
                </a>
              </li>
              <li>
                <a
                  href="https://joinmasani.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  joinmasani.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Masani · joinmasani.com</span>
          <span className="footer-legal">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/safeguarding">Safeguarding</Link>
          </span>
          <span>Selected for the MIT Social Innovation Fellowship, 2025</span>
        </div>
      </div>
    </footer>
    </>
  );
}

function AuthedFooter({ role }: { role?: "parent" | "admin" }) {
  const links = role === "admin" ? adminLinks : parentLinks;
  return (
    <footer className="border-t border-white/5 bg-[#020d13] p-10">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4">
        <BrandLogo mode="on-navy" size="md" />
        <ul className="flex gap-6">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-[13px] text-white/35 transition-colors hover:text-white/70"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-white/20">
          © {new Date().getFullYear()} Masani · joinmasani.com
        </p>
      </div>
    </footer>
  );
}
