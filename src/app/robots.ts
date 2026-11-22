import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// /robots.txt (P3-3, D-027). The dashboard and dev pages are blocked; the preview is left to its
// own noindex, which crawlers can only read if they may fetch it. Vercel preview deployments
// block everything, so only production is crawled.
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/dev"] },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
