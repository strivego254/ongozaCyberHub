/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker builds
  // This creates a minimal production build with only necessary files
  output: 'standalone',
  
  // Optimize for production
  swcMinify: true,
  
  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,
  
  // Skip ESLint during build to avoid blocking on lint errors
  // Linting should be done separately in CI/CD
  eslint: {
    ignoreDuringBuilds: true,
    // Disable ESLint completely during builds
    dirs: [],
  },
  
  // Skip TypeScript type checking during build for faster builds
  // Type checking should be done separately in CI/CD
  typescript: {
    ignoreBuildErrors: false, // Keep this false to catch TS errors, but can be set to true if needed
  },
  
  // Webpack configuration to handle module resolution issues
  webpack: (config, { isServer }) => {
    // Fix for module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Handle ESM/CommonJS interop
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };
    
    // Ignore problematic modules if needed
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'canvas': 'commonjs canvas',
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;

