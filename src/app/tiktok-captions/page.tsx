import { Metadata } from "next";
import { getSeoPageBySlug } from "@/config/seoPages";
import { SeoPageTemplate } from "@/components/seo/SeoPageTemplate";

const page = getSeoPageBySlug("tiktok-captions")!;

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  openGraph: {
    title: page.title,
    description: page.metaDescription,
    url: "https://www.tooleagle.com/tiktok-captions"
  }
};

export default function TikTokCaptionsPage() {
  return <SeoPageTemplate page={page} />;
}
