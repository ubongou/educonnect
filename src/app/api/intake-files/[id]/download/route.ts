import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS gates this read so parents only see their own intake_files rows.
  const { data: file } = await supabase
    .from("intake_files")
    .select("storage_path, original_filename")
    .eq("id", id)
    .single();

  if (!file) return new NextResponse("Not found", { status: 404 });

  const { data, error } = await supabase.storage
    .from("intake-files")
    .createSignedUrl(file.storage_path, 60);

  if (error || !data) {
    return new NextResponse(error?.message ?? "Signing failed", { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
