import type { NextConfig } from "next";
import path from "node:path";

// Allow next/image to optimize assets served from the Supabase Storage
// `marketing-assets` public bucket. Resolves the host from
// NEXT_PUBLIC_SUPABASE_URL at build time so dev / preview / prod each pick
// up the right project.
function supabaseImageHost(): { protocol: "https"; hostname: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const u = new URL(url);
    return { protocol: "https", hostname: u.hostname };
  } catch {
    return null;
  }
}

const supabaseHost = supabaseImageHost();

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin Turbopack workspace root to this project so middleware.ts is picked
  // up even when unrelated lockfiles exist higher in the directory tree.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Next 16 requires any non-default quality used in an <Image> to be
    // whitelisted here. The Hero uses 95 to keep the cutout crisp.
    qualities: [75, 95],
    remotePatterns: supabaseHost
      ? [
          {
            ...supabaseHost,
            pathname: "/storage/v1/object/public/marketing-assets/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
