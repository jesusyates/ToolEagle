import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnHowToPageTemplate } from "@/components/seo/EnHowToPageTemplate";
import { getEnHowToContent, getAllEnHowToSlugs } from "@/lib/en-how-to-content";
import { BASE_URL } from "@/config/site";
import { limitBuildStaticParams } from "@/lib/build-static-params-limit";

type Props = { params: Promise<{ topic: string }> };

export async function generateStaticParams() {
  return limitBuildStaticParams(getAllEnHowToSlugs().map((topic) => ({ topic })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const content = getEnHowToContent(topic);

  if (!content) return { title: "Not Found" };

  const url = `${BASE_URL}/pt/how-to/${topic}`;

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

export default async function PtHowToPage({ params }: Props) {
  const { topic } = await params;
  const content = getEnHowToContent(topic);

  if (!content) notFound();

  return <EnHowToPageTemplate content={content} locale="pt" />;
}
