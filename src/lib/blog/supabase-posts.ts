import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type SupabaseBlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  author_name: string;
  status: string;
  category: string | null;
  tags: string[];
  recommended_tools: string[];
  created_at: string;
  updated_at: string;
};

export const getPublishedBlogPosts = cache(async (): Promise<SupabaseBlogPost[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, description, author_name, status, category, tags, recommended_tools, created_at, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      content: r.content,
      description: r.description ?? r.title,
      author_name: r.author_name ?? "Creator",
      status: r.status,
      category: r.category,
      tags: (r.tags as string[]) ?? [],
      recommended_tools: (r.recommended_tools as string[]) ?? [],
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  } catch {
    return [];
  }
});

export const getPublishedPostBySlug = cache(async (slug: string): Promise<SupabaseBlogPost | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, description, author_name, status, category, tags, recommended_tools, created_at, updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      description: data.description ?? data.title,
      author_name: data.author_name ?? "Creator",
      status: data.status,
      category: data.category,
      tags: (data.tags as string[]) ?? [],
      recommended_tools: (data.recommended_tools as string[]) ?? [],
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch {
    return null;
  }
});
