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
 *
 * These URLs go out in emails, so they're often opened by someone who isn't
 * signed in on that device — RLS then hides the row and the lookup comes back
 * empty. That's a login problem, not a missing file, so we bounce to /login
 * carrying the original URL rather than showing a bare "Not found".
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

  if (!file) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set(
        "from",
        `${req.nextUrl.pathname}${req.nextUrl.search}`,
      );
      return NextResponse.redirect(loginUrl);
    }

    // Signed in and still nothing: the row is gone (removed from the report)
    // or belongs to somebody else's child.
    return new NextResponse(
      "This file is no longer available. It may have been removed from the report — ask your teacher to re-send it.",
      { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  // Link-only attachments (e.g. an online quiz) have no stored file to sign.
  if (!file.storage_key) return new NextResponse("Not a file", { status: 404 });

  const disposition =
    req.nextUrl.searchParams.get("disposition") === "attachment"
      ? "attachment"
      : "inline";

  try {
    const url = await presignGet(file.storage_key, {
      ttlSeconds: 60,
      contentDisposition: contentDispositionFor(
        disposition,
        file.original_filename ?? "download",
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
