import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker multi-stage build (copies only necessary files)
  output: "standalone",
};

export default nextConfig;
