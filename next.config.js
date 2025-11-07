/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Disable optimization since we're using native <img> tags
  },
  // Add turbopack config to silence warnings
  turbopack: {},
};

module.exports = nextConfig;
