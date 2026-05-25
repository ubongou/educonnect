import type { ReactNode } from "react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions/profile";

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
