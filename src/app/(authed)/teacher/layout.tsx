import type { ReactNode } from "react";
import { Nav } from "@/components/ui/Nav";
import { requireTeacher } from "@/lib/auth";
import { logout } from "@/lib/actions/profile";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const profile = await requireTeacher();

  return (
    <>
      <Nav
        mode="authed"
        role="teacher"
        displayName={profile.full_name || "Teacher"}
        onLogout={logout}
      />
      <main className="min-h-screen bg-g50 pb-24 pt-24">{children}</main>
    </>
  );
}
