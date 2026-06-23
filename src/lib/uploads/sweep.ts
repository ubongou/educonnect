import { createClient } from "@/lib/supabase/server";
import { deleteR2Object } from "@/lib/r2/objects";

/**
 * Staged report attachments older than this are considered abandoned — the
 * teacher uploaded them in a composer they never submitted. The window is
 * generous so a teacher who takes a while to finish writing a report doesn't
 * lose files they're mid-way through attaching.
 */
const STALE_HOURS = 24;

/**
 * Best-effort cleanup of a teacher's abandoned `staged` attachments (row + R2
 * object). Called opportunistically when the composer loads. Scoped to the
 * caller's own rows (RLS gates the delete to `uploaded_by`), and only ever
 * touches `staged` rows — promoted attachments are `ready` and untouched.
 */
export async function sweepAbandonedAttachments(
  uploaderId: string,
): Promise<void> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - STALE_HOURS * 3600_000).toISOString();

  const { data: rows } = await supabase
    .from("teacher_materials")
    .select("id, storage_key")
    .eq("uploaded_by", uploaderId)
    .eq("status", "staged")
    .lt("uploaded_at", cutoff);

  if (!rows || rows.length === 0) return;

  const stale = rows as { id: string; storage_key: string }[];
  const { error } = await supabase
    .from("teacher_materials")
    .delete()
    .in(
      "id",
      stale.map((r) => r.id),
    );
  if (error) return; // best-effort — leave R2 objects if the row delete failed

  for (const r of stale) {
    await deleteR2Object(r.storage_key); // best-effort
  }
}
