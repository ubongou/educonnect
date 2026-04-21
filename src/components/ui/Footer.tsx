import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

type Mode = "marketing" | "authed";

const marketingLinks = [
  { href: "/#why", label: "Why EduConnect" },
  { href: "/#founders", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
];

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
  const links =
    mode === "marketing"
      ? marketingLinks
      : role === "admin"
        ? adminLinks
        : parentLinks;

  return (
    <footer className="border-t border-white/5 bg-[#020d13] p-10">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
        <BrandLogo mode="on-navy" size="md" />
        <ul className="flex gap-6">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-[13px] text-white/35 transition-colors hover:text-white/70">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-white/20">© 2026 EduConnect · joineduconnect.com</p>
      </div>
    </footer>
  );
}
