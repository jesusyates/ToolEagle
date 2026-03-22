import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
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
      { source: "/baidu-sitemap.xml", destination: "/api/sitemap-zh" },
      { source: "/sitemap-ai.xml", destination: "/api/sitemap-ai" },
      { source: "/sitemap-en.xml", destination: "/api/sitemap-en" },
      { source: "/sitemap-questions.xml", destination: "/api/sitemap-questions" },
      { source: "/sitemap-pseo.xml", destination: "/api/sitemap-programmatic?part=0" },
      { source: "/sitemap-programmatic.xml", destination: "/api/sitemap-programmatic?part=0" },
      { source: "/sitemap-pseo-:part.xml", destination: "/api/sitemap-programmatic?part=:part" }
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://*.plausible.io https://*.sentry.io https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https:",
          "frame-src 'self' https:",
          "connect-src 'self' https://plausible.io https://*.plausible.io https://*.sentry.io https://*.supabase.co https://*.supabase.in wss: https:"
        ].join("; ")
      }
    ];
    return [
      {
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" }
        ]
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          ...securityHeaders
        ]
      }
    ];
  },
  async redirects() {
    return [
      // Creator profile: /creator/[username] -> /creators/[username]
      { source: "/creator/:username", destination: "/creators/:username", permanent: true },
      // Legacy SEO pages: /tiktok/funny-captions -> /ideas/tiktok/funny-captions
      { source: "/:category(tiktok|youtube|instagram)/:topic", destination: "/ideas/:category/:topic", permanent: true },
      // /tools?tool=X -> /tools/X (backwards compatibility)
      { source: "/tools", has: [{ type: "query", key: "tool", value: "(?<tool>[^&]+)" }], destination: "/tools/:tool", permanent: true },
      // V72: /result/[id] -> /share/[id] (shareable result URL)
      { source: "/result/:id", destination: "/share/:id", permanent: true },
      // 工具索引并入抖音场景页；子路径 /zh/tools/* 仍保留
      { source: "/zh/tools", destination: "/zh/douyin", permanent: true },
      // 原「写给中国创作者」页已合并为 `/zh` 首页
      { source: "/zh/about", destination: "/zh", permanent: true }
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

