/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

module.exports = nextConfig;


