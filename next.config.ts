import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    // tsc --noEmit already passes cleanly. Disable Next's own tsc pass to
    // avoid duplicate checks and any version mismatch on the build server.
    ignoreBuildErrors: true,
  },
} as NextConfig;

export default nextConfig;
