/**
 * V178 — stdout JSON array { slug, toolSlug, platform, toolName } for auto-execution manifest.
 * Run: npx tsx scripts/extract-answer-pages-for-v178.ts
 */
import { ANSWER_PAGES } from "../src/config/answers";

const rows = ANSWER_PAGES.map((a) => ({
  slug: a.slug,
  toolSlug: a.toolSlug,
  platform: a.platform,
  toolName: a.toolName
}));

process.stdout.write(JSON.stringify(rows));
