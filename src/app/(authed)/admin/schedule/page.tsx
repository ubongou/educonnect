import { redirect } from "next/navigation";

/**
 * The schedule page moved to /admin/sessions, which shows every session rather
 * than the next 60 and carries the filters and bulk actions. Kept as a redirect
 * so bookmarks, emailed links, and any stale `revalidatePath` targets still land
 * somewhere useful.
 */
export default function AdminScheduleRedirect() {
  redirect("/admin/sessions");
}
