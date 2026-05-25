import type { ReactNode } from "react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { requireParent, requireOnboardingComplete } from "@/lib/auth";
import { logout } from "@/lib/actions/profile";

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
