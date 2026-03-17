import { MetadataRoute } from "next";
import { BASE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/zh/"],
        disallow: ["/api/", "/dashboard/", "/auth/", "/admin/"]
      },
      // v62.1: Baidu crawler - explicit allow
      {
        userAgent: "Baiduspider",
        allow: ["/"]
      }
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-zh.xml`,
      `${BASE_URL}/baidu-sitemap.xml`
    ]
  };
}
