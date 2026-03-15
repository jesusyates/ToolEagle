import { getAllPosts } from "@/lib/blog";
import { BlogCategoryPage } from "@/components/blog/BlogCategoryPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Tools for Creators",
  description:
    "How to use AI tools for captions, titles, hashtags and more. Tips and guides for ToolEagle and creator AI."
};

export default async function BlogAIToolsPage() {
  const posts = await getAllPosts();
  return (
    <BlogCategoryPage
      categorySlug="ai-tools"
      categoryLabel="AI Tools"
      posts={posts}
      metadata={{
        title: "AI Tools for Creators",
        description: "How to use AI for captions, titles, hashtags and more."
      }}
    />
  );
}
