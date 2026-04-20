/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "rhwaeisquhmayfhjkbmz.supabase.co" },
      { protocol: "https", hostname: "api.tomtom.com" },
      { protocol: "https", hostname: "*.tomtom.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
