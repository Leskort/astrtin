import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VOICE_CODE: process.env.VOICE_CODE || 'tron',
    NEXT_PUBLIC_VOICE_LANGUAGE: process.env.VOICE_LANGUAGE || 'en-US',
  },
  // Разрешаем использование cookies в API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
