import { createServiceRoleClient } from "@/lib/supabase/server";
import { defaultGlobals } from "@/lib/marketing/defaults";
import { formatDate } from "@/lib/format";
import { getAppUrl, getFromAddress, getResend } from "./client";

/**
 * Tells the office a teacher has confirmed a package complete — the "time to
 * bill this family" signal. Admin-only and separate from the parent renewal
 * reminders (`payment_reminders`), which keep doing their own job: this never
 * goes to a parent and carries no money.
 *
 * Sent once per confirmation. A package only comes back to "complete" after
 * the office returns it and the teacher re-confirms, which is a new event
 * worth a new email.
 *
 * Best-effort: skipped without RESEND_API_KEY; the package is on the admin
 * Packages page either way.
 */
export async function sendPackageCompleteEmail(packageId: string): Promise<void> {
  const resend = getResend();
  const adminEmail = defaultGlobals.adminEmail;
  if (!resend || !adminEmail) return;

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("teacher_packages")
    .select(
      `
      id, size, completion_note,
      teacher:profiles!teacher_packages_teacher_id_fkey ( full_name ),
      students ( full_name, preferred_name ),
      enrollments ( subjects ( name ) ),
      lessons:teacher_package_sessions ( sessions ( session_date, status ) )
      `,
    )
    .eq("id", packageId)
    .maybeSingle();
  if (!data) return;

  const pkg = data as unknown as {
    size: number;
    completion_note: string | null;
    teacher: { full_name: string | null } | null;
    students: { full_name: string; preferred_name: string | null } | null;
    enrollments: { subjects: { name: string } | null } | null;
    lessons: Array<{ sessions: { session_date: string; status: string } | null }>;
  };

  const child = pkg.students?.preferred_name ?? pkg.students?.full_name ?? "A child";
  const subject = pkg.enrollments?.subjects?.name ?? "lessons";
  const teacher = pkg.teacher?.full_name ?? "A teacher";
  const lessons = pkg.lessons
    .map((l) => l.sessions)
    .filter((s): s is { session_date: string; status: string } => s !== null)
    .sort((a, b) => a.session_date.localeCompare(b.session_date));
  const lines = lessons.map(
    (s) => `${formatDate(s.session_date)} — ${s.status === "no_show" ? "No-show" : "Taught"}`,
  );
  const url = `${getAppUrl().replace(/\/$/, "")}/admin/packages`;
  const subjectLine = `${teacher} confirmed ${child}'s ${subject} package complete (${lessons.length} of ${pkg.size})`;

  const text = [
    subjectLine,
    pkg.completion_note ? `Teacher's note: ${pkg.completion_note}` : null,
    "",
    ...lines,
    "",
    `Review it: ${url}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#04131C;background:#FBF9F4;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5e1d8;border-radius:18px;padding:32px;">
          <p style="margin:0 0 12px;font-size:15px;line-height:1.55;font-weight:600;">${esc(subjectLine)}</p>
          ${pkg.completion_note ? `<p style="margin:0 0 16px;font-size:14px;color:#6b7680;">Teacher's note: ${esc(pkg.completion_note)}</p>` : ""}
          <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;">
            ${lines.map((l) => `<li>${esc(l)}</li>`).join("\n")}
          </ul>
          <p style="margin:24px 0 0;"><a href="${esc(url)}" style="color:#2451E0;font-weight:600;">Review packages</a></p>
        </div>
      </body>
    </html>`;

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: adminEmail,
      subject: subjectLine,
      html,
      text,
    });
  } catch {
    // The package is on the admin page regardless.
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
