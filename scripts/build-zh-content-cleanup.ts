#!/usr/bin/env npx tsx
/**
 * V171.1 — Scan src/app/zh/ tree (.tsx) for English pollution signals → generated/zh-content-cleanup.json
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ZH_APP = path.join(ROOT, "src", "app", "zh");
const OUT = path.join(ROOT, "generated", "zh-content-cleanup.json");

/** Heuristic: likely user-visible English in zh routes */
const PATTERNS: { issue_type: string; re: RegExp }[] = [
  { issue_type: "english_cta_open_tool", re: /\bOpen tool\b/i },
  { issue_type: "english_all_tools", re: /\bAll tools\b/i },
  { issue_type: "english_creator_mode", re: /Creator Mode/i },
  { issue_type: "english_read_article", re: /Read article/i },
  { issue_type: "english_share_best", re: /Share your best/i },
  { issue_type: "english_generating", re: /Generating\.\.\./ },
  { issue_type: "english_please_keep", re: /Please keep under/i },
  { issue_type: "locale_en_jsx", re: /locale\s*=\s*["']en["']/ },
  { issue_type: "getToolCardBody_en", re: /getToolCardBody\s*\(\s*["']en["']/ },
  { issue_type: "english_free_ai_footer", re: /Free AI Creator Tools/i }
];

function walk(dir: string, acc: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name.startsWith("_")) walk(p, acc);
      else walk(p, acc);
    } else if (name.name.endsWith(".tsx")) acc.push(p);
  }
}

function routeFromFile(abs: string): string | null {
  const rel = path.relative(ZH_APP, abs).replace(/\\/g, "/");
  if (rel === "page.tsx") return "/zh";
  if (rel.endsWith("/page.tsx")) return "/zh/" + rel.slice(0, -"/page.tsx".length);
  return null;
}

function main() {
  const files: string[] = [];
  walk(ZH_APP, files);

  const issues: Array<{ path: string; issue_type: string; source: string; action: string }> = [];
  const excluded = new Set<string>();

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const route = routeFromFile(file);
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");

    for (const { issue_type, re } of PATTERNS) {
      if (re.test(text)) {
        issues.push({
          path: route ?? rel,
          issue_type,
          source: rel,
          action: "exclude_sitemap_until_fixed"
        });
        if (route) excluded.add(route);
      }
    }
  }

  const doc = {
    version: "171.1",
    generatedAt: new Date().toISOString(),
    zh_content_cleaner: issues.length > 0 ? ("partially_active" as const) : ("active" as const),
    issues,
    excludedSitemapPaths: [...excluded].sort()
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[build-zh-content-cleanup]", OUT, { issues: issues.length, excluded: excluded.size });
}

main();
