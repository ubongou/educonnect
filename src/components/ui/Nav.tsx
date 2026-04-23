"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { BrandLogo } from "./BrandLogo";

const BOOKING_URL = "https://calendar.app.google/ZiNbAvQkBaYHMVY69";

type NavLink = { href: string; label: string };

const marketingLinks: NavLink[] = [
  { href: "/#why", label: "Why EduConnect" },
  { href: "/#founders", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
];

const parentLinks: NavLink[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/sessions", label: "Sessions" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/account", label: "Account" },
];

const adminLinks: NavLink[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/enrollments", label: "Enrollments" },
  { href: "/admin/schedule", label: "Schedule" },
];

const teacherLinks: NavLink[] = [
  { href: "/teacher", label: "Overview" },
  { href: "/teacher/sessions", label: "Sessions" },
  { href: "/teacher/students", label: "Students" },
  { href: "/teacher/schedule", label: "Schedule" },
];

type Role = "parent" | "admin" | "teacher";

type Props =
  | { mode: "marketing"; activeHref?: string }
  | {
      mode: "authed";
      activeHref?: string;
      role: Role;
      displayName: string;
      onLogout: () => void | Promise<void>;
    };

function homeForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/dashboard";
}

function linksForRole(role: Role): NavLink[] {
  if (role === "admin") return adminLinks;
  if (role === "teacher") return teacherLinks;
  return parentLinks;
}

export function Nav(props: Props) {
  const [open, setOpen] = useState(false);

  const links =
    props.mode === "marketing" ? marketingLinks : linksForRole(props.role);

  return (
    <div className="bg-yellow px-7 py-3">
      <nav className="mx-auto flex max-w-[1100px] items-center justify-between rounded-pill border-2 border-navy bg-blue py-2 pr-2 pl-6">
        <Link
          href={props.mode === "authed" ? homeForRole(props.role) : "/"}
          aria-label="EduConnect home"
          className="shrink-0"
        >
          <BrandLogo mode="on-blue" size="md" />
        </Link>

        <div className="ml-auto flex items-center">
          <ul className="mr-5 hidden items-center gap-7 md:flex">
            {links.map((l) => {
              const active = props.activeHref === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={clsx(
                      "text-[14px] font-semibold transition-colors",
                      active ? "text-white" : "text-navy hover:text-white",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {props.mode === "marketing" ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="text-[14px] font-semibold text-navy hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Button href={BOOKING_URL} target="_blank" size="md">
                Book a Free Session
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <span className="font-heading text-[13px] font-semibold text-navy">
                {props.displayName}
              </span>
              <Button variant="outline" size="md" onClick={() => void props.onLogout()}>
                Log out
              </Button>
            </div>
          )}

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex flex-col gap-[5px] p-1 md:hidden"
          >
            <span className="block h-[2px] w-[22px] rounded-sm bg-navy" />
            <span className="block h-[2px] w-[22px] rounded-sm bg-navy" />
            <span className="block h-[2px] w-[22px] rounded-sm bg-navy" />
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-7 mt-3 overflow-hidden rounded-lg border-2 border-navy bg-blue md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-navy/10 px-6 py-[14px] text-[15px] font-semibold text-navy last:border-b-0"
            >
              {l.label}
            </Link>
          ))}
          {props.mode === "marketing" ? (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block border-b border-navy/10 px-6 py-[14px] text-[15px] font-semibold text-navy"
              >
                Log in
              </Link>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-6 py-[14px] text-[15px] font-semibold text-navy"
              >
                Book a Free Session
              </a>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void props.onLogout();
              }}
              className="block w-full px-6 py-[14px] text-left text-[15px] font-semibold text-navy"
            >
              Log out ({props.displayName})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
