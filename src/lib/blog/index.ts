import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";

export type TocItem = { title: string; id: string };

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  slug: string;
  toc?: TocItem[];
  recommendedTools?: string[];
};

export type BlogPost = {
  frontmatter: BlogFrontmatter;
  content: string;
  filePath: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export const getAllPosts = cache((): BlogPost[] => {
  if (!fs.existsSync(BLOG_DIR)) return [];

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
        recommendedTools: data.recommendedTools ?? []
      };

      return { frontmatter, content, filePath: fullPath };
    })
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));

  return posts;
});

export const getPostBySlug = cache((slug: string): BlogPost | null => {
  const posts = getAllPosts();
  return posts.find((post) => post.frontmatter.slug === slug) ?? null;
});

