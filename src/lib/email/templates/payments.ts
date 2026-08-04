import { BANK_DETAILS } from "@/lib/payments/bankDetails";
import { formatNaira } from "@/lib/payments/plans";

const BRAND_NAVY = "#04131C";
const BRAND_BLUE = "#3EBEFF";
const BRAND_CORAL = "#FF6B57";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ReceiptLine = { label: string; amount: number };

export type PlanEmailBase = {
  parentFirstName: string | null;
  studentName: string;
  referenceCode: string;
  sessionsTotal: number;
  ratePerSession: number;
  lines: ReceiptLine[];
  total: number;
  /** Parent dashboard link. */
  dashboardUrl: string;
};

/** Shared shell so receipt and reminder emails can't drift apart visually. */
function shell(subject: string, inner: string): string {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;background:#F1F2F4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F2F4;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="background:${BRAND_NAVY};height:6px;line-height:0;font-size:0;">&nbsp;</td></tr>
          ${inner}
          <tr><td style="padding:0 32px 28px;">
            <p style="margin:0;font:400 12px Arial,sans-serif;line-height:1.5;color:#8A93A0;">
              Masani · questions? Just reply to this email.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** The line-item table shared by the receipt and the renewal quote. */
function breakdownHtml(data: {
  sessionsTotal: number;
  ratePerSession: number;
  lines: ReceiptLine[];
  total: number;
  totalLabel: string;
}): string {
  const subtotalRow = `<tr>
    <td style="padding:6px 0;font:400 14px Arial,sans-serif;color:#4A5560;">${data.sessionsTotal} session${data.sessionsTotal === 1 ? "" : "s"} × ${escapeHtml(formatNaira(data.ratePerSession))}</td>
    <td align="right" style="padding:6px 0;font:700 14px Arial,sans-serif;color:${BRAND_NAVY};">${escapeHtml(formatNaira(data.sessionsTotal * data.ratePerSession))}</td>
  </tr>`;

  const lineRows = data.lines
    .map(
      (l) => `<tr>
        <td style="padding:6px 0;font:400 14px Arial,sans-serif;color:#4A5560;">${escapeHtml(l.label)}</td>
        <td align="right" style="padding:6px 0;font:700 14px Arial,sans-serif;color:${l.amount < 0 ? BRAND_CORAL : BRAND_NAVY};">${l.amount > 0 ? "+" : ""}${escapeHtml(formatNaira(l.amount))}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${subtotalRow}
    ${lineRows}
    <tr><td colspan="2" style="border-top:1px solid #E4E7EB;height:1px;line-height:0;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="padding:10px 0 0;font:700 15px Arial,sans-serif;color:${BRAND_NAVY};">${escapeHtml(data.totalLabel)}</td>
      <td align="right" style="padding:10px 0 0;font:700 18px Arial,sans-serif;color:${BRAND_NAVY};">${escapeHtml(formatNaira(data.total))}</td>
    </tr>
  </table>`;
}

function breakdownText(data: {
  sessionsTotal: number;
  ratePerSession: number;
  lines: ReceiptLine[];
  total: number;
  totalLabel: string;
}): string {
  const rows = [
    `${data.sessionsTotal} session${data.sessionsTotal === 1 ? "" : "s"} x ${formatNaira(data.ratePerSession)}   ${formatNaira(data.sessionsTotal * data.ratePerSession)}`,
    ...data.lines.map(
      (l) => `${l.label}   ${l.amount > 0 ? "+" : ""}${formatNaira(l.amount)}`,
    ),
    `${data.totalLabel}: ${formatNaira(data.total)}`,
  ];
  return rows.join("\n");
}

const bankBlockHtml = (reference: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F8F9;border-radius:12px;">
    <tr><td style="padding:16px 18px;">
      <p style="margin:0 0 8px;font:700 11px Arial,sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#8A93A0;">Transfer to</p>
      <p style="margin:0 0 2px;font:700 14px Arial,sans-serif;color:${BRAND_NAVY};">${escapeHtml(BANK_DETAILS.accountName)}</p>
      <p style="margin:0 0 2px;font:400 14px Arial,sans-serif;color:${BRAND_NAVY};">${escapeHtml(BANK_DETAILS.bankName)}</p>
      <p style="margin:0 0 10px;font:700 16px Arial,sans-serif;letter-spacing:0.04em;color:${BRAND_NAVY};">${escapeHtml(BANK_DETAILS.accountNumber)}</p>
      <p style="margin:0;font:400 13px Arial,sans-serif;color:#4A5560;">
        Please quote <strong style="color:${BRAND_NAVY};">${escapeHtml(reference)}</strong> as the transfer reference so we can match your payment straight away.
      </p>
    </td></tr>
  </table>`;

const bankBlockText = (reference: string) =>
  [
    "Transfer to:",
    BANK_DETAILS.accountName,
    BANK_DETAILS.bankName,
    BANK_DETAILS.accountNumber,
    `Reference: ${reference}`,
  ].join("\n");

const greetingFor = (name: string | null) =>
  name ? `Hi ${escapeHtml(name)},` : "Hi there,";

// -----------------------------------------------------------------------------
// Receipt — sent once, when an admin marks a plan paid.
// -----------------------------------------------------------------------------

export function renderPaymentReceiptEmail(data: PlanEmailBase): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Payment received — ${data.referenceCode} for ${data.studentName}`;

  const inner = `
    <tr><td style="padding:28px 32px 8px;">
      <p style="margin:0 0 14px;font:400 14px Arial,sans-serif;color:${BRAND_NAVY};">${greetingFor(data.parentFirstName)}</p>
      <p style="margin:0 0 20px;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">
        Thank you — we've received your payment for <strong>${escapeHtml(data.studentName)}</strong>'s
        ${data.sessionsTotal}-session block. Here's your receipt.
      </p>
    </td></tr>
    <tr><td style="padding:0 32px 20px;">
      ${breakdownHtml({ ...data, totalLabel: "Total paid" })}
    </td></tr>
    <tr><td style="padding:0 32px 20px;">
      <p style="margin:0;font:400 13px Arial,sans-serif;line-height:1.55;color:#4A5560;">
        Reference <strong style="color:${BRAND_NAVY};">${escapeHtml(data.referenceCode)}</strong> ·
        ${data.sessionsTotal} session${data.sessionsTotal === 1 ? "" : "s"} now available to schedule.
      </p>
    </td></tr>
    <tr><td style="padding:0 32px 28px;">
      <a href="${data.dashboardUrl}" style="display:inline-block;background:${BRAND_BLUE};color:${BRAND_NAVY};font:700 14px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:999px;">View your dashboard</a>
    </td></tr>`;

  const text = [
    data.parentFirstName ? `Hi ${data.parentFirstName},` : "Hi there,",
    "",
    `Thank you — we've received your payment for ${data.studentName}'s ${data.sessionsTotal}-session block.`,
    "",
    breakdownText({ ...data, totalLabel: "Total paid" }),
    "",
    `Reference: ${data.referenceCode}`,
    `${data.sessionsTotal} session${data.sessionsTotal === 1 ? "" : "s"} are now available to schedule.`,
    "",
    data.dashboardUrl,
  ].join("\n");

  return { subject, html: shell(subject, inner), text };
}

// -----------------------------------------------------------------------------
// Renewal reminder — one session left to deliver.
// -----------------------------------------------------------------------------

export type RenewalEmailData = PlanEmailBase & {
  sessionsDelivered: number;
  /** The last session still owed, if one is on the calendar. */
  nextSessionDate: string | null;
};

export function renderRenewalReminderEmail(data: RenewalEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${data.studentName} has 1 session left — time to renew`;

  const nextLine = data.nextSessionDate
    ? `Their final session on this block is <strong>${escapeHtml(
        new Date(data.nextSessionDate).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
      )}</strong>.`
    : "Their final session on this block is still to be scheduled.";

  const inner = `
    <tr><td style="padding:28px 32px 8px;">
      <p style="margin:0 0 14px;font:400 14px Arial,sans-serif;color:${BRAND_NAVY};">${greetingFor(data.parentFirstName)}</p>
      <p style="margin:0 0 12px;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">
        <strong>${escapeHtml(data.studentName)}</strong> has completed
        ${data.sessionsDelivered} of ${data.sessionsTotal} sessions, so there's
        <strong>one lesson left</strong> on the current block. ${nextLine}
      </p>
      <p style="margin:0 0 20px;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">
        To keep their schedule running without a gap, renew before that last
        session. We'll schedule the next block as soon as your transfer lands.
      </p>
    </td></tr>
    <tr><td style="padding:0 32px 20px;">
      ${bankBlockHtml(data.referenceCode)}
    </td></tr>
    <tr><td style="padding:0 32px 28px;">
      <a href="${data.dashboardUrl}" style="display:inline-block;background:${BRAND_BLUE};color:${BRAND_NAVY};font:700 14px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:999px;">View your plan</a>
    </td></tr>`;

  const text = [
    data.parentFirstName ? `Hi ${data.parentFirstName},` : "Hi there,",
    "",
    `${data.studentName} has completed ${data.sessionsDelivered} of ${data.sessionsTotal} sessions — one lesson left on the current block.`,
    data.nextSessionDate
      ? `Their final session is on ${data.nextSessionDate}.`
      : "Their final session is still to be scheduled.",
    "",
    "To keep their schedule running without a gap, renew before that last session.",
    "",
    bankBlockText(data.referenceCode),
    "",
    data.dashboardUrl,
  ].join("\n");

  return { subject, html: shell(subject, inner), text };
}

// -----------------------------------------------------------------------------
// Plan exhausted — the final nudge. Nothing is sent after this one.
// -----------------------------------------------------------------------------

export function renderPlanExhaustedEmail(data: PlanEmailBase): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${data.studentName}'s sessions have finished`;

  const inner = `
    <tr><td style="padding:28px 32px 8px;">
      <p style="margin:0 0 14px;font:400 14px Arial,sans-serif;color:${BRAND_NAVY};">${greetingFor(data.parentFirstName)}</p>
      <p style="margin:0 0 12px;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">
        <strong>${escapeHtml(data.studentName)}</strong> has now used all
        ${data.sessionsTotal} sessions on their block, so nothing further is
        scheduled at the moment.
      </p>
      <p style="margin:0 0 20px;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">
        Whenever you're ready to continue, a transfer with the reference below
        is all we need and we'll get their next block on the calendar.
      </p>
    </td></tr>
    <tr><td style="padding:0 32px 20px;">
      ${bankBlockHtml(data.referenceCode)}
    </td></tr>
    <tr><td style="padding:0 32px 28px;">
      <a href="${data.dashboardUrl}" style="display:inline-block;background:${BRAND_BLUE};color:${BRAND_NAVY};font:700 14px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:999px;">View your dashboard</a>
    </td></tr>`;

  const text = [
    data.parentFirstName ? `Hi ${data.parentFirstName},` : "Hi there,",
    "",
    `${data.studentName} has now used all ${data.sessionsTotal} sessions on their block, so nothing further is scheduled.`,
    "",
    "Whenever you're ready to continue, a transfer with the reference below is all we need.",
    "",
    bankBlockText(data.referenceCode),
    "",
    data.dashboardUrl,
  ].join("\n");

  return { subject, html: shell(subject, inner), text };
}
