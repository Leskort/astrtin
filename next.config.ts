import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VOICE_CODE: process.env.VOICE_CODE || 'tron',
    NEXT_PUBLIC_VOICE_LANGUAGE: process.env.VOICE_LANGUAGE || 'en-US',
  },
};

export default nextConfig;
