import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { presignGet } from "@/lib/r2/objects";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS gates this read: admin, parent linked via parent_students, or
  // teacher with an approved enrollment for the material's student.
  // Non-admin branches additionally filter `status = 'ready'`.
  const { data: file } = await supabase
    .from("teacher_materials")
    .select("storage_key, original_filename")
    .eq("id", id)
    .single();

  if (!file) return new NextResponse("Not found", { status: 404 });

  try {
    const url = await presignGet(file.storage_key, 60);
    return NextResponse.redirect(url);
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : "Failed to sign download URL",
      { status: 500 },
    );
  }
}
