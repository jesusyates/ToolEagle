import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ToolEagle - Free Tools for Creators",
  description: "ToolEagle offers simple, free tools for modern creators, starting with a TikTok Caption Generator."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

