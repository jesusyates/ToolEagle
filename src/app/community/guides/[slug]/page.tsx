import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";
import { getCreatorPost } from "@/lib/creator-posts";
import { CreatorPostPage } from "@/components/community/CreatorPostPage";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCreatorPost("guide", slug);
  if (!post) return { title: "Not Found" };
  const title = `${post.title} | ToolEagle Community`;
  const desc = post.content.slice(0, 160).replace(/\n/g, " ");
  return {
    title,
    description: desc,
    alternates: { canonical: `${BASE_URL}/community/guides/${slug}` },
    openGraph: { title, description: desc, url: `${BASE_URL}/community/guides/${slug}` }
  };
}

export default async function CommunityGuidePage({ params }: Props) {
  const { slug } = await params;
  const post = await getCreatorPost("guide", slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <CreatorPostPage post={post} type="guide" />
      </div>
      <SiteFooter />
    </main>
  );
}
