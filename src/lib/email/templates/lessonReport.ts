import { confidenceBadge, understandingBadge } from "@/lib/scales";

export type LessonReportEmailData = {
  parentFirstName: string | null;
  studentName: string;
  subjectName: string;
  teacherName: string | null;
  lessonDate: string; // ISO date
  lessonFocus: string;
  understanding: number; // 1..10
  confidence: number; // 1..10
  participation: number; // 0..10
  focus: number; // 0..10
  homework: number; // 0..10
  nextFocus: string | null;
  howToHelpAtHome: string | null;
  reportUrl: string;
};

const BRAND_NAVY = "#04131C";
const BRAND_YELLOW = "#FCB936";
const BRAND_BLUE = "#3EBEFF";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pillStyle(tone: "gray" | "amber" | "green"): string {
  if (tone === "green")
    return `background:#E6F7EE;color:#0F7A3C;border:1px solid #BFE9CE;`;
  if (tone === "amber")
    return `background:#FFF4D6;color:#8A5A00;border:1px solid #F2D58F;`;
  return `background:#F1F2F4;color:#5C6770;border:1px solid #DDE1E5;`;
}

function behaviourRow(label: string, value: number): string {
  const pct = Math.max(0, Math.min(100, Math.round((value / 10) * 100)));
  return `
    <tr>
      <td style="padding:6px 0;font:600 13px Arial,sans-serif;color:${BRAND_NAVY};width:55%;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;width:45%;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background:#EEF1F4;border-radius:99px;height:8px;line-height:0;font-size:0;">
              <div style="height:8px;width:${pct}%;background:${BRAND_YELLOW};border-radius:99px;"></div>
            </td>
            <td width="36" align="right" style="font:700 13px Arial,sans-serif;color:${BRAND_NAVY};padding-left:10px;white-space:nowrap;">${value}/10</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderLessonReportEmail(data: LessonReportEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const u = understandingBadge(data.understanding);
  const c = confidenceBadge(data.confidence);

  const subject = `Lesson report — ${data.studentName} · ${data.subjectName} · ${fmtDate(data.lessonDate)}`;

  const greeting = data.parentFirstName
    ? `Hi ${escapeHtml(data.parentFirstName)},`
    : "Hi,";

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F6F7F9;font-family:Arial,Helvetica,sans-serif;color:${BRAND_NAVY};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F6F7F9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(4,19,28,0.06);">
            <tr>
              <td style="background:${BRAND_NAVY};padding:22px 28px;">
                <p style="margin:0;font:800 14px Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_YELLOW};">EduConnect</p>
                <p style="margin:6px 0 0;font:800 22px Arial,sans-serif;color:#ffffff;">New lesson report</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 12px;font:400 15px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">
                  ${greeting}
                </p>
                <p style="margin:0 0 20px;font:400 15px Arial,sans-serif;line-height:1.6;color:#3A4750;">
                  ${escapeHtml(data.teacherName ?? "Your child's teacher")} has just shared a new lesson report for
                  <strong>${escapeHtml(data.studentName)}</strong>.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND_NAVY};border-radius:10px;color:#ffffff;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0;font:800 12px Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND_YELLOW};">${escapeHtml(fmtDate(data.lessonDate))}</p>
                      <p style="margin:6px 0 0;font:800 18px Arial,sans-serif;color:#ffffff;line-height:1.35;">${escapeHtml(data.lessonFocus)}</p>
                      <p style="margin:6px 0 0;font:400 12px Arial,sans-serif;color:rgba(255,255,255,0.65);">${escapeHtml(data.subjectName)}${data.teacherName ? ` · ${escapeHtml(data.teacherName)}` : ""}</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;">
                  <tr>
                    <td width="50%" valign="top" style="padding-right:8px;">
                      <p style="margin:0;font:700 11px Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase;color:#7A8690;">Understanding</p>
                      <p style="margin:6px 0 8px;font:800 22px Arial,sans-serif;color:${BRAND_NAVY};">${data.understanding}<span style="font:600 13px Arial,sans-serif;color:#7A8690;"> / 10</span></p>
                      <span style="display:inline-block;padding:4px 10px;border-radius:99px;font:700 11px Arial,sans-serif;${pillStyle(u.tone)}">${escapeHtml(u.label)}</span>
                    </td>
                    <td width="50%" valign="top" style="padding-left:8px;">
                      <p style="margin:0;font:700 11px Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase;color:#7A8690;">Confidence</p>
                      <p style="margin:6px 0 8px;font:800 22px Arial,sans-serif;color:${BRAND_NAVY};">${data.confidence}<span style="font:600 13px Arial,sans-serif;color:#7A8690;"> / 10</span></p>
                      <span style="display:inline-block;padding:4px 10px;border-radius:99px;font:700 11px Arial,sans-serif;${pillStyle(c.tone)}">${escapeHtml(c.label)}</span>
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 8px;font:800 11px Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#7A8690;">Learning behaviours</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #EEF1F4;">
                  ${behaviourRow("Participation", data.participation)}
                  ${behaviourRow("Focus and attention", data.focus)}
                  ${behaviourRow("Homework completion", data.homework)}
                </table>

                ${data.nextFocus ? `
                <p style="margin:24px 0 6px;font:800 11px Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#7A8690;">Next focus</p>
                <p style="margin:0;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">${escapeHtml(data.nextFocus)}</p>
                ` : ""}

                ${data.howToHelpAtHome ? `
                <p style="margin:20px 0 6px;font:800 11px Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#7A8690;">Help at home</p>
                <p style="margin:0;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">${escapeHtml(data.howToHelpAtHome)}</p>
                ` : ""}

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:28px;">
                  <tr>
                    <td align="left">
                      <a href="${escapeHtml(data.reportUrl)}" style="display:inline-block;background:${BRAND_BLUE};color:${BRAND_NAVY};font:800 13px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:99px;border:2px solid ${BRAND_NAVY};">View the full report</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#F6F7F9;border-top:1px solid #EEF1F4;">
                <p style="margin:0;font:400 12px Arial,sans-serif;color:#7A8690;line-height:1.5;">
                  You're receiving this because you're listed as a parent on ${escapeHtml(data.studentName)}'s account.
                  Reply to this email any time — we read every message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${greeting.replace(/<[^>]+>/g, "")}`,
    "",
    `${data.teacherName ?? "Your child's teacher"} has just shared a new lesson report for ${data.studentName}.`,
    "",
    `${fmtDate(data.lessonDate)} — ${data.lessonFocus}`,
    `${data.subjectName}${data.teacherName ? ` · ${data.teacherName}` : ""}`,
    "",
    `Understanding: ${data.understanding}/10 (${u.label})`,
    `Confidence:    ${data.confidence}/10 (${c.label})`,
    "",
    `Participation: ${data.participation}/10`,
    `Focus:         ${data.focus}/10`,
    `Homework:      ${data.homework}/10`,
    "",
    data.nextFocus ? `Next focus:\n${data.nextFocus}\n` : "",
    data.howToHelpAtHome ? `Help at home:\n${data.howToHelpAtHome}\n` : "",
    `View the full report: ${data.reportUrl}`,
    "",
    "— EduConnect",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
