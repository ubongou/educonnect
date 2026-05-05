"use server";

import { redirect } from "next/navigation";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/server";
import { getR2Bucket, getR2Client } from "@/lib/r2/client";
import {
  intakeUploadPolicy,
  validateUpload,
} from "@/lib/uploads/policies";
import { onboardingSchema } from "@/lib/validation";
import type { IntakeFileKind } from "@/types/domain";

export type OnboardingResult = { ok: boolean; error?: string };

const FILE_KINDS: IntakeFileKind[] = ["curriculum", "school_report", "class_notes"];

/**
 * Onboarding submit handler.
 *
 * Shape of `formData`:
 *   - "payload":       JSON string matching `onboardingSchema`.
 *   - "file_curriculum"    (optional): curriculum document
 *   - "file_school_report" (optional): latest school report
 *   - "file_class_notes"   (optional): recent class notes
 *
 * Two-phase commit: the RPC atomically inserts the student + parent link,
 * THEN we upload any selected files to R2 server-side. Each file is
 * validated against `intakeUploadPolicy` (MIME allowlist + 20MB cap)
 * before bytes leave the request — failure aborts the whole submission
 * to match the prior abort-on-first-error behavior.
 */
export async function submitIntake(formData: FormData): Promise<OnboardingResult> {
  const payloadRaw = formData.get("payload");
  if (typeof payloadRaw !== "string") {
    return { ok: false, error: "Missing intake payload" };
  }

  let json: unknown;
  try {
    json = JSON.parse(payloadRaw);
  } catch {
    return { ok: false, error: "Invalid intake payload" };
  }

  const parsed = onboardingSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.length ? ` (${first.path.join(".")})` : "";
    return { ok: false, error: `${first?.message ?? "Invalid input"}${where}` };
  }

  const v = parsed.data;

  // Pre-validate every selected file BEFORE creating the student row, so a
  // bad MIME / oversized file doesn't leave a half-committed intake behind.
  const selectedFiles: { kind: IntakeFileKind; file: File }[] = [];
  for (const kind of FILE_KINDS) {
    const f = formData.get(`file_${kind}`);
    if (!(f instanceof File) || f.size === 0) continue;
    const mimeType = f.type || "application/octet-stream";
    const check = validateUpload(intakeUploadPolicy, {
      mimeType,
      sizeBytes: f.size,
    });
    if (!check.ok) {
      return { ok: false, error: `${kind}: ${check.error}` };
    }
    selectedFiles.push({ kind, file: f });
  }

  const supabase = await createClient();

  // The RPC coerces "" -> NULL internally (nullif), so empty strings here map
  // to DB nulls without needing nullable arg types in the generated signature.
  const { data: studentData, error: rpcError } = await supabase.rpc(
    "create_student_with_intake",
    {
      p_full_name: v.childInfo.full_name,
      p_preferred_name: v.childInfo.preferred_name ?? "",
      p_age: v.childInfo.age,
      p_gender: v.childInfo.gender,
      p_current_school: v.childInfo.current_school ?? "",
      p_curriculum: v.childInfo.curriculum,
      p_curriculum_other: v.childInfo.curriculum_other ?? "",
      p_intake: {
        learning_background: v.learning_background ?? {},
        strengths: v.strengths ?? {},
        challenges: v.challenges ?? {},
        motivation: v.motivation ?? {},
        behaviour: v.behaviour ?? {},
        personality: v.personality ?? {},
        goals: v.goals ?? {},
      },
    },
  );

  if (rpcError) return { ok: false, error: rpcError.message };
  // Supabase may type a row-returning RPC as T | T[]; normalise to a single row.
  const student = Array.isArray(studentData) ? studentData[0] : studentData;
  if (!student?.id) return { ok: false, error: "Student not created" };

  if (selectedFiles.length > 0) {
    const r2 = getR2Client();
    const bucket = getR2Bucket();
    if (!r2 || !bucket) {
      return { ok: false, error: "File storage is not configured" };
    }

    for (const { kind, file } of selectedFiles) {
      const ext = file.name.includes(".")
        ? (file.name.split(".").pop() ?? "").toLowerCase()
        : "";
      const suffix = ext ? `.${ext}` : "";
      const storageKey = `${intakeUploadPolicy.prefix}/${student.id}/${kind}-${crypto.randomUUID()}${suffix}`;
      const contentType = file.type || "application/octet-stream";

      try {
        const body = new Uint8Array(await file.arrayBuffer());
        await r2.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: storageKey,
            Body: body,
            ContentType: contentType,
            ContentLength: body.byteLength,
          }),
        );
      } catch (err) {
        return {
          ok: false,
          error: `${kind} upload failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }

      const { error: metaErr } = await supabase.from("intake_files").insert({
        student_id: student.id,
        kind,
        original_filename: file.name,
        storage_key: storageKey,
        mime_type: file.type || null,
        size_bytes: file.size,
        status: "ready",
      });
      if (metaErr) {
        return { ok: false, error: `${kind} record failed: ${metaErr.message}` };
      }
    }
  }

  redirect("/dashboard");
}
