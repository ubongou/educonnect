import { formatSource, type StrategyLeadInput } from "@/lib/strategy/schema";

export type ZohoCampaignsResult =
  | { ok: true; skipped: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

// Zoho data centres live on different TLDs. The accounts (token) domain and the
// Campaigns API domain share the region suffix (com | eu | in | com.au | jp …).
function region(): string {
  return process.env.ZOHO_ACCOUNT_REGION?.trim() || "com";
}
function accountsHost(): string {
  return `https://accounts.zoho.${region()}`;
}
function campaignsHost(): string {
  return `https://campaigns.zoho.${region()}`;
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

// Zoho Campaigns has no Last_Name requirement like CRM, but we still split the
// single full-name field so First/Last land cleanly for personalisation.
function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { first: "", last: fullName.trim() };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/**
 * Subscribes a strategy-session lead to a Zoho Campaigns list via the
 * listsubscribe API. Adding the contact to that list is what triggers the
 * Facebook-audience automation/workflow configured in Zoho Campaigns.
 *
 * Config (all optional — a missing value => skipped, never throws the flow):
 *   ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN — an OAuth
 *     self-client whose refresh token carries a Campaigns scope
 *     (e.g. ZohoCampaigns.contact.CREATE). NOTE: a CRM-only refresh token will
 *     NOT work here — it must be regenerated with the Campaigns scope.
 *   ZOHO_CAMPAIGNS_LIST_KEY — the target list's list key.
 *   ZOHO_ACCOUNT_REGION — data-centre suffix (default "com").
 *
 * Only standard Campaigns contact fields are sent (email, name, phone) so the
 * call can't 400 on custom fields the account hasn't defined; the full
 * questionnaire detail still lives in the Google Sheet.
 */
export async function addToZohoCampaigns(
  input: StrategyLeadInput,
): Promise<ZohoCampaignsResult> {
  const listKey = process.env.ZOHO_CAMPAIGNS_LIST_KEY;
  if (!listKey) {
    return { ok: true, skipped: true, reason: "ZOHO_CAMPAIGNS_LIST_KEY not set" };
  }

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
  // Campaigns' standard contact fields. "Contact Email" is required.
  const contactInfo: Record<string, string> = {
    "Contact Email": input.parent_email,
    "First Name": first,
    "Last Name": last,
    Phone: input.parent_phone,
  };

  const params = new URLSearchParams({
    resfmt: "JSON",
    listkey: listKey,
    contactinfo: JSON.stringify(contactInfo),
    // Lead context — harmless if unmapped in Campaigns; useful in the API log.
    source: formatSource(input.source),
  });

  try {
    const res = await fetch(
      `${campaignsHost()}/api/v1.1/json/listsubscribe`,
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );
    const body = (await res.json().catch(() => ({}))) as {
      status?: string;
      code?: string;
      message?: string;
    };
    const status = (body.status ?? "").toLowerCase();
    // Campaigns returns { status: "success" } on success; anything else (an
    // error code/message, or a non-2xx) is treated as a failure.
    if (!res.ok || (status !== "success" && body.code)) {
      return {
        ok: false,
        error: `Zoho Campaigns subscribe failed: ${body.message ?? body.code ?? `HTTP ${res.status}`}`,
      };
    }
    return { ok: true, skipped: false };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Zoho Campaigns request failed",
    };
  }
}
