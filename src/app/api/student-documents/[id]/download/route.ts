import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS gates this read: parents see their own child's docs, assigned
  // teachers see the docs for students they're teaching, admins see all.
  const { data: file } = await supabase
    .from("student_documents")
    .select("storage_path, original_filename")
    .eq("id", id)
    .single();

  if (!file) return new NextResponse("Not found", { status: 404 });

  const { data, error } = await supabase.storage
    .from("student-documents")
    .createSignedUrl(file.storage_path, 60);

  if (error || !data) {
    return new NextResponse(error?.message ?? "Signing failed", { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
