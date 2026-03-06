import type { NextConfig } from "next";
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig: NextConfig = withPWA({
  /* config options here */
  turbopack: {}, // Silence Next.js 16 Turbopack warning
  experimental: {
    // This helps with Turbopack/Webpack compatibility
  }
});

export default nextConfig;
