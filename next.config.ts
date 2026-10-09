import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `msw/browser` declara `"node": null`. El paquete sí tiene el entry del
  // navegador; el alias evita que el build de Next falle al resolverlo.
  turbopack: {
    resolveAlias: {
      "msw/browser": "./node_modules/msw/lib/browser/index.js",
    },
  },
};

export default nextConfig;
