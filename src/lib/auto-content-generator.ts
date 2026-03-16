/**
 * Auto Content Generator - v27
 * Generates caption/hook examples for public_examples
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { TOPICS, getAllTopicSlugs } from "@/config/topics";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

type Platform = "tiktok" | "youtube" | "instagram";
type ContentType = "caption" | "hook";

type GeneratedExample = {
  platform: Platform;
  content_type: ContentType;
  topic: string;
  content: string;
  tool_slug: string;
  tool_name: string;
  input: string;
};

const PLATFORM_TOOLS: Record<Platform, Record<ContentType, { slug: string; name: string }>> = {
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

async function generateWithOpenAI(
  prompt: string,
  apiKey: string
): Promise<string> {
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
      max_tokens: 150
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

export async function generateExamples(count: number = 50): Promise<{
  generated: number;
  errors: string[];
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { generated: 0, errors: ["OPENAI_API_KEY not configured"] };
  }

  const topics = pickRandomTopics(Math.ceil(count / 2));
  const platforms: Platform[] = ["tiktok", "youtube", "instagram"];
  const contentTypes: ContentType[] = ["caption", "hook"];
  const errors: string[] = [];
  let generated = 0;

  const supabase = createAdminClient();

  for (let i = 0; i < count; i++) {
    try {
      const topicSlug = topics[i % topics.length];
      const topicLabel = topicSlug.replace(/-/g, " ");
      const platform = platforms[i % platforms.length];
      const contentType = contentTypes[i % 2];
      const tool = PLATFORM_TOOLS[platform][contentType];

      const prompt =
        contentType === "caption"
          ? `Generate ONE short, punchy ${platform} caption about "${topicLabel}". Max 100 chars. No quotes. Just the caption.`
          : `Generate ONE viral ${platform} hook (first line) about "${topicLabel}". Max 80 chars. No quotes. Just the hook.`;

      const content = await generateWithOpenAI(prompt, apiKey);
      if (!content || content.length < 5) continue;

      const slug =
        tool.slug +
        "-" +
        slugify(topicLabel) +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8);

      const { error } = await supabase.from("public_examples").insert({
        slug,
        tool_slug: tool.slug,
        tool_name: tool.name,
        input: `AI generated for ${topicLabel}`,
        result: content.slice(0, 500),
        creator_username: "AI Generated",
        creator_id: null,
        source: "generated"
      });

      if (error) {
        errors.push(`Insert failed: ${error.message}`);
        continue;
      }
      generated++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return { generated, errors };
}
