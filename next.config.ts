import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // La web de cada clínica vivía en /c/<slug>; ahora está en la raíz.
      { source: "/c/:slug", destination: "/:slug", permanent: true },
      { source: "/c/:slug/:path*", destination: "/:slug/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
