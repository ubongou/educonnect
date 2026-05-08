"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";
import type { Role } from "@/types/domain";

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`;
  return process.env.APP_URL ?? "";
}

export type AuthActionState = { ok: boolean; error?: string } | null;

export async function login(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session not established" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, deactivated_at")
    .eq("id", user.id)
    .single();

  if (profile?.deactivated_at) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "This account has been deactivated. Contact your admin.",
    };
  }

  const role = profile?.role as Role | undefined;
  redirect(
    role === "admin"
      ? "/admin"
      : role === "teacher"
        ? "/teacher"
        : "/dashboard",
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, error: "Email is required" };

  const supabase = await createClient();
  const origin = await requestOrigin();
  const redirectTo = `${origin}/auth/callback?next=/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function resetPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Reset link expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  await supabase.auth.signOut();
  redirect("/login?reset=1");
}

export async function updateProfile(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!full_name) return { ok: false, error: "Full name is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone: phone || null })
    .eq("id", user.id);

  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function changePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { ok: false, error: error.message } : { ok: true };
}
