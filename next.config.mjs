import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * Default 60s — large SSG manifests (80k+ pages) can hit worker SIGTERM on Vercel.
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/staticPageGenerationTimeout
   */
  staticPageGenerationTimeout: 300,
  async rewrites() {
    return [
      { source: "/sitemap-main.xml", destination: "/api/sitemap-main" },
      { source: "/sitemap-blog.xml", destination: "/api/sitemap-blog" },
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
      { source: "/zh/about", destination: "/zh", permanent: true },
      // 中文站：英文品牌向 SEO 集群不单独服务用户，统一回抖音专栏（MEMORY 一点五）
      { source: "/zh/tiktok", destination: "/zh/douyin", permanent: true },
      { source: "/zh/youtube", destination: "/zh/douyin", permanent: true },
      { source: "/zh/instagram", destination: "/zh/douyin", permanent: true },
      { source: "/zh/how-to/:path*", destination: "/zh/douyin-guide", permanent: true },
      { source: "/zh/ai-prompts-for/:path*", destination: "/zh/douyin-guide", permanent: true },
      { source: "/zh/content-strategy/:path*", destination: "/zh/douyin-guide", permanent: true },
      { source: "/zh/viral-examples/:path*", destination: "/zh/douyin-guide", permanent: true },
      { source: "/zh/sitemap/how-to", destination: "/zh/sitemap", permanent: true },
      { source: "/zh/sitemap/content-strategy", destination: "/zh/sitemap", permanent: true },
      { source: "/zh/sitemap/viral-examples", destination: "/zh/sitemap", permanent: true },
      { source: "/zh/sitemap/ai-prompts", destination: "/zh/sitemap", permanent: true }
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

/** When unset, Sentry upload/release steps fail on Vercel and @sentry/webpack-plugin aborts the build by default. */
const hasSentryAuth = Boolean(process.env.SENTRY_AUTH_TOKEN?.trim());

const sentryConfig = {
  org: process.env.SENTRY_ORG || "tool-eagle",
  project: process.env.SENTRY_PROJECT || "tooleagle",
  /** CI without SENTRY_AUTH_TOKEN: suppress Node/Edge/Client "No auth token" release warnings (noise only). */
  silent: Boolean(process.env.CI && !hasSentryAuth),
  widenClientFileUpload: true,
  ...(hasSentryAuth
    ? {}
    : {
        sourcemaps: { disable: true },
        release: { create: false, finalize: false }
      }),
  /** Never fail `next build` on Sentry upload/API issues (transient or missing token). */
  errorHandler(err) {
    console.warn("[sentry] build plugin (non-fatal):", err?.message || err);
  }
};

export default withSentryConfig(withNextIntl(nextConfig), sentryConfig);

