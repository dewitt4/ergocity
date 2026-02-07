// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add this line to enable static export:
  output: 'export',
};

// Use ES Module export syntax for .mjs files
export default nextConfig;