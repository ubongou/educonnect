/**
 * Resolves a marketing asset path to a renderable image URL.
 *
 *   resolveAssetUrl("hero/hero.png", "/home/hero.png", "2026-04-26T...")
 *     → "https://<project>.supabase.co/storage/v1/object/public/marketing-assets/hero/hero.png?v=<ts>"
 *
 *   resolveAssetUrl("", "/home/hero.png")
 *     → "/home/hero.png"   (bundled fallback)
 *
 * The Supabase Storage host has to be added to next.config.ts
 * `images.remotePatterns` so next/image can optimise it. We append a
 * `?v=<updated_at>` cachebuster so an image swap is visible immediately
 * (Supabase serves the bucket through a long-lived CDN cache).
 */

const PUBLIC_BUCKET = "marketing-assets";

function publicBaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PUBLIC_BUCKET}`;
}

export function resolveAssetUrl(
  storagePath: string,
  fallback: string,
  updatedAt?: string,
): string {
  const path = storagePath?.trim() ?? "";
  if (!path) return fallback;

  const base = publicBaseUrl();
  if (!base) {
    // Misconfigured env (no SUPABASE_URL) — fall back rather than render
    // a broken URL. Server logs will surface this.
    return fallback;
  }

  const url = `${base}/${path.replace(/^\//, "")}`;
  if (!updatedAt) return url;
  const cachebuster = encodeURIComponent(updatedAt);
  return `${url}?v=${cachebuster}`;
}
