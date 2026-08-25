import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
