import { Metadata } from "next";
import { getSeoPageBySlug } from "@/config/seoPages";
import { SeoPageTemplate } from "@/components/seo/SeoPageTemplate";

const page = getSeoPageBySlug("instagram-captions")!;

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  openGraph: {
    title: page.title,
    description: page.metaDescription,
    url: "https://www.tooleagle.com/instagram-captions"
  }
};

export default function InstagramCaptionsPage() {
  return <SeoPageTemplate page={page} />;
}
