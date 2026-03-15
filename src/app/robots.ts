import { MetadataRoute } from "next";

const BASE_URL = "https://www.tooleagle.com";

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
