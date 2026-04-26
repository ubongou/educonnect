"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sectionRegistry, type SectionId } from "@/lib/marketing/schemas";

const BUCKET = "marketing-assets";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — generous for marketing photos
const ALLOWED_MIME_PREFIXES = ["image/"] as const;

function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

function safeSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function pickExtension(filename: string, mime: string): string {
  const fromName = filename.includes(".") ? filename.split(".").pop()! : "";
  if (fromName) return fromName.toLowerCase().slice(0, 8);
  // Fall back to a sensible extension based on MIME for paste-from-clipboard
  // uploads where the File object has no name.
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/svg+xml") return "svg";
  if (mime === "image/jpeg") return "jpg";
  return "bin";
}

function randomSuffix(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export type UploadAssetResult =
  | { ok: true; storagePath: string; publicUrl: string }
  | { ok: false; error: string };

/**
 * Admin uploads a single image into the marketing-assets bucket. Returns
 * the storage path (e.g. "hero/hero-abc123.png") which the caller stores
 * in the section's JSONB. Caller is responsible for invoking
 * updateSection once the user clicks Save.
 *
 * Path layout: {section}/{slot}-{rand}.{ext}
 *
 *   section  — one of the SectionIds the form is editing
 *   slot     — a free-form label the form picks (e.g. "hero", "polaroid-0",
 *              "founder-unyime"). Slugified to be path-safe.
 *
 * We don't overwrite an existing object on the same key — every upload
 * gets a unique random suffix so cached browser copies of the prior
 * image are never invalidated unexpectedly. Old assets become orphans
 * once the section is saved with the new URL, but cleanup is out of
 * scope for v1 (small marketing surface).
 */
export async function uploadMarketingAsset(
  formData: FormData,
): Promise<UploadAssetResult> {
  await requireAdmin();

  const section = String(formData.get("section") ?? "");
  const slot = String(formData.get("slot") ?? "");
  const file = formData.get("file");

  if (!section || !(section in sectionRegistry)) {
    return { ok: false, error: "Unknown section" };
  }
  if (!slot) {
    return { ok: false, error: "Missing slot" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a file first." };
  }
  if (!isAllowedMime(file.type || "")) {
    return { ok: false, error: "Only image uploads are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB; max is ${MAX_BYTES / 1024 / 1024} MB.`,
    };
  }

  const sectionDir = safeSlug(section) || "misc";
  const slotSlug = safeSlug(slot) || "asset";
  const ext = pickExtension(file.name || "", file.type || "");
  const storagePath = `${sectionDir}/${slotSlug}-${randomSuffix()}.${ext}`;

  // Service role to bypass storage RLS — the requireAdmin() check above
  // is the gate. Same pattern as createTeacher in actions/teachers.ts.
  const admin = createServiceRoleClient();
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
      cacheControl: "31536000",
    });

  if (uploadErr) {
    return { ok: false, error: uploadErr.message };
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

  return { ok: true, storagePath, publicUrl: pub.publicUrl };
}

// -----------------------------------------------------------------------------
// updateSection — admin saves a section's JSONB content
// -----------------------------------------------------------------------------

export type UpdateSectionResult =
  | { ok: true; updatedAt: string }
  | { ok: false; error: string };

/**
 * Admin saves one section. The Zod schema for that section is the source
 * of truth — server-side re-parse rejects anything the client form failed
 * to validate. Hits the `site_sections` table (admin-only RLS), then
 * revalidates the marketing pages so the next request sees the new
 * content.
 */
export async function updateSection<Id extends SectionId>(
  sectionId: Id,
  rawContent: unknown,
): Promise<UpdateSectionResult> {
  const profile = await requireAdmin();

  const reg = sectionRegistry[sectionId];
  if (!reg) return { ok: false, error: "Unknown section" };

  const parsed = reg.schema.safeParse(rawContent);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_sections")
    .upsert(
      {
        page_slug: reg.pageSlug,
        section_key: reg.sectionKey,
        content: parsed.data as never,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page_slug,section_key" },
    )
    .select("updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to save" };
  }

  // Both marketing pages share globals + final_cta, so blanket-revalidate.
  revalidatePath("/");
  revalidatePath("/pricing");
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${sectionId}`);

  return { ok: true, updatedAt: data.updated_at };
}
