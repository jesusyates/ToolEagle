/**
 * v46 AI Content Factory
 * Generates captions, hooks, ideas, prompts - writes to public_examples + generated_content
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getAllTopicSlugs } from "@/config/topics";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

type ContentType = "caption" | "hook" | "idea" | "prompt";
type Platform = "tiktok" | "youtube" | "instagram";

const PLATFORM_TOOLS: Record<Platform, Record<"caption" | "hook", { slug: string; name: string }>> = {
  tiktok: {
    caption: { slug: "tiktok-caption-generator", name: "TikTok Caption Generator" },
    hook: { slug: "hook-generator", name: "Hook Generator" }
  },
  youtube: {
    caption: { slug: "tiktok-caption-generator", name: "TikTok Caption Generator" },
    hook: { slug: "hook-generator", name: "Hook Generator" }
  },
  instagram: {
    caption: { slug: "instagram-caption-generator", name: "Instagram Caption Generator" },
    hook: { slug: "hook-generator", name: "Hook Generator" }
  }
};

function pickRandomTopics(count: number): string[] {
  const slugs = getAllTopicSlugs();
  const shuffled = [...slugs].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function generateWithOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  return content ?? "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function buildPrompt(
  contentType: ContentType,
  platform: Platform,
  topicLabel: string
): string {
  switch (contentType) {
    case "caption":
      return `Generate ONE short, punchy ${platform} caption about "${topicLabel}". Max 100 chars. No quotes. Just the caption.`;
    case "hook":
      return `Generate ONE viral ${platform} hook (first line) about "${topicLabel}". Max 80 chars. No quotes. Just the hook.`;
    case "idea":
      return `Generate ONE short-form video content idea about "${topicLabel}". Max 100 chars. No quotes. Just the idea.`;
    case "prompt":
      return `Generate ONE ChatGPT prompt for creating ${platform} content about "${topicLabel}". Start with "Write a prompt that...". Max 150 chars.`;
    default:
      return "";
  }
}

export type ContentFactoryResult = {
  captions: number;
  hooks: number;
  ideas: number;
  prompts: number;
  errors: string[];
};

export async function generateCaptions(
  count: number,
  apiKey: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ generated: number; errors: string[] }> {
  const topics = pickRandomTopics(count);
  const platforms: Platform[] = ["tiktok", "youtube", "instagram"];
  const errors: string[] = [];
  let generated = 0;

  for (let i = 0; i < count; i++) {
    try {
      const topicSlug = topics[i % topics.length];
      const topicLabel = topicSlug.replace(/-/g, " ");
      const platform = platforms[i % platforms.length];
      const tool = PLATFORM_TOOLS[platform].caption;

      const content = await generateWithOpenAI(
        buildPrompt("caption", platform, topicLabel),
        apiKey
      );
      if (!content || content.length < 5) continue;

      const slug =
        tool.slug +
        "-" +
        slugify(topicLabel) +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8);

      await supabase.from("public_examples").insert({
        slug,
        tool_slug: tool.slug,
        tool_name: tool.name,
        input: `AI generated for ${topicLabel}`,
        result: content.slice(0, 500),
        creator_username: "AI Generated",
        creator_id: null,
        source: "generated"
      });

      await supabase.from("generated_content").insert({
        type: "caption",
        topic: topicSlug,
        content: content.slice(0, 500),
        source: "ai",
        platform
      });

      generated++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return { generated, errors };
}

export async function generateHooks(
  count: number,
  apiKey: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ generated: number; errors: string[] }> {
  const topics = pickRandomTopics(count);
  const platforms: Platform[] = ["tiktok", "youtube", "instagram"];
  const errors: string[] = [];
  let generated = 0;

  for (let i = 0; i < count; i++) {
    try {
      const topicSlug = topics[i % topics.length];
      const topicLabel = topicSlug.replace(/-/g, " ");
      const platform = platforms[i % platforms.length];
      const tool = PLATFORM_TOOLS[platform].hook;

      const content = await generateWithOpenAI(
        buildPrompt("hook", platform, topicLabel),
        apiKey
      );
      if (!content || content.length < 5) continue;

      const slug =
        tool.slug +
        "-" +
        slugify(topicLabel) +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8);

      await supabase.from("public_examples").insert({
        slug,
        tool_slug: tool.slug,
        tool_name: tool.name,
        input: `AI generated for ${topicLabel}`,
        result: content.slice(0, 500),
        creator_username: "AI Generated",
        creator_id: null,
        source: "generated"
      });

      await supabase.from("generated_content").insert({
        type: "hook",
        topic: topicSlug,
        content: content.slice(0, 500),
        source: "ai",
        platform
      });

      generated++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return { generated, errors };
}

export async function generateIdeas(
  count: number,
  apiKey: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ generated: number; errors: string[] }> {
  const topics = pickRandomTopics(count);
  const errors: string[] = [];
  let generated = 0;

  for (let i = 0; i < count; i++) {
    try {
      const topicSlug = topics[i % topics.length];
      const topicLabel = topicSlug.replace(/-/g, " ");

      const content = await generateWithOpenAI(
        buildPrompt("idea", "tiktok", topicLabel),
        apiKey
      );
      if (!content || content.length < 5) continue;

      await supabase.from("generated_content").insert({
        type: "idea",
        topic: topicSlug,
        content: content.slice(0, 500),
        source: "ai"
      });

      generated++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return { generated, errors };
}

export async function generatePrompts(
  count: number,
  apiKey: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ generated: number; errors: string[] }> {
  const topics = pickRandomTopics(count);
  const platforms: Platform[] = ["tiktok", "youtube", "instagram"];
  const errors: string[] = [];
  let generated = 0;

  for (let i = 0; i < count; i++) {
    try {
      const topicSlug = topics[i % topics.length];
      const topicLabel = topicSlug.replace(/-/g, " ");
      const platform = platforms[i % platforms.length];

      const content = await generateWithOpenAI(
        buildPrompt("prompt", platform, topicLabel),
        apiKey
      );
      if (!content || content.length < 10) continue;

      await supabase.from("generated_content").insert({
        type: "prompt",
        topic: topicSlug,
        content: content.slice(0, 500),
        source: "ai",
        platform
      });

      generated++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return { generated, errors };
}

export async function runContentFactory(config?: {
  captions?: number;
  hooks?: number;
  ideas?: number;
  prompts?: number;
}): Promise<ContentFactoryResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      captions: 0,
      hooks: 0,
      ideas: 0,
      prompts: 0,
      errors: ["OPENAI_API_KEY not configured"]
    };
  }

  const captions = config?.captions ?? 100;
  const hooks = config?.hooks ?? 50;
  const ideas = config?.ideas ?? 50;
  const prompts = config?.prompts ?? 25;

  const supabase = createAdminClient();
  const allErrors: string[] = [];

  const [capRes, hookRes, ideaRes, promptRes] = await Promise.all([
    generateCaptions(captions, apiKey, supabase),
    generateHooks(hooks, apiKey, supabase),
    generateIdeas(ideas, apiKey, supabase),
    generatePrompts(prompts, apiKey, supabase)
  ]);

  allErrors.push(...capRes.errors, ...hookRes.errors, ...ideaRes.errors, ...promptRes.errors);

  return {
    captions: capRes.generated,
    hooks: hookRes.generated,
    ideas: ideaRes.generated,
    prompts: promptRes.generated,
    errors: allErrors
  };
}
