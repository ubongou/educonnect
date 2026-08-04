"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { presignPut } from "@/lib/r2/objects";
import { buildStorageKey } from "@/lib/uploads/keys";
import { paymentProofPolicy, validateUpload } from "@/lib/uploads/policies";

export type ProofUploadRequest =
  | { ok: true; uploadUrl: string; key: string }
  | { ok: false; error: string };

export type ProofResult = { ok: true } | { ok: false; error: string };

const requestSchema = z.object({
  planId: z.string().uuid(),
  filename: z.string().min(1).max(300),
  mimeType: z.string().min(1).max(200),
  sizeBytes: z.coerce.number().int().positive(),
});

/**
 * Step 1 of the parent's proof-of-payment upload: validate against the policy
 * and hand back a presigned PUT.
 *
 * The plan is read through the caller's own client, so RLS is what proves they
 * may touch it — a parent can only ever see their own children's plans. No
 * separate ownership check is needed, and none is written here to imply
 * otherwise.
 */
export async function requestPaymentProofUpload(
  raw: unknown,
): Promise<ProofUploadRequest> {
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { planId, filename, mimeType, sizeBytes } = parsed.data;

  const valid = validateUpload(paymentProofPolicy, { mimeType, sizeBytes });
  if (!valid.ok) return valid;

  const supabase = await createClient();
  const { data: plan, error } = await supabase
    .from("payment_plans")
    .select("id, student_id, status")
    .eq("id", planId)
    .maybeSingle();

  if (error || !plan) return { ok: false, error: "Plan not found." };
  if (plan.status !== "unpaid") {
    return { ok: false, error: "That plan is already settled." };
  }

  const key = buildStorageKey({
    prefix: paymentProofPolicy.prefix,
    studentId: plan.student_id,
    kind: "proof",
    filename,
    mime: mimeType,
  });

  try {
    const uploadUrl = await presignPut({
      key,
      contentType: mimeType,
      contentLength: sizeBytes,
    });
    return { ok: true, uploadUrl, key };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Storage is not configured.",
    };
  }
}

/**
 * Step 2: record the uploaded key against the plan.
 *
 * Goes through `attach_payment_proof`, which writes only the proof columns —
 * uploading a screenshot must never be able to mark a plan paid. That stays an
 * admin decision made after the money is actually seen.
 */
export async function confirmPaymentProofUpload(
  planId: string,
  key: string,
): Promise<ProofResult> {
  if (!key.startsWith(`${paymentProofPolicy.prefix}/`)) {
    return { ok: false, error: "Unexpected storage key." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("attach_payment_proof", {
    p_plan_id: planId,
    p_key: key,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/admin/payments");
  return { ok: true };
}
