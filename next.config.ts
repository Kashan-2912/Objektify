import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.bing.net" },
      { protocol: "https", hostname: "*.microsoft.com" },
      { protocol: "https", hostname: "*.msn.com" },
      { protocol: "https", hostname: "*.gstatic.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.akamaihd.net" },
    ],
  },
};

export default nextConfig;
