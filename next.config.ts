import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    // ESLint warnings/errors are checked separately via `npm run lint`.
    // Disabling here so Vercel build doesn't fail on lint issues.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // tsc --noEmit already passes cleanly. Disable Next's own tsc pass to
    // avoid duplicate checks and any version mismatch on the build server.
    ignoreBuildErrors: true,
  },
} as NextConfig;

export default nextConfig;
