import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/tc/:path*", destination: "https://technocore.chat/:path*" }];
  },
};

export default nextConfig;
