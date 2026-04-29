import type { NextConfig } from "next";

// Use a separate build directory only when explicitly requested (e.g. running
// the platform app and the tenant app in parallel locally). In production
// (Vercel/Render) we keep the default `.next` so the deploy provider can find
// `routes-manifest.json` without extra configuration.
const distDir =
  process.env.NEXT_BUILD_DIR ||
  (process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' ? '.next-platform' : undefined) ||
  '.next';

const nextConfig: NextConfig = {
  distDir,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
