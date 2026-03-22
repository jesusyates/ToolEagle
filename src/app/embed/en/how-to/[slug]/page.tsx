import { notFound } from "next/navigation";
import { EmbedWidgetClient } from "@/app/embed/[keyword]/EmbedWidgetClient";
import { getEnHowToContent, getAllEnHowToSlugs } from "@/lib/en-how-to-content";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllEnHowToSlugs().map((slug) => ({ slug }));
}

export const metadata = {
  robots: "noindex, nofollow"
};

export default async function EmbedEnHowToPage({ params }: Props) {
  const { slug } = await params;
  const content = getEnHowToContent(slug);
  if (!content) notFound();

  const pageUrl = `${BASE_URL}/en/how-to/${slug}`;
  const sample =
    content.directAnswer?.slice(0, 120) ||
    content.intro?.slice(0, 120) ||
    `${content.title} – Free guide`;

  return (
    <EmbedWidgetClient
      slug={slug}
      title={content.title}
      sample={sample}
      pageUrl={pageUrl}
      keyword={content.title}
      lang="en"
    />
  );
}
