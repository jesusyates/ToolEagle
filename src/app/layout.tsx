import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "./Analytics";

export const metadata: Metadata = {
  title: {
    default: "ToolEagle - Free Tools for Creators",
    template: "%s | ToolEagle"
  },
  description:
    "ToolEagle is a hub of free, creator-first tools to help you ship TikTok, Reels, Shorts and more—starting with a TikTok Caption Generator.",
  keywords: [
    "ToolEagle",
    "creator tools",
    "TikTok tools",
    "caption generator",
    "social media tools",
    "content creator"
  ],
  openGraph: {
    title: "ToolEagle - Free Tools for Creators",
    description:
      "Free, creator-first tools to help you move from idea to published video faster. Start with the TikTok Caption Generator.",
    type: "website",
    url: "https://www.tooleagle.com",
    siteName: "ToolEagle"
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolEagle - Free Tools for Creators",
    description:
      "Free, creator-first tools to help you move from idea to published video faster."
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

