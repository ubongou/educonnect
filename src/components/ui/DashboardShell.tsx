"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Sidebar } from "./Sidebar";

type Role = "parent" | "admin" | "teacher";

function homeForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/dashboard";
}

export function DashboardShell({
  role,
  displayName,
  onLogout,
  children,
}: {
  role: Role;
  displayName: string;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      {/* Top nav — full width, overlaps sidebar */}
      <header className="sticky top-0 z-40 px-[clamp(20px,4vw,56px)] pt-[14px] pb-0">
        <div className="flex h-16 items-center gap-4 rounded-pill bg-[#3fbefa] px-[clamp(14px,3vw,22px)] shadow-[0_8px_28px_-16px_rgba(4,19,28,0.35),0_1px_0_rgba(255,255,255,0.4)_inset]">
          {/* Mobile sidebar hamburger — left side */}
          <button
            type="button"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-pill bg-white/20 md:hidden"
          >
            <span className="flex flex-col gap-[5px]">
              <span className="block h-[2px] w-[20px] rounded-sm bg-white" />
              <span className="block h-[2px] w-[20px] rounded-sm bg-white" />
              <span className="block h-[2px] w-[20px] rounded-sm bg-white" />
            </span>
          </button>

          <Link
            href={homeForRole(role)}
            aria-label="EduConnect home"
            className="shrink-0"
          >
            <BrandLogo mode="on-blue" size="md" />
          </Link>

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden font-heading text-[14px] font-medium text-[rgba(4,19,28,0.82)] md:inline">
              {displayName}
            </span>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="whitespace-nowrap rounded-pill bg-coral px-5 py-[9px] text-[14px] font-medium text-white shadow-[0_4px_12px_-4px_rgba(255,105,63,0.5)] transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-[#e85429] active:translate-y-0"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex">
        <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-x-hidden px-0 pb-0 pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
