import { Metadata } from "next";
import { getSeoPageBySlug } from "@/config/seoPages";
import { SeoPageTemplate } from "@/components/seo/SeoPageTemplate";
import { SITE_URL } from "@/config/site";

const page = getSeoPageBySlug("youtube-titles")!;

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  openGraph: {
    title: page.title,
    description: page.metaDescription,
    url: `${SITE_URL}/youtube-titles`
  }
};

export default function YouTubeTitlesPage() {
  return <SeoPageTemplate page={page} />;
}
