"use server";

import { createClient } from "@/lib/supabase/server";
import { presignPut } from "@/lib/r2/objects";
import { buildStorageKey } from "@/lib/uploads/keys";
import {
  intakeUploadPolicy,
  validateUpload,
} from "@/lib/uploads/policies";
import { onboardingSchema } from "@/lib/validation";
import type { IntakeFileKind } from "@/types/domain";

export type OnboardingResult =
  | { ok: true; studentId: string }
  | { ok: false; error: string };

export type IntakeFileInput = {
  studentId: string;
  kind: IntakeFileKind;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
};

export type IntakeUploadResult =
  | { ok: true; presignedPutUrl: string; storageKey: string }
  | { ok: false; error: string };

const FILE_KINDS: IntakeFileKind[] = ["curriculum", "school_report", "class_notes"];

/**
 * Onboarding submit handler: creates the student + parent link from the
 * child details and intake answers. Files are NOT sent here — a server action
 * request is capped at 1 MB (and Vercel caps any request at ~4.5 MB), so a
 * single phone photo of a school report used to make the whole registration
 * fail. The form uploads files afterwards, straight from the browser to R2,
 * via `requestIntakeFileUpload` + `recordIntakeFile`.
 */
export async function submitIntake(payload: unknown): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse(payload);
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
      p_date_of_birth: v.childInfo.date_of_birth,
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

  return { ok: true, studentId: student.id };
}

/** Shared checks for both intake-file steps: shape, policy, and parent link. */
async function checkIntakeFile(
  input: IntakeFileInput,
): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: string }
> {
  if (!input?.studentId || !FILE_KINDS.includes(input.kind)) {
    return { ok: false, error: "Invalid file details" };
  }
  const check = validateUpload(intakeUploadPolicy, {
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  });
  if (!check.ok) return check;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  const { data: link } = await supabase
    .from("parent_students")
    .select("student_id")
    .eq("student_id", input.studentId)
    .eq("parent_id", user.id)
    .maybeSingle();
  if (!link) return { ok: false, error: "Child not found" };

  return { ok: true, supabase };
}

/** Step 1 of 2: a presigned PUT URL for the browser to upload bytes to. */
export async function requestIntakeFileUpload(
  input: IntakeFileInput,
): Promise<IntakeUploadResult> {
  const check = await checkIntakeFile(input);
  if (!check.ok) return check;

  const storageKey = buildStorageKey({
    prefix: intakeUploadPolicy.prefix,
    studentId: input.studentId,
    kind: input.kind,
    filename: input.originalFilename,
    mime: input.mimeType,
  });

  try {
    const presignedPutUrl = await presignPut({
      key: storageKey,
      contentType: input.mimeType,
      contentLength: input.sizeBytes,
      ttlSeconds: 3600,
    });
    return { ok: true, presignedPutUrl, storageKey };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to prepare upload",
    };
  }
}

/**
 * Step 2 of 2: record the uploaded file once the browser PUT succeeded. The
 * row goes straight in as `ready` — there's no pending row to clean up if the
 * upload never happens. RLS (intake_files_insert_parent) is the backstop.
 */
export async function recordIntakeFile(
  input: IntakeFileInput & { storageKey: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkIntakeFile(input);
  if (!check.ok) return check;

  if (!input.storageKey?.startsWith(`${intakeUploadPolicy.prefix}/${input.studentId}/`)) {
    return { ok: false, error: "Invalid storage key" };
  }

  const { error } = await check.supabase.from("intake_files").insert({
    student_id: input.studentId,
    kind: input.kind,
    original_filename: input.originalFilename.slice(0, 255),
    storage_key: input.storageKey,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    status: "ready",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
