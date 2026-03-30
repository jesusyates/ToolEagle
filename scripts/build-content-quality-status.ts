#!/usr/bin/env npx tsx
/**
 * V171.2 — All EN programmatic SEO surfaces → generated/content-quality-status.json
 * Hard suppression triad: noindex + sitemap exclude + internal_link_exclude (no soft pool).
 */

import fs from "fs";
import path from "path";
import { getSeoPageParams, getExamplesForTopic } from "../src/config/seo-pages";
import { ANSWER_PAGES } from "../src/config/answers";
import { CAPTION_HOOK_TOPICS } from "../src/config/caption-hook-topics";
import { getAllTopicSlugs, getTopic } from "../src/config/topics";
import { getAllCaptionStyleParams, getCaptionStyleConfig } from "../src/config/caption-styles";
import { getAllSeoExpansionParams, getSeoExpansionConfig } from "../src/config/seo-expansion";
import { getIndexableSeoParams } from "../src/config/seo/index";
import { getRealExamples } from "../src/config/seo/content-templates";
import {
  evaluateAnswerTemplatePage,
  evaluateIdeasTopicHubPage,
  evaluateIdeasTopicPage,
  evaluateProgrammaticListPage,
  type V171PageQuality
} from "../src/lib/seo/content-quality-evaluate";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "generated", "content-quality-status.json");
const LOG = path.join(ROOT, "logs", "content-quality-decisions.jsonl");

const SEO_EXPANSION_PREFIXES = [
  "best-captions",
  "best-hooks",
  "caption-ideas",
  "content-ideas",
  "video-ideas",
  "post-ideas"
] as const;

function appendLog(row: Record<string, unknown>) {
  fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n", "utf8");
}

function collectActions(
  q: V171PageQuality,
  excludedSitemapPaths: Set<string>,
  noindexPaths: Set<string>,
  internalLinkExcludePaths: Set<string>
) {
  for (const a of q.actions) {
    if (a === "exclude_sitemap") excludedSitemapPaths.add(q.path);
    if (a === "noindex") noindexPaths.add(q.path);
    if (a === "internal_link_exclude") internalLinkExcludePaths.add(q.path);
  }
}

function main() {
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.writeFileSync(LOG, "");

  const pages: V171PageQuality[] = [];
  const excludedSitemapPaths = new Set<string>();
  const noindexPaths = new Set<string>();
  const internalLinkExcludePaths = new Set<string>();
  /** Paths whose indexability depends on Supabase public_examples at runtime. */
  const runtimeExampleGatedPaths: string[] = [];

  for (const { category, topic } of getSeoPageParams()) {
    const examples = getExamplesForTopic(topic, category);
    const q = evaluateIdeasTopicPage(category, topic, examples);
    pages.push(q);
    appendLog({ pageType: "ideas_topic", path: q.path, score: q.score, signals: q.signals, actions: q.actions });
    collectActions(q, excludedSitemapPaths, noindexPaths, internalLinkExcludePaths);
  }

  for (const ans of ANSWER_PAGES) {
    const q = evaluateAnswerTemplatePage(ans);
    pages.push(q);
    appendLog({ pageType: "answer", path: q.path, score: q.score, signals: q.signals, actions: q.actions });
    collectActions(q, excludedSitemapPaths, noindexPaths, internalLinkExcludePaths);
  }

  for (const topic of CAPTION_HOOK_TOPICS) {
    const ex = getRealExamples("captions", topic);
    const q = evaluateProgrammaticListPage(`/captions/${topic}`, "captions_topic", ex, [
      `${topic} captions for TikTok and Instagram`,
      "Copy examples or generate your own with AI."
    ]);
    pages.push(q);
    appendLog({ pageType: "captions_topic", path: q.path, score: q.score, signals: q.signals, actions: q.actions });
    collectActions(q, excludedSitemapPaths, noindexPaths, internalLinkExcludePaths);
  }

  for (const topic of CAPTION_HOOK_TOPICS) {
    const ex = getRealExamples("hooks", topic);
    const q = evaluateProgrammaticListPage(`/hooks/${topic}`, "hooks_topic", ex, [
      `${topic} hooks for YouTube, TikTok and Shorts`,
      "Copy examples or generate your own with AI."
    ]);
    pages.push(q);
    appendLog({ pageType: "hooks_topic", path: q.path, score: q.score, signals: q.signals, actions: q.actions });
    collectActions(q, excludedSitemapPaths, noindexPaths, internalLinkExcludePaths);
  }

  for (const { topic, style } of getAllCaptionStyleParams()) {
    const cfg = getCaptionStyleConfig(topic, style);
    if (!cfg) continue;
    const p = `/captions/${topic}/${style}`;
    const q = evaluateProgrammaticListPage(p, "captions_style", getRealExamples("captions", topic), [
      cfg.title,
      cfg.description,
      ...cfg.tips
    ]);
    pages.push(q);
    appendLog({ pageType: "captions_style", path: q.path, score: q.score, signals: q.signals, actions: q.actions });
    collectActions(q, excludedSitemapPaths, noindexPaths, internalLinkExcludePaths);
  }

  for (const { pageType, topic } of getAllSeoExpansionParams()) {
    const cfg = getSeoExpansionConfig(pageType, topic);
    if (!cfg) continue;
    const p = `/${pageType}/${topic}`;
    const q = evaluateProgrammaticListPage(p, "seo_expansion", cfg.tips, [cfg.title, cfg.description, cfg.metaTitle]);
    pages.push(q);
    appendLog({ pageType: "seo_expansion", path: q.path, score: q.score, signals: q.signals, actions: q.actions });
    collectActions(q, excludedSitemapPaths, noindexPaths, internalLinkExcludePaths);
  }

  for (const slug of getAllTopicSlugs()) {
    const p = `/captions-for/${slug}`;
    runtimeExampleGatedPaths.push(p);
    const stub: V171PageQuality = {
      path: p,
      pageType: "captions_for",
      signals: ["runtime_example_gate"],
      score: 100,
      actions: []
    };
    pages.push(stub);
    appendLog({ pageType: "captions_for", path: p, note: "runtime_example_gate" });
  }

  for (const slug of getAllTopicSlugs()) {
    const p = `/hooks-for/${slug}`;
    runtimeExampleGatedPaths.push(p);
    const stub: V171PageQuality = {
      path: p,
      pageType: "hooks_for",
      signals: ["runtime_example_gate"],
      score: 100,
      actions: []
    };
    pages.push(stub);
    appendLog({ pageType: "hooks_for", path: p, note: "runtime_example_gate" });
  }

  for (const slug of getAllTopicSlugs()) {
    const p = `/hashtags-for/${slug}`;
    runtimeExampleGatedPaths.push(p);
    const stub: V171PageQuality = {
      path: p,
      pageType: "hashtags_for",
      signals: ["runtime_example_gate"],
      score: 100,
      actions: []
    };
    pages.push(stub);
    appendLog({ pageType: "hashtags_for", path: p, note: "runtime_example_gate" });
  }

  for (const slug of getAllTopicSlugs()) {
    const t = getTopic(slug);
    if (!t) continue;
    const q = evaluateIdeasTopicHubPage(slug, t.title, t.intro);
    pages.push(q);
    appendLog({ pageType: "ideas_topic_hub", path: q.path, score: q.score, signals: q.signals, actions: q.actions });
    collectActions(q, excludedSitemapPaths, noindexPaths, internalLinkExcludePaths);
  }

  for (const { platform, type, topic } of getIndexableSeoParams()) {
    const p = `/${platform}/${type}/${topic}`;
    const ex = getRealExamples(type, topic);
    const q = evaluateProgrammaticListPage(p, "seo_grid", ex, [
      `${topic} ${platform} ${type}`,
      "Copy and use instantly or generate more with AI."
    ]);
    pages.push(q);
    appendLog({ pageType: "seo_grid", path: q.path, score: q.score, signals: q.signals, actions: q.actions });
    collectActions(q, excludedSitemapPaths, noindexPaths, internalLinkExcludePaths);
  }

  const summary = {
    version: "171.2",
    totalPages: pages.length,
    ideasTopics: getSeoPageParams().length,
    answers: ANSWER_PAGES.length,
    captionHookTopics: CAPTION_HOOK_TOPICS.length * 2,
    excludedSitemap: excludedSitemapPaths.size,
    noindex: noindexPaths.size,
    internalLinkExclude: internalLinkExcludePaths.size,
    runtimeExampleGated: runtimeExampleGatedPaths.length,
    thinPages: pages.filter((p) => p.actions.length > 0).length
  };

  const doc = {
    version: "171.2",
    generatedAt: new Date().toISOString(),
    summary,
    pages,
    excludedSitemapPaths: [...excludedSitemapPaths].sort(),
    noindexPaths: [...noindexPaths].sort(),
    internalLinkExcludePaths: [...internalLinkExcludePaths].sort(),
    runtimeExampleGatedPaths: [...new Set(runtimeExampleGatedPaths)].sort(),
    /** @deprecated V171.2 — empty; use internalLinkExcludePaths */
    linkPoolSoftPaths: [] as string[],
    seoExpansionPrefixes: [...SEO_EXPANSION_PREFIXES]
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[build-content-quality-status]", OUT, summary);
}

main();
