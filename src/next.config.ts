import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
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
