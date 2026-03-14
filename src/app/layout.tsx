import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "./Analytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tooleagle.com"),
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
    url: "https://www.tooleagle.com",
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
  const messages = await getMessages();

  return (
    <html lang="en">
      <body>
        <Script id="translate-resilience" strategy="beforeInteractive">
          {`(function(){if(typeof Node==="undefined"||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c.parentNode!==this)return c;return r.apply(this,arguments)};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this)return n;return i.apply(this,arguments)}})();`}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <Analytics />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

