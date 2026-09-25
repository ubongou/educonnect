import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Everything public is crawlable, including by AI assistants' crawlers
 * (GPTBot, ClaudeBot, PerplexityBot, Google-Extended): being readable by them
 * is how Masani gets recommended in AI answers. Private areas are kept out.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/teacher",
        "/onboarding",
        "/api/",
        "/auth/",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/book/thanks",
        "/strategy-session/booked",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
