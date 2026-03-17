import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

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
      { source: "/sitemap-prompts.xml", destination: "/api/sitemap-prompts" },
      { source: "/sitemap-ideas.xml", destination: "/api/sitemap-ideas" },
      { source: "/sitemap-library.xml", destination: "/api/sitemap-library" },
      { source: "/sitemap-answers.xml", destination: "/api/sitemap-answers" },
      { source: "/sitemap-ai-tools.xml", destination: "/api/sitemap-ai-tools" },
      { source: "/sitemap-tools.xml", destination: "/api/sitemap-tools" },
      { source: "/sitemap-compare.xml", destination: "/api/sitemap-compare" },
      { source: "/sitemap-community.xml", destination: "/api/sitemap-community" },
      { source: "/sitemap-guides.xml", destination: "/api/sitemap-guides" },
      { source: "/sitemap-zh.xml", destination: "/api/sitemap-zh" },
      { source: "/baidu-sitemap.xml", destination: "/api/sitemap-zh" }
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

const sentryConfig = {
  org: process.env.SENTRY_ORG || "tool-eagle",
  project: process.env.SENTRY_PROJECT || "tooleagle",
  silent: !process.env.CI,
  widenClientFileUpload: true
};

export default withSentryConfig(withNextIntl(nextConfig), sentryConfig);

