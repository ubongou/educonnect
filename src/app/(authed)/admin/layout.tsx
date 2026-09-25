import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions/profile";

// Private or account pages: kept out of search results (robots.txt also
// blocks crawling them).
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireAdmin();

  return (
    <DashboardShell
      role="admin"
      displayName={profile.full_name || "Admin"}
      onLogout={logout}
    >
      {children}
    </DashboardShell>
  );
}
