/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  typescript: {
    // Dangerously allow production builds even when type errors exist.
    ignoreBuildErrors: true
  }
};

export default nextConfig;
