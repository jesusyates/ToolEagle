#!/usr/bin/env node
/**
 * V186 — Build generated/*.json from src/config/creator-knowledge-engine/v186-assets.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src", "config", "creator-knowledge-engine", "v186-assets.json");
const OUT_DIR = path.join(ROOT, "generated");

function main() {
  const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const builtAt = new Date().toISOString();

  const knowledge_engine = {
    version: raw.version,
    builtAt,
    source: "src/config/creator-knowledge-engine/v186-assets.json",
    counts: {
      knowledge_patterns: (raw.knowledge_patterns || []).length,
      knowledge_scenarios: (raw.knowledge_scenarios || []).length,
      knowledge_fragments: (raw.knowledge_fragments || []).length,
      generation_recipes: (raw.generation_recipes || []).length
    },
    knowledge_patterns: raw.knowledge_patterns,
    knowledge_scenarios: raw.knowledge_scenarios,
    knowledge_fragments: raw.knowledge_fragments,
    generation_recipes: raw.generation_recipes
  };

  const intent_map = {
    version: raw.version,
    builtAt,
    tools: {}
  };
  const slugs = Object.keys(raw.intent_chips || {});
  for (const slug of slugs) {
    intent_map.tools[slug] = {
      intents: raw.intent_chips[slug],
      scenarios: raw.scenario_chips[slug] || []
    };
  }

  const recipe_map = {
    version: raw.version,
    builtAt,
    by_tool_slug: {}
  };
  for (const rec of raw.generation_recipes || []) {
    if (rec.tool_slug) {
      recipe_map.by_tool_slug[rec.tool_slug] = rec;
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "v186-knowledge-engine.json"), JSON.stringify(knowledge_engine, null, 2), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "v186-intent-map.json"), JSON.stringify(intent_map, null, 2), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "v186-recipe-map.json"), JSON.stringify(recipe_map, null, 2), "utf8");
  console.log("[build-v186] wrote v186-knowledge-engine.json, v186-intent-map.json, v186-recipe-map.json");
}

main();
