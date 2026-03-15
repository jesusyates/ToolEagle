import { getAllPosts } from "@/lib/blog";
import { BlogCategoryPage } from "@/components/blog/BlogCategoryPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creator Tips & Strategy",
  description:
    "Strategy guides, growth tips, and best practices for content creators. Learn how to go viral and build your audience."
};

export default async function BlogCreatorTipsPage() {
  const posts = await getAllPosts();
  return (
    <BlogCategoryPage
      categorySlug="creator-tips"
      categoryLabel="Creator Tips"
      posts={posts}
      metadata={{
        title: "Creator Tips & Strategy",
        description: "Strategy guides, growth tips, and best practices for creators."
      }}
    />
  );
}
