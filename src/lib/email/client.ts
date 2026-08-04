import { Resend } from "resend";
import { defaultGlobals } from "@/lib/marketing/defaults";

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
    process.env.RESEND_FROM_EMAIL ?? "Masani <onboarding@resend.dev>"
  );
}

/**
 * Where replies to a parent-facing email should land.
 *
 * The From address is a no-reply mailbox, so without an explicit Reply-To a
 * parent hitting reply is writing into a void — while our own footers invite
 * them to do exactly that ("Reply to this email any time — we read every
 * message"). Pointing Reply-To at the monitored admin inbox is what makes that
 * promise true.
 *
 * Admin-facing emails (contact, booking, lead failures) set their own Reply-To
 * to the person who got in touch, and must not use this.
 */
export function getReplyToAddress(): string {
  return process.env.RESEND_REPLY_TO_EMAIL ?? defaultGlobals.adminEmail;
}

export function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}
