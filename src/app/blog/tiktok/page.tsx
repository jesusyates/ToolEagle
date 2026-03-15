import { getAllPosts } from "@/lib/blog";
import { BlogCategoryPage } from "@/components/blog/BlogCategoryPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TikTok Creator Tips & Guides",
  description:
    "TikTok caption ideas, hashtag strategies, and tips to grow your TikTok presence. Use our AI tools to create viral content."
};

export default async function BlogTikTokPage() {
  const posts = await getAllPosts();
  return (
    <BlogCategoryPage
      categorySlug="tiktok"
      categoryLabel="TikTok"
      posts={posts}
      metadata={{
        title: "TikTok Creator Tips",
        description: "TikTok caption ideas, hashtag strategies, and tips to grow your presence."
      }}
    />
  );
}
