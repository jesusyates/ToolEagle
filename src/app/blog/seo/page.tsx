import { getAllPosts } from "@/lib/blog";
import { BlogCategoryPage } from "@/components/blog/BlogCategoryPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SEO & search engines for creators",
  description:
    "How discovery, crawling, and indexing work—so your pages and tools can earn sustainable search traffic."
};

export default async function BlogSeoCategoryPage() {
  const posts = await getAllPosts();

  return (
    <BlogCategoryPage
      categorySlug="seo"
      categoryLabel="SEO & Search"
      posts={posts}
      metadata={metadata}
    />
  );
}
