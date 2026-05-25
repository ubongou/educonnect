import type { ReactNode } from "react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { requireTeacher } from "@/lib/auth";
import { logout } from "@/lib/actions/profile";

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
