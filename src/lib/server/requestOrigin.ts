import { headers } from "next/headers";

/** The site's origin for the current request, e.g. https://joinmasani.com. */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`;
  return process.env.APP_URL ?? "";
}
