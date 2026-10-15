import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable filesystem cache for Turbopack dev server (Next.js 16.2+)
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
