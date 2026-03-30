#!/usr/bin/env node
/**
 * V193 — Platform Data Engine (Phase 1)
 * Build platform-native patterns from manual observations.
 *
 * Outputs:
 * - generated/v193-platform-patterns.json
 * - generated/v193-platform-intelligence-summary.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "generated");
const PLATFORM_DATA_DIR = path.join(ROOT, "src", "config", "platform-data");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function ensureArray(x) {
  return Array.isArray(x) ? x : typeof x === "string" ? [x] : [];
}

function toolTypeFromPatternType(patternType) {
  const pt = String(patternType ?? "").toLowerCase();
  if (pt === "hashtag") return "hashtag";
  if (pt === "title") return "title";
  // hook / structure / CTA all influence hook focus + script framing
  return "hook_focus";
}

function patternScore(p) {
  const q = typeof p.quality_score === "number" ? p.quality_score : 0.5;
  const r = typeof p.revenue_score === "number" ? p.revenue_score : 0.5;
  return q * 0.55 + r * 0.45;
}

function main() {
  const builtAt = new Date().toISOString();

  const tiktokObsPath = path.join(PLATFORM_DATA_DIR, "tiktok-observations.json");
  const youtubeObsPath = path.join(PLATFORM_DATA_DIR, "youtube-observations.json");
  const instagramObsPath = path.join(PLATFORM_DATA_DIR, "instagram-observations.json");

  const tiktokObs = fs.existsSync(tiktokObsPath) ? readJson(tiktokObsPath) : [];
  const youtubeObs = fs.existsSync(youtubeObsPath) ? readJson(youtubeObsPath) : [];
  const instagramObs = fs.existsSync(instagramObsPath) ? readJson(instagramObsPath) : [];

  const observationsByPlatform = {
    tiktok: ensureArray(tiktokObs),
    youtube: ensureArray(youtubeObs),
    instagram: ensureArray(instagramObs)
  };

  const patterns = [];

  for (const [platform, obsArr] of Object.entries(observationsByPlatform)) {
    for (const obs of ensureArray(obsArr)) {
      if (!obs || typeof obs !== "object") continue;
      const tool_type = toolTypeFromPatternType(obs.pattern_type);
      patterns.push({
        id: String(obs.id ?? `${platform}-${obs.pattern_type}`),
        platform,
        pattern_type: String(obs.pattern_type ?? ""),
        tool_type,
        structure: String(obs.structure ?? ""),
        intent_fit: ensureArray(obs.intent_fit).map(String),
        scenario_fit: ensureArray(obs.scenario_fit).map(String),
        monetization_fit: ensureArray(obs.monetization_fit).map(String),
        quality_score: typeof obs.quality_score === "number" ? obs.quality_score : 0.5,
        revenue_score: typeof obs.revenue_score === "number" ? obs.revenue_score : 0.5
      });
    }
  }

  // v193-platform-patterns.json
  const patternsOut = {
    version: "193.0",
    builtAt,
    source: "src/config/platform-data/*.json (manual observations)",
    counts: {
      patterns: patterns.length
    },
    patterns
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "v193-platform-patterns.json"), JSON.stringify(patternsOut, null, 2), "utf8");

  // v193-platform-intelligence-summary.json
  const byPlatform = {};
  for (const p of patterns) {
    byPlatform[p.platform] = byPlatform[p.platform] ?? {};
    byPlatform[p.platform][p.tool_type] = byPlatform[p.platform][p.tool_type] ?? [];
    byPlatform[p.platform][p.tool_type].push(p);
  }

  const summary = {
    version: "193.0",
    builtAt,
    notes: "V193 observations are additive boosts on top of existing V191 patterns.",
    platforms: {}
  };

  for (const [platform, toolMap] of Object.entries(byPlatform)) {
    summary.platforms[platform] = {};
    for (const [toolType, arr] of Object.entries(toolMap)) {
      const ranked = [...arr].sort((a, b) => patternScore(b) - patternScore(a));
      const top = ranked.slice(0, 3);
      summary.platforms[platform][toolType] = {
        count: arr.length,
        top_structures: top.map((t) => t.structure).slice(0, 3)
      };
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "v193-platform-intelligence-summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  console.log(`[build-v193] wrote ${path.join(OUT_DIR, "v193-platform-patterns.json")} and summary JSON`);
}

main();

