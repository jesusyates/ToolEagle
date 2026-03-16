/**
 * v52 - Creator posts data access
 */

import { createClient } from "@/lib/supabase/server";

export type CreatorPostType = "prompt" | "idea" | "guide";

export type CreatorPost = {
  id: string;
  creator_id: string;
  type: CreatorPostType;
  title: string;
  content: string;
  topic: string | null;
  slug: string;
  status: string;
  tags: string[];
  tools: string[];
  created_at: string;
  creators?: { username: string; display_name: string | null; avatar_url: string | null };
};

export type Creator = {
  id: string;
  user_id: string | null;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  twitter: string | null;
  youtube: string | null;
  created_at: string;
};

export async function getCreatorByUsername(username: string): Promise<Creator | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creators")
    .select("*")
    .ilike("username", username.trim())
    .single();
  return data;
}

export async function getCreatorPostsByUsername(
  username: string,
  type?: CreatorPostType
): Promise<CreatorPost[]> {
  const supabase = await createClient();
  let q = supabase
    .from("creator_posts")
    .select("*, creators(username, display_name, avatar_url)")
    .eq("status", "published");
  const { data: creator } = await supabase.from("creators").select("id").ilike("username", username.trim()).single();
  if (!creator) return [];
  q = q.eq("creator_id", creator.id);
  if (type) q = q.eq("type", type);
  const { data } = await q.order("created_at", { ascending: false });
  return (data ?? []) as CreatorPost[];
}

export async function getCreatorPost(type: CreatorPostType, slug: string): Promise<CreatorPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_posts")
    .select("*, creators(username, display_name, avatar_url, bio, website, twitter, youtube)")
    .eq("type", type)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data as CreatorPost | null;
}

export async function getLatestCreatorPosts(limit = 24): Promise<CreatorPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_posts")
    .select("*, creators(username, display_name, avatar_url)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as CreatorPost[];
}

export async function getRelatedCreatorPosts(
  type: CreatorPostType,
  topic: string | null,
  excludeId: string,
  limit = 6
): Promise<CreatorPost[]> {
  const supabase = await createClient();
  let q = supabase
    .from("creator_posts")
    .select("*, creators(username, display_name, avatar_url)")
    .eq("type", type)
    .eq("status", "published")
    .neq("id", excludeId);
  if (topic) q = q.eq("topic", topic);
  const { data } = await q.order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as CreatorPost[];
}

export async function getAllCreatorPostSlugs(type: CreatorPostType): Promise<{ slug: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_posts")
    .select("slug")
    .eq("type", type)
    .eq("status", "published");
  return (data ?? []).map((r) => ({ slug: r.slug }));
}
