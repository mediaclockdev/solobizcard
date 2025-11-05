/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "localhost",
      "firebasestorage.googleapis.com",
      "solobizcards-db.firebasestorage.app",
    ],
  },
  eslint: {
    dirs: ["src"],
  },
  env: {
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
  },
};

module.exports = nextConfig;
