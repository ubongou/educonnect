import { type NextRequest } from "next/server";
import { signedDownloadResponse } from "@/lib/uploads/download";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return signedDownloadResponse("teacher_materials", id, req);
}
