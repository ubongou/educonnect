import type { MetadataRoute } from "next";
import { countryPages, subjectPages } from "@/lib/marketing/seoPages";
import { absoluteUrl } from "@/lib/seo";

/** Every public, indexable page. New landing pages appear here automatically. */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly",
  ) => ({ url: absoluteUrl(path), changeFrequency, priority });

  return [
    page("/", 1, "weekly"),
    page("/pricing", 0.9),
    page("/strategy-session", 0.9),
    page("/tutoring", 0.8),
    ...subjectPages.map((s) => page(`/tutoring/${s.slug}`, 0.8)),
    ...countryPages.map((c) => page(`/online-tutoring/${c.slug}`, 0.8)),
    page("/about", 0.7),
    page("/book", 0.6),
    page("/privacy", 0.2, "yearly"),
  ];
}
