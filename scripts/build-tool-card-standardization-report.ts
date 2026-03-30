#!/usr/bin/env npx tsx
/**
 * V171.1 — English tool listing surfaces audit (post-unification truth).
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "generated", "tool-card-standardization-report.json");

const SURFACES = [
  {
    page: "src/components/platform/PlatformToolsPage.tsx",
    tool_slug: "* (per platform grid)",
    card_component: "EnglishToolEntryCard",
    has_usage_count: true,
    normalized: true
  },
  {
    page: "src/app/tools/category/[segment]/page.tsx",
    tool_slug: "* (category grid)",
    card_component: "EnglishToolEntryCard",
    has_usage_count: true,
    normalized: true
  },
  {
    page: "src/app/ai-tools-directory/page.tsx",
    tool_slug: "* (directory grid)",
    card_component: "EnglishToolEntryCard",
    has_usage_count: true,
    normalized: true
  }
];

function main() {
  const doc = {
    version: "171.1",
    generatedAt: new Date().toISOString(),
    note: "EN hub/directory/category listings use EnglishToolEntryCard: icon, title, description (3-line clamp), Usage row (value or —), CTA.",
    pages: SURFACES
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[build-tool-card-standardization-report]", OUT);
}

main();
