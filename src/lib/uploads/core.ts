import { createClient } from "@/lib/supabase/server";
import { deleteR2Object, presignPut } from "@/lib/r2/objects";
import { buildStorageKey } from "./keys";
import { validateUpload, type UploadPolicy } from "./policies";

/**
 * Shared engine behind the two browser-PUT upload pipelines (parent
 * `student_documents` and teacher `teacher_materials`). Both follow the same
 * three-step flow — request a presigned PUT, upload bytes from the browser,
 * then confirm — and previously kept near-identical copies of it. The only
 * real differences are the table, the policy, the auth check, and a couple of
 * extra columns; those are supplied via {@link UploadActionConfig}.
 *
 * This module is intentionally NOT a `"use server"` file: server actions are
 * the thin per-pipeline wrappers that bind a config and call these helpers.
 */

type Client = Awaited<ReturnType<typeof createClient>>;

/** Fields every upload request carries, regardless of pipeline. */
export type BaseUploadInput = {
  studentId: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
};

export type UploadActionConfig<T extends BaseUploadInput> = {
  table: "student_documents" | "teacher_materials";
  policy: UploadPolicy;
  /** Validate raw input shape (Zod) into the typed payload. */
  parse: (raw: unknown) => { ok: true; data: T } | { ok: false; error: string };
  /**
   * Authorise the caller for this student. Return ok:false to reject with a
   * user-facing message. RLS is still the backstop on insert/update.
   */
  authorize: (args: {
    supabase: Client;
    userId: string;
    role: string;
    parsed: T;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Extra columns to merge into the insert (e.g. enrollment_id, note). */
  extraInsert?: (parsed: T) => Record<string, unknown>;
  /**
   * Status to set on confirm. Defaults to `"ready"` (visible to the parent).
   * Report attachments use `"staged"` — confirmed but hidden until the report
   * they belong to is sent, at which point they're promoted to `"ready"`.
   */
  confirmStatus?: "ready" | "staged";
  /** Paths to revalidate after confirm/delete. */
  revalidate: (studentId: string) => void;
  /** Side effect after a successful confirm (e.g. notify parent). Non-fatal. */
  onConfirmed?: (id: string, studentId: string) => Promise<void>;
};

export type RequestUploadResult =
  | { ok: true; id: string; presignedPutUrl: string; storageKey: string }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };

/** Caller's id + role, or null when signed out / profile missing. */
export async function getCurrentUserRole(
  supabase: Client,
): Promise<{ userId: string; role: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return { userId: user.id, role: profile.role as string };
}

/**
 * Step 1 of 3: validate, authorise, insert a `pending` metadata row, and
 * return a presigned PUT URL for the browser to upload bytes to.
 */
export async function requestUpload<T extends BaseUploadInput>(
  config: UploadActionConfig<T>,
  raw: unknown,
): Promise<RequestUploadResult> {
  const parsed = config.parse(raw);
  if (!parsed.ok) return parsed;

  const policyCheck = validateUpload(config.policy, {
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
  });
  if (!policyCheck.ok) return policyCheck;

  const supabase = await createClient();
  const ctx = await getCurrentUserRole(supabase);
  if (!ctx) return { ok: false, error: "Auth required" };

  const auth = await config.authorize({
    supabase,
    userId: ctx.userId,
    role: ctx.role,
    parsed: parsed.data,
  });
  if (!auth.ok) return auth;

  const storageKey = buildStorageKey({
    prefix: config.policy.prefix,
    studentId: parsed.data.studentId,
    kind: parsed.data.kind,
    filename: parsed.data.originalFilename,
    mime: parsed.data.mimeType,
  });

  const insertRow = {
    student_id: parsed.data.studentId,
    uploaded_by: ctx.userId,
    kind: parsed.data.kind,
    original_filename: parsed.data.originalFilename.slice(0, 255),
    storage_key: storageKey,
    mime_type: parsed.data.mimeType,
    size_bytes: parsed.data.sizeBytes,
    status: "pending",
    ...(config.extraInsert?.(parsed.data) ?? {}),
  };

  // Dynamic table name forces a cast — the row shape is validated above and
  // RLS is the authoritative gate on the write.
  const { data: inserted, error: insertErr } = await supabase
    .from(config.table)
    .insert(insertRow as never)
    .select("id")
    .single<{ id: string }>();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "Failed to record file" };
  }

  let presignedPutUrl: string;
  try {
    presignedPutUrl = await presignPut({
      key: storageKey,
      contentType: parsed.data.mimeType,
      contentLength: parsed.data.sizeBytes,
      ttlSeconds: 3600,
    });
  } catch (err) {
    // Roll back so we don't leak a permanently-pending row.
    await supabase.from(config.table).delete().eq("id", inserted.id);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to presign upload URL",
    };
  }

  return { ok: true, id: inserted.id, presignedPutUrl, storageKey };
}

/**
 * Step 3 of 3: flip `pending` → `ready` so the row becomes visible in read
 * queries, then run the optional `onConfirmed` side effect (non-fatal).
 */
export async function confirmUpload<T extends BaseUploadInput>(
  config: UploadActionConfig<T>,
  id: string,
): Promise<SimpleResult> {
  if (!id) return { ok: false, error: "Missing file id" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(config.table)
    .update({ status: config.confirmStatus ?? "ready" } as never)
    .eq("id", id)
    .eq("status", "pending")
    .select("student_id")
    .single<{ student_id: string }>();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "File not found or already confirmed",
    };
  }

  config.revalidate(data.student_id);

  if (config.onConfirmed) {
    // Never fail the upload because a follow-up side effect (email) failed.
    try {
      await config.onConfirmed(id, data.student_id);
    } catch {
      /* swallowed — confirm already succeeded */
    }
  }

  return { ok: true };
}

/**
 * Best-effort cleanup when the browser-side PUT fails: delete the pending row
 * and its (likely-orphaned) R2 object. Refuses to touch confirmed rows.
 */
export async function cancelUpload<T extends BaseUploadInput>(
  config: UploadActionConfig<T>,
  id: string,
): Promise<SimpleResult> {
  if (!id) return { ok: false, error: "Missing file id" };
  const supabase = await createClient();

  const { data: row } = await supabase
    .from(config.table)
    .select("storage_key, status")
    .eq("id", id)
    .maybeSingle<{ storage_key: string; status: string }>();

  if (!row) return { ok: true }; // nothing to clean — treat as success
  if (row.status !== "pending") {
    return { ok: false, error: "File is already confirmed" };
  }

  const { error: delRowErr } = await supabase
    .from(config.table)
    .delete()
    .eq("id", id);
  if (delRowErr) return { ok: false, error: delRowErr.message };

  await deleteR2Object(row.storage_key); // best-effort
  return { ok: true };
}

/** Hard delete of a confirmed file — row first, then R2 object. */
export async function deleteUpload<T extends BaseUploadInput>(
  config: UploadActionConfig<T>,
  id: string,
): Promise<SimpleResult> {
  if (!id) return { ok: false, error: "Missing file id" };
  const supabase = await createClient();

  const { data: row } = await supabase
    .from(config.table)
    .select("student_id, storage_key")
    .eq("id", id)
    .maybeSingle<{ student_id: string; storage_key: string }>();

  if (!row) return { ok: false, error: "File not found" };

  const { error: delRowErr } = await supabase
    .from(config.table)
    .delete()
    .eq("id", id);
  if (delRowErr) return { ok: false, error: delRowErr.message };

  await deleteR2Object(row.storage_key); // best-effort

  config.revalidate(row.student_id);
  return { ok: true };
}
