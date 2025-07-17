// @ts-check
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  experimental: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow cross-origin requests in development, which is common in cloud IDEs.
  // This can be removed when deploying to production.
  ...(process.env.NODE_ENV === 'development' && {
      allowedDevOrigins: ['https://*.cloudworkstations.dev'],
  }),
};

export default nextConfig;
