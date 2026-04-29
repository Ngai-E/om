import type { NextConfig } from "next";

// Use different build directories for platform vs tenant apps
const isPlatform = process.env.PORT === '3000';
const distDir = isPlatform ? '.next-platform' : '.next-tenant';

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
