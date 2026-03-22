import type { NextConfig } from "next";
import path from "node:path";

const tailwindcssPath = require.resolve("tailwindcss");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias.tailwindcss = tailwindcssPath;
    return config;
  },
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      tailwindcss: tailwindcssPath,
    },
  },
};

export default nextConfig;
