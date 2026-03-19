/**
 * V73: Fallback templates when AI is unavailable
 */
import { BASE_URL } from "@/config/site";

export function templateReddit(keyword: string): { title: string; body: string } {
  const toolUrl = `${BASE_URL}/tools/tiktok-caption-generator`;
  return {
    title: `I made a free tool that helps with ${keyword} (no signup)`,
    body: `Struggling with ${keyword}? I was too.\n\nI built a free AI tool that generates captions, hooks and titles in seconds. No signup required.\n\nTry it: ${toolUrl}`
  };
}

export function templateX(keyword: string): {
  tweet1: string;
  tweet2: string;
  tweet3: string;
  tweet4: string;
  tweet5: string;
} {
  const toolUrl = `${BASE_URL}/tools/tiktok-caption-generator`;
  return {
    tweet1: `Struggling with ${keyword}? I built a free tool that fixes this.`,
    tweet2: `1. Enter your topic\n2. Click generate\n3. Copy & post`,
    tweet3: `Works for TikTok captions, YouTube titles, hooks. All free.`,
    tweet4: `No signup. No paywall. Just paste and go.`,
    tweet5: `Try it: ${toolUrl}`
  };
}

export function templateQuora(keyword: string): { answer: string } {
  const toolUrl = `${BASE_URL}/tools/tiktok-caption-generator`;
  return {
    answer: `Here's how I approach ${keyword}:\n\n1. Start with a clear problem - what are you trying to achieve?\n2. Use a structured process - don't wing it.\n3. Leverage free tools - I use ToolEagle for AI-generated captions and titles. No signup required.\n\nYou can try it here: ${toolUrl}\n\nIt generates TikTok captions, YouTube titles, and hooks in seconds. Hope that helps!`
  };
}
