"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
 * THEN we upload any selected files using the caller's user-scoped Supabase
 * client. Storage RLS gates writes to the student's own folder.
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

  for (const kind of FILE_KINDS) {
    const file = formData.get(`file_${kind}`);
    if (!(file instanceof File) || file.size === 0) continue;

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${student.id}/${kind}-${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("intake-files")
      .upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (upErr) return { ok: false, error: `${kind} upload failed: ${upErr.message}` };

    const { error: metaErr } = await supabase.from("intake_files").insert({
      student_id: student.id,
      kind,
      original_filename: file.name,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
    });
    if (metaErr) {
      return { ok: false, error: `${kind} record failed: ${metaErr.message}` };
    }
  }

  redirect("/dashboard");
}
