import type { ReactNode } from "react";
import { Nav } from "@/components/ui/Nav";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions/profile";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireAdmin();

  return (
    <>
      <Nav
        mode="authed"
        role="admin"
        displayName={profile.full_name ?? "Admin"}
        onLogout={logout}
      />
      <main className="min-h-screen bg-g50 pb-24 pt-12">{children}</main>
    </>
  );
}
