import { defaultGlobals } from "@/lib/marketing/defaults";
import { formatBirthdayDay, whenLabel, type ReminderKind } from "@/lib/birthdays";
import { getAppUrl, getFromAddress, getResend } from "./client";

export type BirthdayReminderInput = {
  kind: ReminderKind;
  childName: string;
  /** The birthday itself, YYYY-MM-DD. */
  birthday: string;
  daysUntil: number;
  turning: number;
  subjects: string[];
  teachers: Array<{ email: string; fullName: string | null }>;
};

export type BirthdayReminderResult =
  | { ok: true; recipients: string[] }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; error: string };

/**
 * One reminder for one child's birthday, to every teacher currently teaching
 * them with the office copied in — the same email for both, as asked. A child
 * with no teacher yet still reaches the office.
 *
 * Never includes the birth year: teachers get the day and the age only.
 */
export async function sendBirthdayReminderEmail(
  input: BirthdayReminderInput,
): Promise<BirthdayReminderResult> {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true, reason: "Email isn't configured" };

  const adminEmail = defaultGlobals.adminEmail;
  const teacherEmails = [...new Set(input.teachers.map((t) => t.email.toLowerCase()))];
  const to = teacherEmails.length > 0 ? teacherEmails : adminEmail ? [adminEmail] : [];
  const cc = teacherEmails.length > 0 && adminEmail ? [adminEmail] : undefined;
  if (to.length === 0) return { ok: false, skipped: true, reason: "No one to send to" };

  const day = formatBirthdayDay(input.birthday);
  const when = whenLabel(input.daysUntil);
  const subject =
    input.kind === "day_before" && input.daysUntil <= 1
      ? `🎂 ${input.childName} turns ${input.turning} ${when}`
      : `🎂 ${input.childName}'s birthday is ${when} (${day})`;

  const greeting =
    input.teachers.length === 1 && input.teachers[0].fullName
      ? `Hi ${input.teachers[0].fullName.split(" ")[0]},`
      : "Hi,";
  const subjectLine = input.subjects.length > 0 ? ` (${input.subjects.join(", ")})` : "";
  const lead = `${input.childName}${subjectLine} turns ${input.turning} on ${day} — ${when}.`;
  const nudge =
    input.kind === "week_before"
      ? "A week's notice so there's time to plan a little something — a happy-birthday message in a lesson that week goes a long way."
      : "Don't forget to wish them a happy birthday in your next lesson or message.";
  const noTeacher =
    teacherEmails.length === 0 ? "This child has no teacher assigned at the moment." : null;
  const url = `${getAppUrl().replace(/\/$/, "")}/login`;

  const text = [greeting, "", lead, "", nudge, noTeacher, "", url]
    .filter((l) => l !== null)
    .join("\n");

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#04131C;background:#FBF9F4;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e1d8;border-radius:18px;padding:32px;">
          <p style="margin:0 0 4px;font-size:32px;">🎂</p>
          <p style="margin:0 0 16px;font-size:15px;">${esc(greeting)}</p>
          <p style="margin:0 0 16px;font-size:17px;line-height:1.5;font-weight:600;">${esc(lead)}</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#3d4a53;">${esc(nudge)}</p>
          ${noTeacher ? `<p style="margin:0 0 16px;font-size:14px;color:#c4483a;">${esc(noTeacher)}</p>` : ""}
          <p style="margin:24px 0 0;font-size:13px;color:#6b7680;">Masani</p>
        </div>
      </body>
    </html>`;

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      cc,
      subject,
      html,
      text,
    });
    if (error) return { ok: false, skipped: false, error: error.message };
  } catch (err) {
    return { ok: false, skipped: false, error: err instanceof Error ? err.message : "Send failed" };
  }

  return { ok: true, recipients: [...to, ...(cc ?? [])] };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
