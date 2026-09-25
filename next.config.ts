import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "res.cloudinary.com" },
      { hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/lens/chart",
        destination: "/dashboard/charts",
        permanent: true,
      },
      {
        source: "/lens/edu",
        destination: "/dashboard/learn",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
