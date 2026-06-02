import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/BrainSpark",
  assetPrefix: "/BrainSpark/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
