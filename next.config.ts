import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/a/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/dxtniwy3s/image/upload/**",
      },
      {
        protocol: "https",
        hostname: "travelmate-backend-knvd.onrender.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "travelmate-backend-1-1lgj.onrender.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
