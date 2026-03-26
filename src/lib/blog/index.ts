import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";
import { getPublishedBlogPosts, getPublishedPostBySlug } from "./supabase-posts";

export type TocItem = { title: string; id: string };

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  slug: string;
  toc?: TocItem[];
  recommendedTools?: string[];
  author_name?: string;
  author_username?: string;
  category?: string;
};

export type BlogPost = {
  frontmatter: BlogFrontmatter;
  content: string;
  filePath?: string;
  source: "mdx" | "supabase";
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function loadProtectedEnBlogSlugs(): Set<string> {
  const p = path.join(process.cwd(), "generated", "quality-gate", "en-blog-protected-slugs.json");
  try {
    if (!fs.existsSync(p)) return new Set();
    const raw = fs.readFileSync(p, "utf8");
    const parsed = JSON.parse(raw);
    const slugs: unknown = parsed?.slugs;
    if (!Array.isArray(slugs)) return new Set();
    return new Set(slugs.map((s) => String(s)));
  } catch {
    return new Set();
  }
}

export const getAllPostsFromMdx = cache((): BlogPost[] => {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const protectedSlugs = loadProtectedEnBlogSlugs();
  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".mdx"));

  const posts = files
    .map((file) => {
      const fullPath = path.join(BLOG_DIR, file);
      const source = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(source);

      const frontmatter: BlogFrontmatter = {
        title: data.title,
        description: data.description,
        date: data.date,
        tags: data.tags ?? [],
        slug: data.slug ?? file.replace(/\.mdx$/, ""),
        toc: data.toc ?? [],
        recommendedTools: data.recommendedTools ?? [],
        author_name: "ToolEagle",
        category: data.category ?? undefined
      };

      return { frontmatter, content, filePath: fullPath, source: "mdx" as const };
    })
    .filter((p) => !protectedSlugs.has(p.frontmatter.slug))
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));

  return posts;
});

export const getAllPosts = cache(async (): Promise<BlogPost[]> => {
  const mdxPosts = getAllPostsFromMdx();
  const supabasePosts = await getPublishedBlogPosts();
  const supabaseAsBlogPosts: BlogPost[] = supabasePosts.map((p) => ({
    frontmatter: {
      title: p.title,
      description: p.description,
      date: p.created_at,
      tags: p.tags,
      slug: p.slug,
      recommendedTools: p.recommended_tools,
      author_name: p.author_name,
      author_username: p.author_username ?? undefined,
      category: p.category ?? undefined
    },
    content: p.content,
    source: "supabase" as const
  }));
  const combined = [...mdxPosts, ...supabaseAsBlogPosts];
  combined.sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
  return combined;
});

export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const mdxPost = getAllPostsFromMdx().find((p) => p.frontmatter.slug === slug);
  if (mdxPost) return mdxPost;
  const supabasePost = await getPublishedPostBySlug(slug);
  if (!supabasePost) return null;
  return {
    frontmatter: {
      title: supabasePost.title,
      description: supabasePost.description,
      date: supabasePost.created_at,
      tags: supabasePost.tags,
      slug: supabasePost.slug,
      recommendedTools: supabasePost.recommended_tools,
      author_name: supabasePost.author_name,
      author_username: supabasePost.author_username ?? undefined
    },
    content: supabasePost.content,
    source: "supabase"
  };
});

