import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { requireParent, requireOnboardingComplete } from "@/lib/auth";
import { logout } from "@/lib/actions/profile";

// Private or account pages: kept out of search results (robots.txt also
// blocks crawling them).
export const metadata: Metadata = {
  title: "Parent dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireParent("/dashboard");
  await requireOnboardingComplete();

  return (
    <DashboardShell
      role="parent"
      displayName={profile.full_name || "Parent"}
      onLogout={logout}
    >
      {children}
    </DashboardShell>
  );
}
