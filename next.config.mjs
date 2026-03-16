import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: "/api/sitemap-index" },
      { source: "/sitemap-main.xml", destination: "/api/sitemap-main" },
      { source: "/sitemap-topics.xml", destination: "/api/sitemap-topics" },
      { source: "/sitemap-examples.xml", destination: "/api/sitemap-examples" },
      { source: "/sitemap-ideas.xml", destination: "/api/sitemap-ideas" },
      { source: "/sitemap-library.xml", destination: "/api/sitemap-library" },
      { source: "/sitemap-answers.xml", destination: "/api/sitemap-answers" },
      { source: "/sitemap-tools.xml", destination: "/api/sitemap-tools" }
    ];
  },
  async redirects() {
    return [
      // Creator profile: /creator/[username] -> /creators/[username]
      { source: "/creator/:username", destination: "/creators/:username", permanent: true },
      // Legacy SEO pages: /tiktok/funny-captions -> /ideas/tiktok/funny-captions
      { source: "/:category(tiktok|youtube|instagram)/:topic", destination: "/ideas/:category/:topic", permanent: true },
      // /tools?tool=X -> /tools/X (backwards compatibility)
      { source: "/tools", has: [{ type: "query", key: "tool", value: "(?<tool>[^&]+)" }], destination: "/tools/:tool", permanent: true }
    ];
  },
  webpack: (config) => {
    config.infrastructureLogging = { level: "error" };
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Parsing of.*next-intl/,
      /Build dependencies behind this expression/,
      /Serializing big strings/
    ];
    return config;
  }
};

export default withNextIntl(nextConfig);

