import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Script from "next/script";
import PlausibleProvider from "next-plausible";
import "./globals.css";
import { Analytics } from "./Analytics";
import { CookieConsent } from "@/components/CookieConsent";
import { SITE_URL } from "@/config/site";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // v62.1: Baidu site verification (set BAIDU_SITE_VERIFICATION env or replace placeholder)
  verification: {
    other: {
      "baidu-site-verification":
        process.env.BAIDU_SITE_VERIFICATION || "code-placeholder",
      "impact-site-verification": "a49e2a8e-2bee-41df-a1ae-b88fa1e7f575"
    }
  },
  title: {
    default: "ToolEagle - Free Tools for Creators",
    template: "%s | ToolEagle"
  },
  description:
    "AI Tools for TikTok, YouTube and Instagram creators. Generate captions, hashtags, hooks and titles in seconds. Free and no sign-up.",
  keywords: [
    "ToolEagle",
    "creator tools",
    "TikTok tools",
    "caption generator",
    "hashtag generator",
    "hook generator",
    "title generator",
    "social media tools",
    "content creator"
  ],
  openGraph: {
    title: "ToolEagle - AI Tools for TikTok, YouTube and Instagram creators",
    description:
      "AI Tools for TikTok, YouTube and Instagram creators. Generate captions, hashtags, hooks and titles in seconds. Free and no sign-up.",
    type: "website",
    url: SITE_URL,
    siteName: "ToolEagle"
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolEagle - AI Tools for TikTok, YouTube and Instagram creators",
    description:
      "AI Tools for TikTok, YouTube and Instagram creators. Generate captions, hashtags, hooks and titles in seconds."
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  // v62.1: zh-CN for /zh/* pages (Baidu SEO)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const htmlLang = pathname.startsWith("/zh") ? "zh-CN" : locale;

  // V74.3: Disable browser translation on Tool/Dashboard/Auth/Admin (revenue-critical, stability first)
  const disableTranslation =
    pathname.startsWith("/tools") ||
    pathname.startsWith("/zh/tools") ||
    pathname === "/tiktok-caption-generator" ||
    pathname === "/youtube-title-generator" ||
    pathname === "/hook-generator" ||
    pathname.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname === "/ai-prompt-improver" ||
    pathname === "/prompt-playground";

  const baiduCode = process.env.BAIDU_SITE_VERIFICATION;

  const content = (
    <>
      <Script id="translate-resilience" strategy="beforeInteractive">
        {`(function(){if(typeof Node==="undefined"||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c.parentNode!==this)return c;return r.apply(this,arguments)};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this)return n;return i.apply(this,arguments)}})();`}
      </Script>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <Analytics />
        {children}
        <CookieConsent />
      </NextIntlClientProvider>
    </>
  );

  return (
    <html lang={htmlLang} translate={disableTranslation ? "no" : undefined} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        {baiduCode && (
          <meta name="baidu-site-verification" content={baiduCode} />
        )}
        <meta name="impact-site-verification" content="a49e2a8e-2bee-41df-a1ae-b88fa1e7f575" />
      </head>
      <body suppressHydrationWarning>
        {PLAUSIBLE_DOMAIN ? (
          <PlausibleProvider domain={PLAUSIBLE_DOMAIN} trackLocalhost={process.env.NODE_ENV === "development"}>
            {content}
          </PlausibleProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}

