import type { ReactNode } from "react";
import { Nav } from "@/components/ui/Nav";
import { requireParent, requireOnboardingComplete } from "@/lib/auth";
import { logout } from "@/lib/actions/profile";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireParent("/dashboard");
  await requireOnboardingComplete();

  return (
    <>
      <Nav
        mode="authed"
        role="parent"
        displayName={profile.full_name ?? "Parent"}
        onLogout={logout}
      />
      <main className="min-h-screen bg-g50 pb-24 pt-12">{children}</main>
    </>
  );
}
