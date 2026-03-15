import { getAllPosts } from "@/lib/blog";
import { BlogCategoryPage } from "@/components/blog/BlogCategoryPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Instagram Creator Tips & Guides",
  description:
    "Instagram caption ideas, Reels tips, and hashtag strategies. Use our AI tools to create engaging Instagram content."
};

export default async function BlogInstagramPage() {
  const posts = await getAllPosts();
  return (
    <BlogCategoryPage
      categorySlug="instagram"
      categoryLabel="Instagram"
      posts={posts}
      metadata={{
        title: "Instagram Creator Tips",
        description: "Instagram captions, Reels tips, and hashtag strategies for growth."
      }}
    />
  );
}
