import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin Turbopack workspace root to this project so middleware.ts is picked
  // up even when unrelated lockfiles exist higher in the directory tree.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
