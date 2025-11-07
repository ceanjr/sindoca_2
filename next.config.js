/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Disable optimization since we're using native <img> tags
  },
  turbopack: {},
};

module.exports = nextConfig;
