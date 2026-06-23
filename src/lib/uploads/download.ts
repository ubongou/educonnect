import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { presignGet } from "@/lib/r2/objects";
import { contentDispositionFor } from "@/lib/r2/contentDisposition";

/**
 * Tables that store an uploaded file as `{ storage_key, original_filename,
 * mime_type }`. RLS on each table is what actually gates the read — this
 * helper only turns an already-authorised row into a short-lived presigned
 * URL, so every download route is identical apart from the table name.
 */
export type FileTable =
  | "intake_files"
  | "student_documents"
  | "teacher_materials";

/**
 * Shared implementation for `GET /api/<pipeline>/[id]/download`. Resolves the
 * RLS-gated row, then 302-redirects to a 60s presigned GET URL. Pass
 * `?disposition=attachment` to force a download instead of inline view.
 */
export async function signedDownloadResponse(
  table: FileTable,
  id: string,
  req: NextRequest,
): Promise<NextResponse> {
  const supabase = await createClient();

  const { data: file } = await supabase
    .from(table)
    .select("storage_key, original_filename, mime_type")
    .eq("id", id)
    .single();

  if (!file) return new NextResponse("Not found", { status: 404 });

  const disposition =
    req.nextUrl.searchParams.get("disposition") === "attachment"
      ? "attachment"
      : "inline";

  try {
    const url = await presignGet(file.storage_key, {
      ttlSeconds: 60,
      contentDisposition: contentDispositionFor(
        disposition,
        file.original_filename,
      ),
      contentType: file.mime_type ?? undefined,
    });
    return NextResponse.redirect(url);
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : "Failed to sign download URL",
      { status: 500 },
    );
  }
}
