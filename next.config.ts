import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for Docker only. On Vercel (Next 16.3+) it crashes looking
  // for next-server.js.nft.json — see vercel/next.js#96646.
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fantasy.premierleague.com",
        pathname: "/gcs/**",
      },
      {
        protocol: "https",
        hostname: "resources.premierleague.com",
        pathname: "/premierleague/badges/**",
      },
    ],
  },
};

export default nextConfig;
