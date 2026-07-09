import {
  formatSource,
  formatSubjects,
  ageRangeLabel,
  schoolLevelLabel,
  tutoredBeforeLabel,
  timelineLabel,
  type StrategyLeadInput,
} from "@/lib/strategy/schema";

export type ZohoLeadResult =
  | { ok: true; skipped: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

// Zoho data centres live on different TLDs. The account/token domain and the
// CRM API domain share the region suffix (com | eu | in | com.au | jp …).
function region(): string {
  return process.env.ZOHO_ACCOUNT_REGION?.trim() || "com";
}
function accountsHost(): string {
  return `https://accounts.zoho.${region()}`;
}
function apiHost(): string {
  return `https://www.zohoapis.${region()}`;
}

// Cached access token (Zoho access tokens last ~1h; the refresh token is
// long-lived). Module scope persists across warm invocations.
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(`${accountsHost()}/oauth/v2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Zoho token refresh failed: ${data.error ?? `HTTP ${res.status}`}`,
    );
  }
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

// Zoho requires Last_Name. Split the single full-name field on the first space.
function splitName(fullName: string): { first?: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { last: fullName.trim() || "Unknown" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/**
 * Creates a Lead in Zoho CRM from a strategy-session submission. Uses only
 * standard Lead fields (so it won't 400 on custom fields the org may not have)
 * and stuffs the strategy-specific answers into Description.
 *
 * Missing credentials => skipped (local dev / preview). Any HTTP or auth
 * failure is returned as { ok:false } so the caller can fall back to the
 * failure-alert email.
 */
export async function createZohoLead(
  input: StrategyLeadInput,
): Promise<ZohoLeadResult> {
  let accessToken: string | null;
  try {
    accessToken = await getAccessToken();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Zoho auth failed",
    };
  }
  if (!accessToken) {
    return { ok: true, skipped: true, reason: "Zoho credentials not set" };
  }

  const { first, last } = splitName(input.parent_name);
  const description = [
    `Child age: ${ageRangeLabel[input.child_age_range]}`,
    `School level: ${schoolLevelLabel[input.school_level]}`,
    `Tutored before: ${tutoredBeforeLabel[input.tutored_before]}`,
    `Timeline: ${timelineLabel[input.timeline]}`,
    `Subjects: ${formatSubjects(input)}`,
    `Form source: ${formatSource(input.source)}`,
  ].join("\n");

  const record: Record<string, unknown> = {
    Last_Name: last,
    Email: input.parent_email,
    Phone: input.parent_phone,
    Country: input.country,
    Lead_Source: "Strategy Session Landing Page",
    Description: description,
  };
  if (first) record.First_Name = first;

  try {
    const res = await fetch(`${apiHost()}/crm/v6/Leads`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ data: [record], trigger: ["workflow"] }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      data?: Array<{ code?: string; message?: string; status?: string }>;
    };
    const rowStatus = body.data?.[0]?.status;
    if (!res.ok || rowStatus !== "success") {
      const msg = body.data?.[0]?.message ?? `HTTP ${res.status}`;
      return { ok: false, error: `Zoho lead create failed: ${msg}` };
    }
    return { ok: true, skipped: false };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Zoho request failed",
    };
  }
}
