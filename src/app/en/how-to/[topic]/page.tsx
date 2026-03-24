import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EnHowToPageTemplate } from "@/components/seo/EnHowToPageTemplate";
import { getEnHowToContent, getAllEnHowToSlugs, resolveEnHowToSlug } from "@/lib/en-how-to-content";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return getAllEnHowToSlugs().map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const resolvedTopic = resolveEnHowToSlug(topic);
  const content = getEnHowToContent(resolvedTopic);

  if (!content) return { title: "Not Found" };

  const url = `${BASE_URL}/en/how-to/${resolvedTopic}`;

  return {
    title: content.title,
    description: content.description.slice(0, 160),
    openGraph: {
      title: content.title,
      description: content.description.slice(0, 160),
      url,
      type: "article"
    },
    alternates: { canonical: url }
  };
}

export default async function EnHowToPage({ params }: Props) {
  const { topic } = await params;
  const resolvedTopic = resolveEnHowToSlug(topic);
  if (resolvedTopic !== topic) {
    redirect(`/en/how-to/${resolvedTopic}`);
  }
  const content = getEnHowToContent(resolvedTopic);

  if (!content) notFound();

  return <EnHowToPageTemplate content={content} />;
}
