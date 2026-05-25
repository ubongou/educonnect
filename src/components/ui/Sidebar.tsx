"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type Role = "parent" | "admin" | "teacher";

type SidebarLink = { href: string; label: string; icon: React.ReactNode };

const parentLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Overview", icon: <IconGrid /> },
  { href: "/dashboard/sessions", label: "Sessions", icon: <IconCalendar /> },
  { href: "/dashboard/documents", label: "Documents", icon: <IconFile /> },
  { href: "/dashboard/account", label: "Account", icon: <IconUser /> },
];

const teacherLinks: SidebarLink[] = [
  { href: "/teacher", label: "Overview", icon: <IconGrid /> },
  { href: "/teacher/sessions", label: "Sessions", icon: <IconCalendar /> },
  { href: "/teacher/students", label: "Students", icon: <IconUsers /> },
  { href: "/teacher/schedule", label: "Schedule", icon: <IconClock /> },
];

const adminLinks: SidebarLink[] = [
  { href: "/admin", label: "Overview", icon: <IconGrid /> },
  { href: "/admin/students", label: "Students", icon: <IconUsers /> },
  { href: "/admin/parents", label: "Parents", icon: <IconHeart /> },
  { href: "/admin/teachers", label: "Teachers", icon: <IconGrad /> },
  { href: "/admin/enrollments", label: "Enrollments", icon: <IconClipboard /> },
  { href: "/admin/schedule", label: "Schedule", icon: <IconClock /> },
  { href: "/admin/content", label: "Content", icon: <IconPencil /> },
];

function linksForRole(role: Role): SidebarLink[] {
  if (role === "admin") return adminLinks;
  if (role === "teacher") return teacherLinks;
  return parentLinks;
}

function rootForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/dashboard";
}

function isActive(href: string, pathname: string, role: Role): boolean {
  const root = rootForRole(role);
  if (href === root) return pathname === root;
  return pathname.startsWith(href);
}

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const links = linksForRole(role);

  const nav = (
    <nav className="flex flex-col gap-1 px-4 pt-6" aria-label="Dashboard navigation">
      {links.map((l) => {
        const active = isActive(l.href, pathname, role);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClose}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
              active
                ? "bg-paper text-navy"
                : "text-[#6b7680] hover:bg-paper hover:text-navy",
            )}
          >
            <span className="w-6 shrink-0">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[240px] md:shrink-0 md:flex-col border-r border-line bg-white">
        <div className="border-l-4 border-coral flex flex-1 flex-col">
          {nav}
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-navy/30"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] animate-fade-up border-r border-line bg-white shadow-[6px_0_20px_rgba(4,19,28,0.12)]">
            <div className="border-l-4 border-coral flex h-full flex-col">
              {nav}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

/* ── Inline SVG icons (24×24, stroke style matching marketing) ── */

const s = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function IconGrid() {
  return (
    <svg {...s}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg {...s}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg {...s}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg {...s}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg {...s}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg {...s}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg {...s}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconGrad() {
  return (
    <svg {...s}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg {...s}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg {...s}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
