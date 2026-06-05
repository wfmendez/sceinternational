import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer usa APIs de Node y debe quedar fuera del bundling.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
