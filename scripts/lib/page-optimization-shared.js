/**
 * V112 — Shared helpers for page optimization (CTR / SERP efficiency)
 */

const fs = require("fs");
const path = require("path");

const PATH_SEARCH = path.join(process.cwd(), "generated", "search-performance.json");
const PATH_GROWTH = path.join(process.cwd(), "generated", "growth-priority.json");
const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function blogSlugFromPath(pathname) {
  if (!pathname || !pathname.startsWith("/blog/")) return null;
  const rest = pathname.replace(/\/$/, "").slice("/blog/".length);
  if (!rest || rest.includes("/")) return null;
  return rest;
}

function classifyBlogFromPath(pathname) {
  return pathname?.startsWith("/blog/") ? "blog" : null;
}

/** First paragraph: text after frontmatter until first ## heading */
function extractIntroFromBody(body) {
  const s = String(body || "").trim();
  if (!s) return "";
  const lines = s.split("\n");
  const out = [];
  for (const line of lines) {
    if (/^#{1,6}\s/.test(line.trim())) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

function wordCount(s) {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

module.exports = {
  PATH_SEARCH,
  PATH_GROWTH,
  BLOG_DIR,
  safeReadJson,
  blogSlugFromPath,
  classifyBlogFromPath,
  extractIntroFromBody,
  wordCount
};
