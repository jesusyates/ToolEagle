import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

