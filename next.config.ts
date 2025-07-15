import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
    experimental: {
      allowedDevOrigins: ['https://*.cloudworkstations.dev'],
    },
  }),
};

export default nextConfig;
