import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const apiBaseUrl = (process.env.API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');
    const storageBaseUrl = (process.env.STORAGE_BASE_URL || apiBaseUrl).replace(/\/storage\/?$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: '/backend-storage/:path*',
        destination: `${storageBaseUrl}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
