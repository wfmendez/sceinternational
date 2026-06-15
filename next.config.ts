import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // En desarrollo no registrar el SW para evitar cachés confusas
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  // Silencia el conflicto webpack↔Turbopack en Next 16; Serwist aún genera el SW vía webpack.
  turbopack: {},
};

export default withSerwist(nextConfig);
