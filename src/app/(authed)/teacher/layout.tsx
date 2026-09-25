import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { requireTeacher } from "@/lib/auth";
import { logout } from "@/lib/actions/profile";

// Private or account pages: kept out of search results (robots.txt also
// blocks crawling them).
export const metadata: Metadata = {
  title: "Teacher",
  robots: { index: false, follow: false },
};

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const profile = await requireTeacher();

  return (
    <DashboardShell
      role="teacher"
      displayName={profile.full_name || "Teacher"}
      onLogout={logout}
    >
      {children}
    </DashboardShell>
  );
}
