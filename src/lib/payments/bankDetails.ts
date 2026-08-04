/**
 * The account parents transfer to. Static, like the rest of the business
 * content in lib/marketing/defaults.ts — edit here and deploy; there's no admin
 * UI or database round-trip for it.
 *
 * Rendered on the parent payment card, in the renewal reminder email, and on
 * the receipt, so all three can never drift apart.
 */
export const BANK_DETAILS = {
  accountName: "Masani Tutors Ltd",
  bankName: "Moniepoint MFB",
  accountNumber: "6729326185",
} as const;

/** One-line form for plain-text email bodies. */
export function bankDetailsText(reference?: string): string {
  const lines = [
    BANK_DETAILS.accountName,
    `${BANK_DETAILS.bankName} · ${BANK_DETAILS.accountNumber}`,
  ];
  if (reference) lines.push(`Reference: ${reference}`);
  return lines.join("\n");
}
