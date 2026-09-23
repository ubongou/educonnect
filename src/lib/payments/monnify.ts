import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Monnify — Moniepoint's payment gateway — as a thin REST client.
 *
 * Moniepoint's business account has no API of its own; Monnify is how software
 * talks to it. Money collected through Monnify settles into the Moniepoint
 * account the same day, so for the parent nothing changes except that the
 * account number they pay into is unique to their invoice, and for us the
 * payment confirms itself.
 *
 * Server-only (reads the secret key). Everything that doesn't touch the network
 * is a pure exported function with tests around it.
 */

const SANDBOX_BASE_URL = "https://sandbox.monnify.com";

export type MonnifyConfig = {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  contractCode: string;
};

/** Null when any credential is missing — callers fall back to manual payments. */
export function getMonnifyConfig(): MonnifyConfig | null {
  const apiKey = process.env.MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  const contractCode = process.env.MONNIFY_CONTRACT_CODE;
  if (!apiKey || !secretKey || !contractCode) return null;
  return {
    baseUrl: (process.env.MONNIFY_BASE_URL || SANDBOX_BASE_URL).replace(/\/$/, ""),
    apiKey,
    secretKey,
    contractCode,
  };
}

export function isMonnifyConfigured(): boolean {
  return getMonnifyConfig() !== null;
}

/**
 * Sandbox doesn't sign webhooks (Monnify only sends `monnify-signature` in
 * production), so an unsigned notification is only tolerated against sandbox.
 */
export function isMonnifySandbox(config: MonnifyConfig): boolean {
  return config.baseUrl.includes("sandbox");
}

// -----------------------------------------------------------------------------
// Pure helpers
// -----------------------------------------------------------------------------

/**
 * Webhook signature check: HMAC-SHA512 of the raw request body, keyed with the
 * client secret, lowercase hex. Must run on the exact bytes received — a
 * re-serialised JSON.parse result won't hash the same.
 */
export function verifyMonnifySignature(
  rawBody: string,
  signature: string | null,
  secretKey: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Lagos is UTC+1 all year — no DST — so a fixed offset is exact. */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/** Monnify's `expiryDate` format, `yyyy-MM-dd HH:mm:ss`, in Lagos time. */
export function formatMonnifyDate(date: Date): string {
  const lagos = new Date(date.getTime() + LAGOS_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${lagos.getUTCFullYear()}-${pad(lagos.getUTCMonth() + 1)}-${pad(lagos.getUTCDate())} ` +
    `${pad(lagos.getUTCHours())}:${pad(lagos.getUTCMinutes())}:${pad(lagos.getUTCSeconds())}`
  );
}

/**
 * Monnify timestamps are Lagos wall-clock time and come in two shapes depending
 * on the endpoint: `2021-11-17 11:28:42.615` and `17/11/2021 3:48:10 PM`.
 * Returns null for anything else, so the caller can fall back to "now".
 */
export function parseMonnifyDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const v = value.trim();

  let y: number, mo: number, d: number, h: number, mi: number, s: number;

  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  const dmy = v.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),? (\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?/i,
  );

  if (iso) {
    [y, mo, d, h, mi] = iso.slice(1, 6).map(Number);
    s = Number(iso[6] ?? 0);
  } else if (dmy) {
    [d, mo, y, h, mi] = dmy.slice(1, 6).map(Number);
    s = Number(dmy[6] ?? 0);
    const meridiem = dmy[7]?.toUpperCase();
    if (meridiem === "PM" && h < 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
  } else {
    return null;
  }

  const utc = Date.UTC(y, mo - 1, d, h, mi, s) - LAGOS_OFFSET_MS;
  return Number.isNaN(utc) ? null : new Date(utc);
}

/** Monnify sends amounts as numbers on some endpoints and strings on others. */
export function toAmount(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);
  return Number.isFinite(n) ? n : null;
}

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

type Envelope<T> = {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: T;
};

export class MonnifyError extends Error {}

let cachedToken: { token: string; baseUrl: string; expiresAt: number } | null = null;

async function accessToken(config: MonnifyConfig): Promise<string> {
  // A minute's slack so a token can't expire between here and the call.
  if (
    cachedToken &&
    cachedToken.baseUrl === config.baseUrl &&
    cachedToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${config.apiKey}:${config.secretKey}`).toString("base64");
  const res = await fetch(`${config.baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as Envelope<{
    accessToken: string;
    expiresIn: number;
  }> | null;

  if (!res.ok || !body?.requestSuccessful || !body.responseBody?.accessToken) {
    throw new MonnifyError(
      `Monnify login failed: ${body?.responseMessage ?? `HTTP ${res.status}`}`,
    );
  }

  cachedToken = {
    token: body.responseBody.accessToken,
    baseUrl: config.baseUrl,
    expiresAt: Date.now() + (body.responseBody.expiresIn ?? 0) * 1000,
  };
  return cachedToken.token;
}

async function call<T>(
  config: MonnifyConfig,
  method: "GET" | "POST" | "DELETE",
  path: string,
  payload?: unknown,
): Promise<T> {
  const token = await accessToken(config);
  const res = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok || !body?.requestSuccessful) {
    throw new MonnifyError(body?.responseMessage ?? `Monnify HTTP ${res.status}`);
  }
  return body.responseBody;
}

export type MonnifyInvoice = {
  invoiceReference: string;
  invoiceStatus: string;
  amount: number;
  accountNumber: string | null;
  accountName: string | null;
  bankName: string | null;
  checkoutUrl: string | null;
  expiryDate: string;
};

/**
 * Creates a dynamic invoice: Monnify generates a fresh virtual account for this
 * amount, valid until `expiresAt`, and closes it once paid.
 */
export async function createMonnifyInvoice(
  config: MonnifyConfig,
  input: {
    invoiceReference: string;
    amount: number;
    description: string;
    customerName: string;
    customerEmail: string;
    expiresAt: Date;
    redirectUrl?: string;
  },
): Promise<MonnifyInvoice> {
  return call<MonnifyInvoice>(config, "POST", "/api/v1/invoice/create", {
    invoiceReference: input.invoiceReference,
    amount: input.amount,
    invoiceDescription: input.description,
    description: input.description,
    contractCode: config.contractCode,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    expiryDate: formatMonnifyDate(input.expiresAt),
    currencyCode: "NGN",
    ...(input.redirectUrl ? { redirectUrl: input.redirectUrl } : {}),
  });
}

export async function cancelMonnifyInvoice(
  config: MonnifyConfig,
  invoiceReference: string,
): Promise<void> {
  await call(
    config,
    "DELETE",
    `/api/v1/invoice/${encodeURIComponent(invoiceReference)}/cancel`,
  );
}

export type MonnifyTransaction = {
  transactionReference: string;
  paymentReference: string;
  amountPaid: number | string;
  totalPayable: number | string;
  settlementAmount: number | string | null;
  paidOn: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  currency: string | null;
  product: { type: string; reference: string } | null;
};

/**
 * The authoritative view of a transaction. The webhook acts on this, never on
 * the notification body, so a forged or replayed notification can at worst
 * make us look up a real transaction.
 */
export async function getMonnifyTransaction(
  config: MonnifyConfig,
  transactionReference: string,
): Promise<MonnifyTransaction> {
  return call<MonnifyTransaction>(
    config,
    "GET",
    `/api/v2/transactions/${encodeURIComponent(transactionReference)}`,
  );
}
