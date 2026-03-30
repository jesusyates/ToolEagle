/**
 * V186 — Creator Knowledge Engine: intent → retrieval (weighted) → recipe → prompt assembly.
 * V191 — Platform intelligence patterns + fragment weighting by target surface.
 * Assets: src/config/creator-knowledge-engine/v186-assets.json (also mirrored to generated/*).
 */

import raw from "@/config/creator-knowledge-engine/v186-assets.json";
import v193Summary from "../../../generated/v193-platform-intelligence-summary.json";
import analysisGenMap from "../../../generated/v191-analysis-generation-map.json";
import v193Patterns from "../../../generated/v193-platform-patterns.json";
import {
  inferPlatformFromToolSlug,
  resolvePlatformPatterns,
  type PlatformId,
  type PlatformUserProfile
} from "@/lib/platform-intelligence/resolve-patterns";

export type { PlatformId, PlatformUserProfile } from "@/lib/platform-intelligence/resolve-patterns";
export { inferPlatformFromToolSlug } from "@/lib/platform-intelligence/resolve-patterns";

export type V186Payload = {
  toolSlug: string;
  intentId?: string | null;
  scenarioId?: string | null;
};

type Assets = typeof raw;

const ASSETS = raw as Assets;

const TOOL_TYPE_BY_SLUG: Record<string, string> = {
  "tiktok-caption-generator": "tiktok_caption",
  "hook-generator": "hook_focus",
  "hashtag-generator": "hashtag",
  "title-generator": "title"
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function labelForIntent(toolSlug: string, intentId?: string | null): string {
  const list = ASSETS.intent_chips[toolSlug as keyof typeof ASSETS.intent_chips];
  const row = list?.find((x) => x.id === intentId);
  return row?.label ?? "Get more views";
}

function labelForScenario(toolSlug: string, scenarioId?: string | null): string {
  const list = ASSETS.scenario_chips[toolSlug as keyof typeof ASSETS.scenario_chips];
  const row = list?.find((x) => x.id === scenarioId);
  return row?.label ?? "Tutorial";
}

function pickRecipe(toolSlug: string) {
  const r = ASSETS.generation_recipes.find((x) => x.tool_slug === toolSlug);
  return r ?? null;
}

function scoreFragment(
  f: (typeof ASSETS.knowledge_fragments)[0],
  toolType: string,
  intentId: string,
  scenarioSlug: string,
  userText: string,
  opts?: { platform?: PlatformId; monetizationBoostCommerce?: boolean }
): number {
  const q = typeof f.quality_score === "number" ? f.quality_score : 0.5;
  const rev = typeof (f as { revenue_score?: number }).revenue_score === "number" ? (f as { revenue_score: number }).revenue_score : 0.5;
  let s = q * 0.45 + rev * 0.35;
  if (f.tool_type !== "shared" && f.tool_type !== toolType) {
    s *= 0.35;
  }
  const fp = (f as { platform?: string }).platform;
  if (opts?.platform && fp && fp === opts.platform) {
    s += 0.07;
  }
  const tags = (f.tags ?? []).map((t) => t.toLowerCase());
  if (opts?.monetizationBoostCommerce && tags.some((t) => ["shop", "commerce", "sell", "cta"].includes(t))) {
    s += 0.05;
  }
  const i = (intentId || "").toLowerCase();
  const sc = scenarioSlug.replace(/^sc_/, "");
  if (tags.some((t) => i.includes(t) || t.includes(i.split("_")[1] || ""))) s += 0.08;
  if (tags.some((t) => sc && t.includes(sc))) s += 0.06;
  const ut = norm(userText);
  if (ut.length > 2) {
    const words = ut.split(/\s+/).filter((w) => w.length > 3);
    for (const w of words.slice(0, 8)) {
      if (f.text.toLowerCase().includes(w)) s += 0.02;
    }
  }
  return s;
}

function pickPatternsLegacy(toolType: string, intentId: string): typeof ASSETS.knowledge_patterns {
  const intent = intentId.toLowerCase();
  const ranked = ASSETS.knowledge_patterns
    .filter((p) => p.tool_type === toolType)
    .map((p) => {
      let sc = (p.quality_score ?? 0.5) * 0.5 + (p.revenue_score ?? 0.5) * 0.5;
      const tags = (p.intent_tags ?? []).map((t) => t.toLowerCase());
      if (tags.some((t) => intent.includes(t) || t.includes(intent.replace("intent_", "")))) sc += 0.12;
      return { p, sc };
    })
    .sort((a, b) => b.sc - a.sc);
  return ranked.slice(0, 2).map((x) => x.p);
}

/** V191 — Prefer platform-native catalog; fall back to legacy v186 patterns. */
function pickPatternsHybrid(
  toolType: string,
  intentId: string,
  scenarioId: string,
  platform: PlatformId,
  userProfile: PlatformUserProfile | undefined,
  disableV193?: boolean
): { id: string; scenario: string; pattern_text: string }[] {
  const ranked = resolvePlatformPatterns({
    platform,
    intentId,
    scenarioId,
    userProfile,
    toolType,
    limit: 2,
    disableV193
  });
  const fromPi = ranked.map(({ pattern }) => ({
    id: pattern.id,
    scenario: pattern.pattern_type,
    pattern_text: `[${pattern.platform} · ${pattern.pattern_type}] ${pattern.structure}`
  }));
  if (fromPi.length >= 2) return fromPi;
  const legacy = pickPatternsLegacy(toolType, intentId).map((p) => ({
    id: p.id,
    scenario: p.scenario,
    pattern_text: p.pattern_text
  }));
  const merged = [...fromPi];
  for (const row of legacy) {
    if (merged.length >= 2) break;
    if (!merged.some((m) => m.id === row.id)) merged.push(row);
  }
  return merged.slice(0, 2);
}

/**
 * Weighted top fragments — deterministic, not uniform random.
 */
export function selectKnowledgeFragments(
  toolSlug: string,
  intentId: string,
  scenarioId: string,
  userText: string,
  limit = 4,
  options?: { platform?: PlatformId; userProfile?: PlatformUserProfile }
): (typeof ASSETS.knowledge_fragments)[0][] {
  const toolType = TOOL_TYPE_BY_SLUG[toolSlug] ?? "tiktok_caption";
  const scen = ASSETS.knowledge_scenarios.find((x) => x.id === scenarioId);
  const scenarioSlug = scen?.slug ?? "tutorial";
  const salesLean =
    options?.userProfile?.primaryGoal === "sales" ||
    (options?.userProfile?.monetizationMode ?? "").toLowerCase().includes("product");
  const scored = ASSETS.knowledge_fragments
    .map((f) => ({
      f,
      sc: scoreFragment(f, toolType, intentId, scenarioSlug, userText, {
        platform: options?.platform,
        monetizationBoostCommerce: salesLean
      })
    }))
    .sort((a, b) => b.sc - a.sc);
  return scored.slice(0, limit).map((x) => x.f);
}

/** V193.1 — echoed to API / generated map when TikTok observations influence hook generation */
export type V193GenerationMeta = {
  observation_applied: boolean;
  observation_count_used: number;
  top_pattern_types_applied: string[];
  additive_only: true;
  tool_slug: string;
  generation_surfaces: string[];
};

export type V193TikTokChainRules = {
  voice_rules: string[];
  pacing_rules: string[];
  cta_rules: string[];
  monetization_rules: string[];
  chain_style: "curiosity_payoff" | "proof_first" | "direct_offer";
  cta_intensity: "soft" | "medium" | "strong";
};

export type V186ResolveResult = {
  effectiveUserInput: string;
  knowledgeBlock: string;
  recipeId: string | null;
  intentLabel: string;
  scenarioLabel: string;
  fragmentIds: string[];
  patternIds: string[];
  analysisHint?: string | null;
  /** V193.1 — set when TikTok platform observations materially participate in the prompt */
  v193ObservationApplied?: boolean;
  v193GenerationMeta?: V193GenerationMeta;
  v193ChainRules?: V193TikTokChainRules;
};

export function resolveV186(args: {
  toolSlug: string;
  intentId?: string | null;
  scenarioId?: string | null;
  userText: string;
  /** V191 — default from tool slug (tiktok vs youtube vs instagram) */
  platform?: PlatformId | null;
  userProfile?: PlatformUserProfile;
  /** V191 — saved Creator Analysis summary (client-built) */
  creatorAnalysisSummary?: string | null;
  /** V193.1 verification: disable ALL V193 observations injection when true */
  debugDisableV193?: boolean;
}): V186ResolveResult | null {
  const { toolSlug, userText } = args;
  const recipe = pickRecipe(toolSlug);
  if (!recipe) return null;

  const disableV193 = Boolean(args.debugDisableV193);

  const intents = ASSETS.intent_chips[toolSlug as keyof typeof ASSETS.intent_chips];
  const firstIntent = intents?.[0]?.id ?? "intent_views";
  const scenarios = ASSETS.scenario_chips[toolSlug as keyof typeof ASSETS.scenario_chips];
  const firstSc = scenarios?.[0]?.id ?? "sc_tutorial";

  const intentId = args.intentId?.trim() || firstIntent;
  const scenarioId = args.scenarioId?.trim() || firstSc;

  const intentLabel = labelForIntent(toolSlug, intentId);
  const scenarioLabel = labelForScenario(toolSlug, scenarioId);

  const filler =
    userText.trim() ||
    `${intentLabel} content for ${scenarioLabel} audience on short-form video — use specific, platform-appropriate examples.`;

  let effectiveUserInput = recipe.user_input_template
    .replace(/\{intent_label\}/g, intentLabel)
    .replace(/\{scenario_label\}/g, scenarioLabel)
    .replace(/\{user_text\}/g, filler);

  const toolType = TOOL_TYPE_BY_SLUG[toolSlug] ?? "tiktok_caption";
  const platform: PlatformId = args.platform ?? inferPlatformFromToolSlug(toolSlug);
  const userProfile = args.userProfile;
  const frags = selectKnowledgeFragments(toolSlug, intentId, scenarioId, userText, 4, { platform, userProfile });
  const patterns = pickPatternsHybrid(toolType, intentId, scenarioId, platform, userProfile, disableV193);

  const fragLines = frags.map((f, i) => `${i + 1}. (${f.compliance_note || "tip"}) ${f.text}`);
  const patLines = patterns.map((p, i) => `${i + 1}. [${p.scenario}] ${p.pattern_text}`);

  const analysisChunk =
    args.creatorAnalysisSummary?.trim().slice(0, 2200) ?? "";

  const derivedV1912 = analysisChunk ? deriveV1912Adjustments({ analysisChunk, toolSlug }) : null;

  const analysisDirectives = derivedV1912?.directives ?? "";
  const analysisHint = derivedV1912?.hint ?? "";
  const v193Any = v193Summary as any;
  const v193ChainRules =
    !disableV193 && platform === "tiktok" && ["hook_focus", "tiktok_caption", "hashtag", "title"].includes(toolType)
      ? buildV193TikTokChainRules({
          intentId,
          scenarioId,
          userProfile
        })
      : null;

  const v193PlatformReinforcement =
    !disableV193 && platform === "tiktok"
      ? toolType === "hook_focus"
        ? buildV193HookReinforcementAddendum({
            userText: userText.trim(),
            v193Patterns: v193Patterns as any,
            intentId,
            scenarioId
          })
        : toolType === "hashtag"
          ? buildV193HashtagReinforcementAddendum({
              userText: userText.trim(),
              v193Patterns: v193Patterns as any,
              intentId,
              scenarioId
            })
          : toolType === "title"
            ? buildV193TitleReinforcementAddendum({
                userText: userText.trim(),
                v193Patterns: v193Patterns as any,
                intentId,
                scenarioId
              })
            : toolType === "tiktok_caption"
              ? buildV193CaptionReinforcementAddendum({
                  userText: userText.trim(),
                  v193Patterns: v193Patterns as any,
                  intentId,
                  scenarioId,
                  chainRules: v193ChainRules
                })
            : null
      : null;

  const summaryStructuresUsed =
    !disableV193 && v193Any?.platforms?.[platform]?.[toolType]?.top_structures?.length
      ? Math.min(
          2,
          (v193Any.platforms[platform][toolType].top_structures as string[]).length
        )
      : 0;

  const v193ReinforcementHeader =
    toolType === "hook_focus"
      ? "[V193.1 Platform Difference Reinforcement — prioritize TikTok hook/structure/CTA scaffolds (additive only).]"
      : toolType === "hashtag"
        ? "[V193.2 Platform Difference Reinforcement — prioritize TikTok hashtag set composition (additive only).]"
        : toolType === "title"
          ? "[V193.2 Platform Difference Reinforcement — prioritize TikTok cover text / opener-style titles (additive only).]"
          : toolType === "tiktok_caption"
            ? "[V193.3 Platform Difference Reinforcement — prioritize TikTok caption cadence + hook/title alignment (additive only).]"
          : "[V193 Platform Difference Reinforcement — additive only.]";

  const knowledgeBlock = [
    "[V186 Creator Knowledge Engine — use structure and constraints; do not copy verbatim.]",
    `[V191 Target surface: ${platform} — patterns and fragments weighted for this platform + monetization profile.]`,
    ...(analysisChunk
      ? ["", "[V191 Creator Analysis — user-provided past content audit; align tone and structure.]", analysisChunk]
      : []),
    ...(!disableV193 && v193Any?.platforms?.[platform]?.[toolType]?.top_structures?.length
      ? [
          "",
          "[V193 Platform Observations — additive TikTok boost. Apply when relevant to your generation task.]",
          `Top TikTok observation patterns:\n${v193Any.platforms[platform][toolType].top_structures
            .slice(0, 2)
            .map((s: string) => `- ${s}`)
            .join("\n")}`
        ]
      : []),
    ...(v193PlatformReinforcement?.text
      ? [
          "",
          v193ReinforcementHeader,
          v193PlatformReinforcement.text
        ]
      : []),
    ...(v193ChainRules
      ? [
          "",
          "[V193.3 TikTok Chain Consistency — keep Hook/Caption/Hashtag/Title aligned for one post package.]",
          `Chain style: ${v193ChainRules.chain_style} · CTA intensity: ${v193ChainRules.cta_intensity}`,
          "Shared voice rules:",
          ...v193ChainRules.voice_rules.map((x) => `- ${x}`),
          "Shared pacing rules:",
          ...v193ChainRules.pacing_rules.map((x) => `- ${x}`),
          "Shared CTA rules:",
          ...v193ChainRules.cta_rules.map((x) => `- ${x}`),
          "Shared monetization rules:",
          ...v193ChainRules.monetization_rules.map((x) => `- ${x}`)
        ]
      : []),
    ...(analysisDirectives
      ? ["", "[V191.2 Analysis-to-generation reinforcement — apply these directives before writing.]", analysisDirectives]
      : []),
    `Intent: ${intentLabel} (${intentId})`,
    `Scenario: ${scenarioLabel} (${scenarioId})`,
    `Recipe: ${recipe.recipe_prompt_addendum || ""}`,
    "",
    "High-weight patterns:",
    ...patLines,
    "",
    "Knowledge fragments (weighted selection):",
    ...fragLines
  ]
    .filter(Boolean)
    .join("\n");

  // Make sure analysis directives are also part of the actual "user_text" (task context).
  // This strongly conditions the prompt assembly at the /api/generate-package layer.
  if (analysisDirectives) {
    const base = userText.trim() || filler;
    effectiveUserInput = recipe.user_input_template
      .replace(/\{intent_label\}/g, intentLabel)
      .replace(/\{scenario_label\}/g, scenarioLabel)
      .replace(/\{user_text\}/g, `${analysisDirectives}\n\nUser topic:\n${base}`);
  }

  const v193PatternIdsInHybrid = patterns.map((p) => p.id).filter((id) => id.startsWith("v193-"));
  const v193GenMeta = buildV193GenerationMeta({
    toolSlug,
    platform,
    toolType,
    disableV193,
    v193PatternIdsInHybrid,
    reinforcement: v193PlatformReinforcement,
    summaryStructuresUsed
  });

  return {
    effectiveUserInput,
    knowledgeBlock,
    recipeId: recipe.id,
    intentLabel,
    scenarioLabel,
    fragmentIds: frags.map((f) => f.id),
    patternIds: patterns.map((p) => p.id),
    analysisHint,
    v193ObservationApplied: v193GenMeta?.observation_applied ?? false,
    v193GenerationMeta: v193GenMeta,
    v193ChainRules: v193ChainRules ?? undefined
  };
}

function buildV193GenerationMeta(args: {
  toolSlug: string;
  platform: PlatformId;
  toolType: string;
  disableV193: boolean;
  v193PatternIdsInHybrid: string[];
  reinforcement:
    | ReturnType<typeof buildV193HookReinforcementAddendum>
    | ReturnType<typeof buildV193HashtagReinforcementAddendum>
    | ReturnType<typeof buildV193TitleReinforcementAddendum>
    | ReturnType<typeof buildV193CaptionReinforcementAddendum>;
  summaryStructuresUsed: number;
}): V193GenerationMeta | undefined {
  if (args.disableV193 || args.platform !== "tiktok") return undefined;
  if (!["hook_focus", "hashtag", "title", "tiktok_caption"].includes(args.toolType)) return undefined;

  const reinfIds = args.reinforcement?.meta.patternIds ?? [];
  const merged = new Set<string>([...args.v193PatternIdsInHybrid, ...reinfIds]);
  const summaryBoost = args.summaryStructuresUsed > 0 ? 1 : 0;
  const observation_count_used = merged.size + summaryBoost;

  const surfaces: string[] = [];
  if (args.v193PatternIdsInHybrid.length) surfaces.push("hybrid_pattern_pool");
  if (args.reinforcement?.meta.patternIds.length) {
    surfaces.push(
      args.toolType === "hashtag"
        ? "hashtag_set_scaffolds"
        : args.toolType === "title"
          ? "title_scaffolds"
          : args.toolType === "tiktok_caption"
            ? "caption_scaffolds"
          : "hook_structure_cta_scaffolds"
    );
  }
  if (args.summaryStructuresUsed > 0) surfaces.push("platform_intelligence_summary");

  const topTypes = new Set<string>();
  for (const t of args.reinforcement?.meta.types ?? []) topTypes.add(t);
  if (args.summaryStructuresUsed > 0) topTypes.add("observation_summary");

  const observation_applied = observation_count_used > 0;
  if (!observation_applied) return undefined;

  return {
    observation_applied,
    observation_count_used,
    top_pattern_types_applied: [...topTypes],
    additive_only: true,
    tool_slug: args.toolSlug,
    generation_surfaces: surfaces
  };
}

function buildV193TikTokChainRules(args: {
  intentId: string;
  scenarioId: string;
  userProfile?: PlatformUserProfile;
}): V193TikTokChainRules {
  const monet = String(args.userProfile?.monetizationMode ?? "").toLowerCase();
  const salesLean =
    args.userProfile?.primaryGoal === "sales" ||
    monet.includes("product") ||
    monet.includes("shop") ||
    monet.includes("affiliate");
  const curiosityLean = args.intentId.includes("views") || args.intentId.includes("viral");
  const proofLean = args.scenarioId.includes("tutorial") || args.scenarioId.includes("small_business");

  const chain_style: V193TikTokChainRules["chain_style"] = salesLean
    ? "direct_offer"
    : proofLean
      ? "proof_first"
      : curiosityLean
        ? "curiosity_payoff"
        : "curiosity_payoff";
  const cta_intensity: V193TikTokChainRules["cta_intensity"] = salesLean ? "strong" : proofLean ? "medium" : "soft";

  return {
    chain_style,
    cta_intensity,
    voice_rules: [
      "Use conversational spoken lines (short clauses, no formal essay tone).",
      "Keep wording native to TikTok feed language, avoid generic SEO phrasing.",
      "Carry the same opener intent across hook/caption/title (do not switch premise mid-chain)."
    ],
    pacing_rules: [
      "Front-load value in first line, then support with one tight payoff line.",
      "Prefer 1-idea-per-line cadence; avoid long compound sentences.",
      "Hashtag sets should mirror the same content angle as hook/title."
    ],
    cta_rules: [
      cta_intensity === "soft"
        ? "CTA = low-friction engagement (save/comment/follow) after value."
        : cta_intensity === "medium"
          ? "CTA = action-oriented but still value-first; ask for one clear next step."
          : "CTA = direct conversion ask is allowed, but not in line 1."
    ],
    monetization_rules: [
      salesLean
        ? "Monetization fit: product/problem framing + proof + direct next step."
        : "Monetization fit: trust-building first (value/proof), then soft conversion.",
      "Do not use hard-sell language before delivering payoff."
    ]
  };
}

function deriveV1912Adjustments(args: { analysisChunk: string; toolSlug: string }): {
  directives: string;
  hint: string;
} | null {
  const issuesLine = extractLine(args.analysisChunk, /^Issues:\s*(.*)$/m);
  const nextTypesLine = extractLine(args.analysisChunk, /^Next types:\s*(.*)$/m);
  const dominantStyle = extractLine(args.analysisChunk, /^Dominant style:\s*(.*)$/m);
  const primaryFocus = extractPrimaryFocus(args.analysisChunk);

  const issues = issuesLine ? issuesLine.split(" | ").map((s) => s.trim()).filter(Boolean) : [];
  const nextTypes = nextTypesLine ? nextTypesLine.split(" | ").map((s) => s.trim()).filter(Boolean) : [];

  // Avoid over-conditioning: only generate directives when we can identify issues/style/focus.
  if (!issues.length && !dominantStyle && !primaryFocus) return null;

  const directives: string[] = [];

  const primaryIssue = issues[0] ?? "";

  // Tool slug drives which adjustment bucket we apply inside the map file.
  // For now we map to the same prompt tool categories via toolSlugToType.
  const bucket = toolSlugToType(args.toolSlug);

  const issueDirectives: string[] = [];
  for (const issueTitle of issues.slice(0, 3)) {
    const row = (analysisGenMap.issue_to_pattern_adjustment as Record<string, any>)[issueTitle];
    const d = row?.[bucket];
    if (typeof d === "string" && d.trim()) issueDirectives.push(d.trim());
  }

  if (issueDirectives.length) directives.push(...issueDirectives);

  // Style directives
  if (dominantStyle) {
    const styleRow =
      (analysisGenMap.style_to_recipe_adjustment as Record<string, any>)[dominantStyle] ??
      findStyleRowLoose(analysisGenMap.style_to_recipe_adjustment as Record<string, any>, dominantStyle);
    if (styleRow?.[bucket] && typeof styleRow[bucket] === "string") directives.push(styleRow[bucket]);
  }

  // Focus directives
  if (primaryFocus) {
    const focusRow = (analysisGenMap.focus_to_output_adjustment as Record<string, any>)[primaryFocus];
    if (focusRow?.[bucket] && typeof focusRow[bucket] === "string") directives.push(focusRow[bucket]);
  }

  // Next types: light conditioning (no need for exact matching).
  if (nextTypes.length) {
    const joined = nextTypes.join(" ").toLowerCase();
    if (joined.includes("proof") || joined.includes("before/after") || joined.includes("demo")) {
      directives.push("Next content direction: proof-led. Hook should tease a concrete proof element (before/after, demo result) rather than generic hype.");
    }
    if (joined.includes("tutorial") || joined.includes("how to") || joined.includes("steps") || joined.includes("tips")) {
      directives.push("Next content direction: tutorial/list repeatable formats. Prefer a structured hook that promises clear steps or a numbered list.");
    }
  }

  if (!directives.length) return null;

  const hint = `Applied from your analysis: ${primaryIssue || "creator profile signals"}.`;

  return {
    directives: directives.slice(0, 5).join("\n"),
    hint
  };
}

function toolSlugToType(toolSlug: string): "hook_focus" | "hashtag-generator" | "title-generator" {
  if (toolSlug === "hook-generator") return "hook_focus";
  if (toolSlug === "hashtag-generator") return "hashtag-generator";
  if (toolSlug === "title-generator") return "title-generator";
  // fallback: treat hook_focus default
  return "hook_focus";
}

function buildV193HookReinforcementAddendum(args: {
  userText: string;
  v193Patterns: any;
  intentId: string;
  scenarioId: string;
}): { text: string; meta: { patternIds: string[]; types: ("hook" | "structure" | "cta")[] } } | null {
  const patterns = Array.isArray(args.v193Patterns?.patterns) ? args.v193Patterns.patterns : [];
  if (!patterns.length) return null;

  const relevant = patterns.filter((p: any) => {
    const platformOk = p.platform === "tiktok";
    const toolTypeOk = p.tool_type === "hook_focus";
    if (!platformOk || !toolTypeOk) return false;
    const pt = String(p.pattern_type ?? "").toLowerCase();
    return pt === "hook" || pt === "structure" || pt === "cta";
  });

  const scoreBase = (p: any) => {
    const q = typeof p.quality_score === "number" ? p.quality_score : 0.5;
    const r = typeof p.revenue_score === "number" ? p.revenue_score : 0.5;
    return q * 0.55 + r * 0.45;
  };

  const scoreFit = (p: any) => {
    let s = scoreBase(p);
    const intents = Array.isArray(p.intent_fit) ? p.intent_fit.map(String) : [];
    const scen = Array.isArray(p.scenario_fit) ? p.scenario_fit.map(String) : [];
    if (intents.includes(args.intentId)) s += 0.14;
    if (scen.includes(args.scenarioId)) s += 0.12;
    const ut = norm(args.userText);
    if (ut.length > 3) {
      const words = ut.split(/\s+/).filter((w) => w.length > 3);
      const struct = String(p.structure ?? "").toLowerCase();
      for (const w of words.slice(0, 5)) {
        if (struct.includes(w)) s += 0.02;
      }
    }
    return s;
  };

  const pick = (pt: "hook" | "structure" | "cta") => {
    const pool = relevant
      .filter((p: any) => String(p.pattern_type ?? "").toLowerCase() === pt)
      .sort((a: any, b: any) => scoreFit(b) - scoreFit(a));
    return pool[0] ?? null;
  };

  const pickAltHook = () => {
    const pool = relevant
      .filter((p: any) => String(p.pattern_type ?? "").toLowerCase() === "hook")
      .sort((a: any, b: any) => scoreFit(b) - scoreFit(a));
    return pool[1] ?? null;
  };

  const hook = pick("hook");
  const structure = pick("structure");
  const cta = pick("cta");
  const hookAlt = pickAltHook();
  if (!hook && !structure && !cta) return null;

  const sanitize = (s: string) => {
    const trimmed = String(s ?? "").replace(/\s+/g, " ").trim();
    return trimmed.length > 240 ? `${trimmed.slice(0, 235)}...` : trimmed;
  };

  const replacePlaceholders = (s: string) => {
    return sanitize(s)
      .replace(/\{niche\}/gi, args.userText || "your niche")
      .replace(/\{goal\}/gi, "your goal")
      .replace(/\{common_advice\}/gi, "common advice")
      .replace(/\{specific_action\}/gi, "a specific action")
      .replace(/\{mistake_or_problem\}/gi, "the problem")
      .replace(/\{micro_fix\}/gi, "a micro-fix")
      .replace(/\{tool\/approach\}/gi, "your approach")
      .replace(/\{before\}/gi, "what you had before")
      .replace(/\{after\}/gi, "what changes after")
      .replace(/\{keyword\}/gi, "your keyword")
      .replace(/\{next_topic\}/gi, "your next topic")
      .replace(/\{sub_niche\}/gi, "a sub-niche");
  };

  const hookLine = hook?.structure ? replacePlaceholders(hook.structure) : null;
  const hookAltLine = hookAlt && hookAlt !== hook && hookAlt.structure ? replacePlaceholders(hookAlt.structure) : null;
  const structureLine = structure?.structure ? replacePlaceholders(structure.structure) : null;
  const ctaLine = cta?.structure ? replacePlaceholders(cta.structure) : null;

  const parts: string[] = [];
  if (hookLine) parts.push(`Primary hook scaffold (first spoken line): ${hookLine}`);
  if (hookAltLine) parts.push(`Alternate hook angle (keep A/B different): ${hookAltLine}`);
  if (structureLine) parts.push(`Structure scaffold (beats / pacing for first 3–15s): ${structureLine}`);
  if (ctaLine) parts.push(`CTA scaffold (after proof): ${ctaLine}`);

  if (!parts.length) return null;

  const tiktokVoice = [
    "TikTok voice (must follow for hooks):",
    "- First line must earn the next 3 seconds: curiosity, contrast, or a pattern interrupt — not generic motivation or filler.",
    "- Prefer spoken rhythm: short clauses; one idea per beat; sound like a real creator talking to camera.",
    "- Avoid vague AI-ish phrasing: do not lean on “In today’s video”, “Let me share”, “Here’s the thing” unless they truly interrupt the scroll.",
    "- Make a clear payoff promise: what the viewer gets by the end (or reveal the tension you will resolve).",
    "- Direct address + specificity: name the mistake, niche, or outcome — not generic “tips” or “strategies”."
  ].join("\n");

  const metaIds: string[] = [];
  const types: ("hook" | "structure" | "cta")[] = [];
  if (hook?.id) {
    metaIds.push(String(hook.id));
    types.push("hook");
  }
  if (hookAlt?.id && hookAlt.id !== hook?.id) metaIds.push(String(hookAlt.id));
  if (structure?.id) {
    metaIds.push(String(structure.id));
    types.push("structure");
  }
  if (cta?.id) {
    metaIds.push(String(cta.id));
    types.push("cta");
  }

  const text = [
    ...parts,
    "",
    tiktokVoice,
    "",
    "Rewrite using these scaffolds only; do NOT output meta-labels like “Hook scaffold”. Output creator-ready lines. Keep line 1 punchy for TikTok; place CTA after proof per scaffold (not sales-heavy in line 1)."
  ].join("\n");

  return { text, meta: { patternIds: [...new Set(metaIds)], types: [...new Set(types)] } };
}

function buildV193HashtagReinforcementAddendum(args: {
  userText: string;
  v193Patterns: any;
  intentId: string;
  scenarioId: string;
}): { text: string; meta: { patternIds: string[]; types: ("hashtag")[] } } | null {
  const patterns = Array.isArray(args.v193Patterns?.patterns) ? args.v193Patterns.patterns : [];
  const relevant = patterns.filter(
    (p: any) =>
      p.platform === "tiktok" &&
      p.tool_type === "hashtag" &&
      String(p.pattern_type ?? "").toLowerCase() === "hashtag"
  );
  if (!relevant.length) return null;

  const score = (p: any) => {
    const q = typeof p.quality_score === "number" ? p.quality_score : 0.5;
    const r = typeof p.revenue_score === "number" ? p.revenue_score : 0.5;
    let s = q * 0.6 + r * 0.4;
    if (Array.isArray(p.intent_fit) && p.intent_fit.map(String).includes(args.intentId)) s += 0.14;
    if (Array.isArray(p.scenario_fit) && p.scenario_fit.map(String).includes(args.scenarioId)) s += 0.12;
    return s;
  };

  const top = [...relevant].sort((a, b) => score(b) - score(a)).slice(0, 2);
  const sanitize = (s: string) => String(s ?? "").replace(/\s+/g, " ").trim();
  const replace = (s: string) =>
    sanitize(s)
      .replace(/\{niche\}/gi, args.userText || "your niche")
      .replace(/\{sub_niche\}/gi, "a sub-niche");

  const examples = top.map((p: any) => `- ${replace(String(p.structure ?? ""))}`).filter(Boolean);
  if (!examples.length) return null;

  const text = [
    "TikTok hashtag composition rules:",
    "- Focus on distribution context: niche + sub-niche + format/intent tags (tutorial, mistake, beforeafter).",
    "- Avoid generic spam tags unless they truly match the hook (#viral #trending etc). Keep sets tight and relevant.",
    "- Add a branded tag when you have one; rotate broad tags instead of repeating the same ones every post.",
    "",
    "Reference TikTok hashtag sets (adapt to the topic):",
    ...examples,
    "",
    "Output 2–3 distinct ready-to-paste hashtag sets, each 8–16 tags. No explanations."
  ].join("\n");

  return {
    text,
    meta: {
      patternIds: top.map((p: any) => String(p.id)).filter(Boolean),
      types: ["hashtag"]
    }
  };
}

function buildV193TitleReinforcementAddendum(args: {
  userText: string;
  v193Patterns: any;
  intentId: string;
  scenarioId: string;
}): { text: string; meta: { patternIds: string[]; types: ("title")[] } } | null {
  const patterns = Array.isArray(args.v193Patterns?.patterns) ? args.v193Patterns.patterns : [];
  const relevant = patterns.filter(
    (p: any) =>
      p.platform === "tiktok" &&
      p.tool_type === "title" &&
      String(p.pattern_type ?? "").toLowerCase() === "title"
  );
  if (!relevant.length) return null;

  const score = (p: any) => {
    const q = typeof p.quality_score === "number" ? p.quality_score : 0.5;
    const r = typeof p.revenue_score === "number" ? p.revenue_score : 0.5;
    let s = q * 0.62 + r * 0.38;
    if (Array.isArray(p.intent_fit) && p.intent_fit.map(String).includes(args.intentId)) s += 0.14;
    if (Array.isArray(p.scenario_fit) && p.scenario_fit.map(String).includes(args.scenarioId)) s += 0.12;
    return s;
  };

  const top = [...relevant].sort((a, b) => score(b) - score(a)).slice(0, 3);
  const sanitize = (s: string) => String(s ?? "").replace(/\s+/g, " ").trim();
  const replace = (s: string) =>
    sanitize(s)
      .replace(/\{niche\}/gi, args.userText || "your niche")
      .replace(/\{approach\}/gi, "one approach")
      .replace(/\{time_box\}/gi, "7 days")
      .replace(/\{3_mistakes\}/gi, "3")
      .replace(/\{common_action\}/gi, "this")
      .replace(/\{goal\}/gi, "better results");

  const examples = top.map((p: any) => `- ${replace(String(p.structure ?? ""))}`).filter(Boolean);
  if (!examples.length) return null;

  const text = [
    "TikTok title/cover-text rules:",
    "- Treat these like on-screen cover text or spoken opener lines: short, punchy, high-contrast; not SEO/YouTube phrasing.",
    "- Avoid long “How to …” search titles unless the first 3 words still interrupt the scroll.",
    "- Prefer mistakes, before/after, quick interrupts, specific payoff promises, and direct address.",
    "",
    "Reference TikTok title styles (adapt to the topic):",
    ...examples,
    "",
    "Output 10 distinct title lines (aim for ~3–8 words each). No explanations."
  ].join("\n");

  return {
    text,
    meta: {
      patternIds: top.map((p: any) => String(p.id)).filter(Boolean),
      types: ["title"]
    }
  };
}

function buildV193CaptionReinforcementAddendum(args: {
  userText: string;
  v193Patterns: any;
  intentId: string;
  scenarioId: string;
  chainRules: V193TikTokChainRules | null;
}): { text: string; meta: { patternIds: string[]; types: ("caption" | "hook" | "title" | "cta")[] } } | null {
  const patterns = Array.isArray(args.v193Patterns?.patterns) ? args.v193Patterns.patterns : [];
  const relevant = patterns.filter(
    (p: any) => p.platform === "tiktok" && ["hook_focus", "title"].includes(String(p.tool_type ?? ""))
  );
  if (!relevant.length) return null;

  const score = (p: any) => {
    const q = typeof p.quality_score === "number" ? p.quality_score : 0.5;
    const r = typeof p.revenue_score === "number" ? p.revenue_score : 0.5;
    let s = q * 0.6 + r * 0.4;
    if (Array.isArray(p.intent_fit) && p.intent_fit.map(String).includes(args.intentId)) s += 0.14;
    if (Array.isArray(p.scenario_fit) && p.scenario_fit.map(String).includes(args.scenarioId)) s += 0.12;
    return s;
  };

  const pick = (pt: string) =>
    [...relevant]
      .filter((p: any) => String(p.pattern_type ?? "").toLowerCase() === pt)
      .sort((a, b) => score(b) - score(a))[0] ?? null;

  const hook = pick("hook");
  const title = pick("title");
  const cta = pick("cta");

  const sanitize = (s: string) => String(s ?? "").replace(/\s+/g, " ").trim();
  const replace = (s: string) =>
    sanitize(s)
      .replace(/\{niche\}/gi, args.userText || "your niche")
      .replace(/\{goal\}/gi, "your goal")
      .replace(/\{mistake_or_problem\}/gi, "the core mistake")
      .replace(/\{micro_fix\}/gi, "a small fix")
      .replace(/\{common_action\}/gi, "this")
      .replace(/\{approach\}/gi, "one approach")
      .replace(/\{time_box\}/gi, "7 days")
      .replace(/\{common_advice\}/gi, "common advice")
      .replace(/\{specific_action\}/gi, "a specific action");

  const text = [
    "TikTok caption cadence rules:",
    "- Keep captions short and spoken: 1–2 punchy lines + optional CTA line.",
    "- Line 1 should continue the same angle as hook/title (same promise, no pivot).",
    "- Use compact payoff phrasing (what changed, what to do next, or why this works).",
    `- Chain style: ${args.chainRules?.chain_style ?? "curiosity_payoff"} · CTA intensity: ${args.chainRules?.cta_intensity ?? "soft"}.`,
    "",
    hook?.structure ? `Hook-aligned opener seed: ${replace(String(hook.structure))}` : "",
    title?.structure ? `Title-aligned phrasing seed: ${replace(String(title.structure))}` : "",
    cta?.structure ? `CTA seed: ${replace(String(cta.structure))}` : "",
    "",
    "Output short TikTok-ready captions (not blog copy, not SEO sentence blocks)."
  ]
    .filter(Boolean)
    .join("\n");

  return {
    text,
    meta: {
      patternIds: [hook?.id, title?.id, cta?.id].filter(Boolean).map(String),
      types: [
        "caption",
        ...(hook ? (["hook"] as const) : []),
        ...(title ? (["title"] as const) : []),
        ...(cta ? (["cta"] as const) : [])
      ] as Array<"title" | "hook" | "cta" | "caption">
    }
  };
}

function extractLine(src: string, re: RegExp): string | null {
  const m = src.match(re);
  if (!m) return null;
  return (m[1] ?? "").trim() || null;
}

function extractPrimaryFocus(src: string): "growth" | "conversion" | null {
  const m = src.match(/^Stage:\s*[^\n]*primary focus:\s*(growth|conversion)\s*·/m);
  if (!m) return null;
  const v = m[1];
  return v === "growth" || v === "conversion" ? v : null;
}

function findStyleRowLoose(
  styleMap: Record<string, any>,
  dominantStyle: string
): { [k: string]: any } | null {
  const s = dominantStyle.toLowerCase();
  for (const [k, v] of Object.entries(styleMap)) {
    const kl = k.toLowerCase();
    if (s.includes(kl)) return v;
  }
  return null;
}

export function mergeV186WithV172Retrieval(v186Block: string, v172Block: string): string {
  const a = v186Block.trim();
  const b = v172Block.trim();
  if (!a) return b;
  if (!b) return a;
  return `${a}\n\n---\n\n${b}`;
}

/** Client: build prompt prefix for /api/generate (hashtag, title tools). */
export function buildV186PromptPrefixForPlainGenerate(
  toolSlug: string,
  intentId: string,
  scenarioId: string,
  userText: string,
  opts?: {
    platform?: PlatformId | null;
    userProfile?: PlatformUserProfile;
    creatorAnalysisSummary?: string | null;
  }
): string {
  const r = resolveV186({
    toolSlug,
    intentId,
    scenarioId,
    userText,
    platform: opts?.platform ?? null,
    userProfile: opts?.userProfile,
    creatorAnalysisSummary: opts?.creatorAnalysisSummary ?? null
  });
  if (!r) return userText.trim();
  return `${r.knowledgeBlock}\n\n---\n\nTask context:\n${r.effectiveUserInput}`;
}

/** Client: build prompt prefix + whether V193 TikTok observations were applied (for UI hint + audits). */
export function buildV186PromptPrefixForPlainGenerateWithMeta(
  toolSlug: string,
  intentId: string,
  scenarioId: string,
  userText: string,
  opts?: {
    platform?: PlatformId | null;
    userProfile?: PlatformUserProfile;
    creatorAnalysisSummary?: string | null;
    debugDisableV193?: boolean;
  }
): {
  promptPrefix: string;
  v193Applied: boolean;
  v193Meta?: V193GenerationMeta;
  v193ChainRules?: V193TikTokChainRules;
} {
  const r = resolveV186({
    toolSlug,
    intentId,
    scenarioId,
    userText,
    platform: opts?.platform ?? null,
    userProfile: opts?.userProfile,
    creatorAnalysisSummary: opts?.creatorAnalysisSummary ?? null,
    debugDisableV193: opts?.debugDisableV193 === true
  });
  if (!r) return { promptPrefix: userText.trim(), v193Applied: false };
  return {
    promptPrefix: `${r.knowledgeBlock}\n\n---\n\nTask context:\n${r.effectiveUserInput}`,
    v193Applied: r.v193ObservationApplied === true,
    v193Meta: r.v193GenerationMeta,
    v193ChainRules: r.v193ChainRules
  };
}
