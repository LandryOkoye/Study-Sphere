import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "pino-pretty": "",
      "@react-native-async-storage/async-storage": "",
    },
  },
};

export default nextConfig;
