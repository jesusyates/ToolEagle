import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "./Analytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tooleagle.com"),
  title: {
    default: "ToolEagle - Free Tools for Creators",
    template: "%s | ToolEagle"
  },
  description:
    "AI tools for creators. Generate captions, hashtags, hooks and titles in seconds. Free TikTok, Reels, Shorts and YouTube tools.",
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
    title: "ToolEagle - AI Tools for Creators",
    description:
      "AI-powered tools for creators. Generate captions, hashtags, hooks and titles in seconds. Free and no sign-up required.",
    type: "website",
    url: "https://www.tooleagle.com",
    siteName: "ToolEagle"
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolEagle - AI Tools for Creators",
    description:
      "AI-powered tools for creators. Generate captions, hashtags, hooks and titles in seconds."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  );
}

