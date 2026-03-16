/**
 * v47 - Query generated_content for prompts and ideas
 */

import { createClient } from "@/lib/supabase/server";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";

const PAGE_SIZE = 50;

export type GeneratedContentRow = {
  id: string;
  type: string;
  topic: string;
  content: string;
  source: string;
  platform: string | null;
  created_at: string;
};

const PLATFORMS = ["tiktok", "youtube", "instagram"];

export async function getPromptsByTopic(
  topic: string,
  page: number = 0
): Promise<{ items: GeneratedContentRow[]; total: number }> {
  const cacheKeyStr = cacheKey("prompt_topic", topic, String(page));
  const cached = await cacheGet<{ items: GeneratedContentRow[]; total: number }>(cacheKeyStr);
  if (cached) return cached;

  try {
    const supabase = await createClient();
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const q = supabase
      .from("generated_content")
      .select("id, type, topic, content, source, platform, created_at", { count: "exact" })
      .eq("type", "prompt")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (PLATFORMS.includes(topic)) {
      q.eq("platform", topic);
    } else {
      q.eq("topic", topic);
    }

    const { data, count } = await q;

    const result = {
      items: (data ?? []) as GeneratedContentRow[],
      total: count ?? 0
    };
    await cacheSet(cacheKeyStr, result);
    return result;
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getPromptById(id: string): Promise<GeneratedContentRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("generated_content")
      .select("id, type, topic, content, source, platform, created_at")
      .eq("id", id)
      .eq("type", "prompt")
      .single();

    return data as GeneratedContentRow | null;
  } catch {
    return null;
  }
}

export async function getIdeasByTopic(
  topic: string,
  page: number = 0
): Promise<{ items: GeneratedContentRow[]; total: number }> {
  const cacheKeyStr = cacheKey("idea_topic", topic, String(page));
  const cached = await cacheGet<{ items: GeneratedContentRow[]; total: number }>(cacheKeyStr);
  if (cached) return cached;

  try {
    const supabase = await createClient();
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
      .from("generated_content")
      .select("id, type, topic, content, source, platform, created_at", { count: "exact" })
      .eq("type", "idea")
      .eq("topic", topic)
      .order("created_at", { ascending: false })
      .range(from, to);

    const result = {
      items: (data ?? []) as GeneratedContentRow[],
      total: count ?? 0
    };
    await cacheSet(cacheKeyStr, result);
    return result;
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getIdeaById(id: string): Promise<GeneratedContentRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("generated_content")
      .select("id, type, topic, content, source, platform, created_at")
      .eq("id", id)
      .eq("type", "idea")
      .single();

    return data as GeneratedContentRow | null;
  } catch {
    return null;
  }
}

export async function getAllPromptTopics(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("generated_content")
      .select("topic, platform")
      .eq("type", "prompt");
    const topics = new Set<string>();
    (data ?? []).forEach((r) => {
      if (r.topic) topics.add(r.topic);
      if (r.platform) topics.add(r.platform);
    });
    return [...topics];
  } catch {
    return [];
  }
}

export async function getAllIdeaTopics(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("generated_content")
      .select("topic")
      .eq("type", "idea")
      .order("topic");
    const topics = [...new Set((data ?? []).map((r) => r.topic).filter(Boolean))];
    return topics;
  } catch {
    return [];
  }
}
