/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Dangerously allow production builds even when type errors exist.
    ignoreBuildErrors: true
  }
};

export default nextConfig;
