import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker builds
  // This creates a minimal production build with only necessary files
  output: 'standalone',
  
  // Optimize for production
  swcMinify: true,
  
  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,
};

export default nextConfig;
