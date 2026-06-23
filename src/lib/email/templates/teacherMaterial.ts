export type TeacherMaterialEmailData = {
  parentFirstName: string | null;
  studentName: string;
  teacherName: string | null;
  kindLabel: string;
  originalFilename: string;
  note: string | null;
  /** Parent dashboard link (deep-linked to the child's documents tab). */
  documentsUrl: string;
};

const BRAND_NAVY = "#04131C";
const BRAND_BLUE = "#3EBEFF";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Email a parent when a teacher shares a new material/file. Deliberately
 * does NOT attach the file — it links back to the dashboard where the
 * RLS-gated, presigned download lives.
 */
export function renderTeacherMaterialEmail(data: TeacherMaterialEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const teacher = data.teacherName ?? "Your child's teacher";
  const subject = `${teacher} shared a ${data.kindLabel.toLowerCase()} for ${data.studentName}`;

  const greeting = data.parentFirstName
    ? `Hi ${escapeHtml(data.parentFirstName)},`
    : "Hi there,";

  const noteBlock = data.note
    ? `<tr><td style="padding:0 0 20px;">
         <p style="margin:0 0 4px;font:700 11px Arial,sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#8A93A0;">A note from ${escapeHtml(teacher)}</p>
         <p style="margin:0;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};font-style:italic;">${escapeHtml(data.note)}</p>
       </td></tr>`
    : "";

  const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;background:#F1F2F4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F2F4;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="background:${BRAND_NAVY};height:6px;line-height:0;font-size:0;">&nbsp;</td></tr>
          <tr><td style="padding:28px 32px 8px;">
            <p style="margin:0 0 14px;font:400 14px Arial,sans-serif;color:${BRAND_NAVY};">${greeting}</p>
            <p style="margin:0;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">
              ${escapeHtml(teacher)} has just shared a new ${escapeHtml(data.kindLabel.toLowerCase())} for
              <strong>${escapeHtml(data.studentName)}</strong>.
            </p>
          </td></tr>
          <tr><td style="padding:18px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F8FA;border:1px solid #E3E6EA;border-radius:12px;">
              <tr><td style="padding:14px 16px;font:600 14px Arial,sans-serif;color:${BRAND_NAVY};">
                📄 ${escapeHtml(data.originalFilename)}
                <span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:99px;background:#EEF1F4;font:700 11px Arial,sans-serif;color:#5C6770;">${escapeHtml(data.kindLabel)}</span>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:20px 32px 0;">${""}</td></tr>
          <tr><td style="padding:0 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="border-radius:99px;background:${BRAND_BLUE};">
                <a href="${data.documentsUrl}" style="display:inline-block;padding:12px 26px;font:700 14px Arial,sans-serif;color:${BRAND_NAVY};text-decoration:none;">View it on your dashboard</a>
              </td>
            </tr></table>
          </td></tr>
          ${noteBlock ? `<tr><td style="padding:22px 32px 0;"><table role="presentation" width="100%">${noteBlock}</table></td></tr>` : ""}
          <tr><td style="padding:24px 32px 30px;">
            <p style="margin:0;font:400 12px Arial,sans-serif;line-height:1.5;color:#8A93A0;">
              You're receiving this because you're listed as a parent on ${escapeHtml(data.studentName)}'s account.
              Reply to this email any time — we read every message.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    greeting,
    "",
    `${teacher} has just shared a new ${data.kindLabel.toLowerCase()} for ${data.studentName}.`,
    "",
    `File: ${data.originalFilename} (${data.kindLabel})`,
    data.note ? `\nNote from ${teacher}:\n${data.note}\n` : "",
    `View it on your dashboard: ${data.documentsUrl}`,
    "",
    "— Masani",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
