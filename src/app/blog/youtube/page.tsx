import { getAllPosts } from "@/lib/blog";
import { BlogCategoryPage } from "@/components/blog/BlogCategoryPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "YouTube Creator Tips & Guides",
  description:
    "YouTube title formulas, description tips, and strategies to grow your channel. Use our AI tools for better videos."
};

export default async function BlogYouTubePage() {
  const posts = await getAllPosts();
  return (
    <BlogCategoryPage
      categorySlug="youtube"
      categoryLabel="YouTube"
      posts={posts}
      metadata={{
        title: "YouTube Creator Tips",
        description: "YouTube title formulas, description tips, and channel growth strategies."
      }}
    />
  );
}
