"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/server/requestOrigin";
import { loginSchema } from "@/lib/validation";
import type { Role } from "@/types/domain";

export type AuthActionState = { ok: boolean; error?: string; email?: string } | null;

/**
 * Where to land after sign-in. Accepts only a same-site absolute path, so a
 * crafted `?from=` can't bounce someone to another origin. Everything else
 * falls back to the role's home.
 */
function safeRedirectTarget(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return null;
  }
  return raw;
}

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
  const home =
    role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/dashboard";

  // A parent who followed a homework link from an email lands back on the file
  // (or the report) instead of a bare dashboard.
  redirect(safeRedirectTarget(formData.get("from")) ?? home);
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
  return error ? { ok: false, error: error.message } : { ok: true, email };
}

/**
 * Step two of forgot-password: the parent types the code from the reset email
 * and a new password on the same page. No link to open, so it works whatever
 * device or mail app the email is read on, and a mail scanner pre-opening the
 * link can't use it up.
 */
export async function resetPasswordWithCode(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").replace(/\s+/g, "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!email) return { ok: false, error: "Email is required", email };
  if (!/^\d{6,10}$/.test(code)) {
    return { ok: false, error: "Enter the code from the email (numbers only).", email };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters", email };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match", email };
  }

  const supabase = await createClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "recovery",
  });
  if (verifyErr) {
    return {
      ok: false,
      error: "That code is wrong or has expired. Check the latest email, or send a new code.",
      email,
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message, email };

  await supabase.auth.signOut();
  redirect(`/login?reset=1&email=${encodeURIComponent(email)}`);
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
