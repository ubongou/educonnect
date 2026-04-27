"use server";

import { z } from "zod";
import { sendContactMessage } from "@/lib/email/sendContactMessage";

const contactInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(200),
  subject: z.string().trim().min(2, "Please add a subject").max(200),
  message: z
    .string()
    .trim()
    .min(5, "Please write a short message")
    .max(5000, "Message is too long"),
});

export type SubmitContactMessageResult =
  | { ok: true; skipped: boolean }
  | { ok: false; error: string };

export async function submitContactMessage(
  raw: unknown,
): Promise<SubmitContactMessageResult> {
  const parsed = contactInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const result = await sendContactMessage(parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, skipped: result.skipped };
}
