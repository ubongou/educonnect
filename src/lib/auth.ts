import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/db";

export type CurrentProfile = {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, email")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

/**
 * Enforces that the viewer is an authenticated parent. Redirects to
 * `/login?from=<pathname>` if signed out; renders 404 (via `notFound()`) if
 * signed in under a non-parent role so we don't leak the existence of the
 * admin area to random parents.
 */
export async function requireParent(pathname: string): Promise<CurrentProfile> {
  const profile = await getProfile();
  if (!profile) {
    redirect(`/login?from=${encodeURIComponent(pathname)}`);
  }
  if (profile.role !== "parent") {
    notFound();
  }
  return profile;
}

export async function requireAdmin(): Promise<CurrentProfile> {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login");
  }
  if (profile.role !== "admin") {
    notFound();
  }
  return profile;
}

/**
 * Must be called from within routes already gated by `requireParent`.
 * Redirects to `/onboarding` if the parent has not yet linked any child.
 */
export async function requireOnboardingComplete() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase
    .from("parent_students")
    .select("*", { count: "exact", head: true })
    .eq("parent_id", user.id);

  if (!count || count === 0) {
    redirect("/onboarding");
  }
}
