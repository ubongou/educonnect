import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin Turbopack workspace root to this project so middleware.ts is picked
  // up even when unrelated lockfiles exist higher in the directory tree.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/guides/online-tutoring-for-nigerian-families-abroad",
        destination: "/guides/hiring-a-nigerian-tutor-what-to-check",
        permanent: true,
      },
    ];
  },
  images: {
    // Next 16 requires any non-default quality used in an <Image> to be
    // whitelisted here. The Hero uses 95 to keep the cutout crisp.
    qualities: [75, 95],
  },
};

export default nextConfig;
