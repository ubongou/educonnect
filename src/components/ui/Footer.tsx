import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

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
  { href: "/admin/content", label: "Content" },
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
    <footer className="footer" aria-label="Site footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-col">
            <Link href="/" className="brand" aria-label="EduConnect — go to home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-v2/logo-dark.jpeg" alt="EduConnect" loading="lazy" />
            </Link>
            <p>
              Personal tutoring from Nigeria&apos;s best teachers — for families
              everywhere.
            </p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li>
                <Link href="/#why">Why EduConnect</Link>
              </li>
              <li>
                <Link href="/#about">About</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/#contact">Contact</Link>
              </li>
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
                <a href="mailto:admin@joineduconnect.com">
                  admin@joineduconnect.com
                </a>
              </li>
              <li>
                <a
                  href="https://joineduconnect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  joineduconnect.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 EduConnect · joineduconnect.com</span>
          <span>Backed by MIT</span>
        </div>
      </div>
    </footer>
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
          © 2026 EduConnect · joineduconnect.com
        </p>
      </div>
    </footer>
  );
}
