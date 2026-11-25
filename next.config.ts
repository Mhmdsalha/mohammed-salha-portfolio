import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  experimental: {
    // src/app/global-not-found.tsx: unmatched URLs get a server-rendered localised 404 (D-026).
    globalNotFound: true,
    serverActions: {
      // Vercel caps function request bodies at 4.5 MB; match it below that, so local runs behave
      // like production (src/lib/images/rules.ts, D-030).
      bodySizeLimit: "4mb"
    }
  },
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
