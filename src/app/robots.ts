import { MetadataRoute } from "next";
import { BASE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/auth/", "/admin/"]
    },
    sitemap: `${BASE_URL}/sitemap.xml`
  };
}
