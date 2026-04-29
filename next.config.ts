import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "cdn.motor1.com" },
      { hostname: "www.kia.com" },
    ],
  },
};

export default nextConfig;
