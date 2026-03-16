import { Metadata } from "next";
import { getSeoPageBySlug } from "@/config/seoPages";
import { SeoPageTemplate } from "@/components/seo/SeoPageTemplate";
import { SITE_URL } from "@/config/site";

const page = getSeoPageBySlug("instagram-captions")!;

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  openGraph: {
    title: page.title,
    description: page.metaDescription,
    url: `${SITE_URL}/instagram-captions`
  }
};

export default function InstagramCaptionsPage() {
  return <SeoPageTemplate page={page} />;
}
