import { Resend } from "resend";

let cached: Resend | null = null;

/**
 * Lazy Resend singleton. Returns null when RESEND_API_KEY isn't set so
 * local dev / preview deploys without the secret can still run — callers
 * must treat null as "skip send".
 */
export function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ?? "masani <onboarding@resend.dev>"
  );
}

export function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}
