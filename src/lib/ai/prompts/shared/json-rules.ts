/** Shared JSON contract for post-package generations (all markets). */

export const JSON_RULES = `Return ONLY valid JSON (no markdown) with this exact shape:
{"packages":[{"topic":"...","hook":"...","script_talking_points":"...","caption":"...","cta_line":"...","hashtags":"...","why_it_works":"...","posting_tips":"...","best_for":"...","variation_pack":"...","hook_strength_label":"...","why_opening_grabs":"...","why_structure_completion":"...","why_copy_growth":"...","context_account":"...","context_scenario":"...","context_audience":"...","publish_rhythm":"...","version_plain":"...","version_optimized":"..."}]}
Each package must have ALL 19 keys. Use strings only. topic: one-line 选题/标题. hashtags: space-separated with #.
why_it_works: one-line summary; posting_tips: scheduling / distribution tips (separate from publish_rhythm).`;

/** V106.1 — Single coherent pack: topic + hook + full script + caption + comment CTA in one unit */
export function buildPublishPackSuffix(locale: string): string {
  const zh = locale === "zh" || locale.startsWith("zh");
  if (zh) {
    return `\n\nV106.1 — 一键发布内容包（同一套故事，禁止让用户自己拼多块）：
每个 package 内 topic、hook、script_talking_points、caption、cta_line 必须互相对齐、可直接开拍与粘贴。
script_talking_points 必须写「完整口播全文」（多行、可进提词器），不要只给稀疏要点除非篇幅极限。
cta_line 专门写「评论引导 / 互动 CTA」（可执行：评什么、选什么、接龙什么）。
caption 写描述区/正文区可直接粘贴的文案。用户不应再跨工具合并结果。`;
  }
  return `\n\nV106.1 — ONE unified publish pack per package: topic, hook, script_talking_points (FULL script, multi-line, teleprompter-ready), caption (description/body paste), cta_line (comment / engagement CTA). All five must tell ONE coherent story — no stitching across tools.`;
}

/** V106 — appended to user prompt (value density, not new tools) */
export function buildV106UserSuffix(locale: string, count: number, depth: "compact" | "full"): string {
  const zh = locale === "zh" || locale.startsWith("zh");
  const packRule = zh
    ? `variation_pack: exactly one of 情绪型 / 带货型 / 干货型 / 娱乐型. Across ${count} packages, rotate so each label appears at least once when count≥4 (otherwise cycle evenly).`
    : `variation_pack: exactly one of Emotional / Sales / Educational / Entertainment — rotate across packages.`;
  const hookRule = zh
    ? `hook_strength_label: exactly one of 强钩子 / 中等钩子 / 保守钩子 — vary across packages.`
    : `hook_strength_label: exactly one of Strong hook / Medium hook / Safe hook — vary across packages.`;
  const whyRule = zh
    ? `why_opening_grabs = 为什么这个开头能抓人. why_structure_completion = 为什么这个结构能提高完播率. why_copy_growth = 为什么这个文案适合带货/涨粉. Each 1–3 short lines.`
    : `why_opening_grabs / why_structure_completion / why_copy_growth: three distinct “why” lines matching those intents in English.`;
  const ctxRule = zh
    ? "context_account = 适合什么类型账号; context_scenario = 适合什么内容场景; context_audience = 适合什么受众 — concrete phrases."
    : "context_account / context_scenario / context_audience: short concrete phrases (account type, scenario, audience).";
  const rhythmRule = zh
    ? `publish_rhythm: 可直接复制的分段结构 + 节奏/气口提示（如 0–2s / 2–10s），便于提词器拍摄。`
    : `publish_rhythm: segmented outline + pacing cues (timestamps ok) for filming.`;
  const cmpRule = zh
    ? `version_plain = 普通版本（更直述、少技巧）; version_optimized = 优化版本（更强钩子、更紧结构、更清晰 CTA）。同一选题两种表达。`
    : `version_plain = plainer draft; version_optimized = tightened, more scroll-stopping version of the same idea.`;
  const depthRule =
    depth === "compact"
      ? "V106 fields: keep each to 1–2 short lines max (except publish_rhythm may use 3–5 bullet lines)."
      : "V106 fields: full sentences; publish_rhythm may use numbered segments with seconds.";

  return `\n\nV106 — PUBLISH-READY VALUE PACK (mandatory, all keys):\n${packRule}\n${hookRule}\n${whyRule}\n${ctxRule}\n${rhythmRule}\n${cmpRule}\n${depthRule}`;
}

export function buildBaseUserInstruction(
  userInput: string,
  count: number,
  depth: "compact" | "full"
): string {
  const depthNote =
    depth === "compact"
      ? "Keep core fields tight (1–3 lines). why_it_works: 1 short summary line. posting_tips: 2 short bullets max."
      : "Make copy publish-ready: vivid hooks, clear talking points, strong CTA. why_it_works: 1–2 sentence summary. posting_tips: 3–4 actionable bullets.";
  return `Creator topic / idea: "${userInput}"

Generate exactly ${count} distinct post package(s) for short-form video (TikTok / Reels / Shorts).
${depthNote}

${JSON_RULES}`;
}
