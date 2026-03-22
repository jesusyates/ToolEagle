import { MetadataRoute } from "next";
import { BASE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/zh/", "/en/", "/ai-feed", "/questions/"],
        disallow: ["/api/", "/dashboard/", "/auth/", "/admin/"]
      },
      // v62.1: Baidu crawler - explicit allow
      {
        userAgent: "Baiduspider",
        allow: ["/"]
      },
      // V79: AI crawlers - explicit allow for discovery
      {
        userAgent: "GPTBot",
        allow: ["/"]
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/"]
      },
      {
        userAgent: "Google-Extended",
        allow: ["/"]
      }
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-zh.xml`,
      `${BASE_URL}/baidu-sitemap.xml`,
      `${BASE_URL}/sitemap-ai.xml`,
      `${BASE_URL}/sitemap-en.xml`,
      `${BASE_URL}/sitemap-questions.xml`
    ]
  };
}
