import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth";

/**
 * Legacy per-report route. Parents read reports inline on the Sessions page
 * (that's where the report email and the Overview card point), so this just
 * forwards there — the Sessions page resolves the owning child from `?report=`.
 * Kept as a redirect so any old links / bookmarks still land in the right place.
 */
export default async function ParentReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireParent("/dashboard");
  const { id } = await params;
  redirect(`/dashboard/sessions?report=${id}`);
}
