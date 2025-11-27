/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for Docker
  env: {
    NEXT_PUBLIC_DJANGO_API_URL: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_FASTAPI_API_URL: process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8001',
  },
  async rewrites() {
    return [
      {
        source: '/api/django/:path*',
        destination: `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}/api/v1/:path*`,
      },
      {
        source: '/api/fastapi/:path*',
        destination: `${process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8001'}/api/v1/:path*`,
      },
    ];
  },
  // Optimize images
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Compression
  compress: true,
  // Security headers (handled by NGINX in production)
  poweredByHeader: false,
};

module.exports = nextConfig;


