import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/partners',
        destination: '/recommendations',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
