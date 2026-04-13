/**
 * Admin-only publish readiness heuristics for SEO articles (no effect on public rendering).
 */

import { buildStoredDescription, validateSeoArticle } from "@/lib/seo/seo-gate";

/** Keep in sync with section-generate (duplicated here so admin client bundles avoid AI imports). */
const MIN_SECTION_WORDS_EN = 118;
const MIN_SECTION_HAN_ZH = 118;

function wordCountEn(s: string): number {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function countHan(s: string): number {
  return (s.match(/[\u4e00-\u9fff]/g) ?? []).length;
}

function sectionMeetsMinLength(body: string, lang: "en" | "zh"): boolean {
  const t = body.trim();
  if (!t) return false;
  if (lang === "en") return wordCountEn(t) >= MIN_SECTION_WORDS_EN;
  return countHan(t) >= MIN_SECTION_HAN_ZH;
}

export type PublishReadinessLevel = "ready" | "review" | "block";

export type ReadinessCheckStatus = "pass" | "warn" | "fail";

export type ReadinessCheck = {
  id: string;
  label: string;
  status: ReadinessCheckStatus;
  detail?: string;
};

export type PublishReadinessResult = {
  level: PublishReadinessLevel;
  score: number;
  checks: ReadinessCheck[];
  blockReasons: string[];
};

function inferLang(content: string): "en" | "zh" {
  return countHan(content) > wordCountEn(content) * 1.2 ? "zh" : "en";
}

function listH2Headings(md: string): string[] {
  const out: string[] = [];
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) out.push(m[1]!.trim());
  }
  return out;
}

function stripLeadingH1(md: string): string {
  return md.replace(/^#\s+[^\n]+\r?\n+/, "").trim();
}

/** Same boundary rules as draft section assembly (line-anchored ## headings). */
function extractSectionBodies(fullBody: string, headings: string[]): string[] {
  const bodies: string[] = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]!.trim();
    const needle = `\n## ${h}\n`;
    let idx = fullBody.indexOf(needle);
    if (idx === -1 && fullBody.startsWith(`## ${h}\n`)) idx = 0;
    if (idx === -1) {
      bodies.push("");
      continue;
    }
    const start = idx === 0 ? `## ${h}\n`.length : idx + needle.length;
    const nextH = headings[i + 1]?.trim();
    let end = fullBody.length;
    if (nextH) {
      const nextNeedle = `\n## ${nextH}\n`;
      const nextIdx = fullBody.indexOf(nextNeedle, start);
      if (nextIdx !== -1) end = nextIdx;
    }
    bodies.push(fullBody.slice(start, end).trim());
  }
  return bodies;
}

function duplicateParagraphRisk(md: string): ReadinessCheck {
  const blocks = md
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/^#+\s/.test(p));
  const seen = new Map<string, number>();
  for (const b of blocks) {
    const key = b.toLowerCase().replace(/\s+/g, " ").slice(0, 500);
    if (key.length < 50) continue;
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    if (n >= 2) {
      return {
        id: "repeated_paragraph",
        label: "重复段落风险",
        status: "fail",
        detail: "发现高度相似的段落块"
      };
    }
  }
  return { id: "repeated_paragraph", label: "重复段落风险", status: "pass" };
}

function hasExampleSignal(body: string, lang: "en" | "zh"): boolean {
  const b = body.toLowerCase();
  if (lang === "zh") {
    return /例如|比如|举例|如：|案例|\d{2,}/.test(body);
  }
  return (
    /\b(for example|e\.g\.|such as|instance)\b/.test(b) ||
    /\d{2,}/.test(body) ||
    /\b(before\b.*\bafter|scenario)\b/i.test(body)
  );
}

function hasActionableSignal(body: string, lang: "en" | "zh"): boolean {
  if (lang === "zh") {
    return /(建议|可以|步骤|先.{0,6}再|务必|避免|尝试)/.test(body);
  }
  const b = body.toLowerCase();
  return (
    /\b(you can|you should|try to|start by|avoid |make sure|set up|enable |disable |use a )\b/.test(b) ||
    /^\s*[-*]\s+\S/m.test(body) ||
    /\bstep\s+[0-9]+\b/i.test(body)
  );
}

export function computePublishReadiness(input: {
  title: string;
  slug: string;
  description: string;
  content: string;
}): PublishReadinessResult {
  const title = input.title.trim();
  const slug = input.slug.trim();
  const description = input.description.trim();
  const content = input.content ?? "";
  const bodyForLang = stripLeadingH1(content) || content;
  const lang = inferLang(bodyForLang);

  const checks: ReadinessCheck[] = [];

  if (!title) {
    checks.push({ id: "title", label: "标题质量", status: "fail", detail: "标题为空" });
  } else if (title.length < 10) {
    checks.push({ id: "title", label: "标题质量", status: "warn", detail: "标题过短" });
  } else if (title.length > 100) {
    checks.push({ id: "title", label: "标题质量", status: "warn", detail: "标题对搜索结果展示偏长" });
  } else {
    checks.push({ id: "title", label: "标题质量", status: "pass" });
  }

  const storedDesc = buildStoredDescription(description, content);
  if (storedDesc.trim().length < 25) {
    checks.push({
      id: "description",
      label: "描述质量",
      status: "fail",
      detail: "摘要/描述缺失或过短（有效长度不足 25 字符）"
    });
  } else if (storedDesc.length < 80) {
    checks.push({
      id: "description",
      label: "描述质量",
      status: "warn",
      detail: "描述约不足 80 字符，可适当加长"
    });
  } else {
    checks.push({ id: "description", label: "描述质量", status: "pass" });
  }

  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  if (!slug) {
    checks.push({ id: "slug", label: "Slug 质量", status: "fail", detail: "Slug 为空" });
  } else if (!slugOk) {
    checks.push({
      id: "slug",
      label: "Slug 质量",
      status: "fail",
      detail: "仅允许小写字母、数字与单连字符"
    });
  } else if (slug.length < 3 || slug.length > 72) {
    checks.push({ id: "slug", label: "Slug 质量", status: "warn", detail: "Slug 长度建议在 3–72 之间" });
  } else {
    checks.push({ id: "slug", label: "Slug 质量", status: "pass" });
  }

  const headings = listH2Headings(content);
  const h2n = headings.length;
  if (h2n === 0) {
    checks.push({
      id: "section_count",
      label: "小节数量（##）",
      status: "warn",
      detail: "暂无 H2 小节；清晰分节有利于阅读与 SEO"
    });
  } else if (h2n < 3) {
    checks.push({
      id: "section_count",
      label: "小节数量（##）",
      status: "warn",
      detail: `当前 ${h2n} 个 H2，指南类文章建议不少于 3 个`
    });
  } else {
    checks.push({ id: "section_count", label: "小节数量（##）", status: "pass", detail: `共 ${h2n} 个小节` });
  }

  let sectionBodies: string[];
  if (headings.length > 0) {
    sectionBodies = extractSectionBodies(content, headings);
  } else {
    sectionBodies = [bodyForLang];
  }

  const shortSections: number[] = [];
  for (let i = 0; i < sectionBodies.length; i++) {
    if (!sectionMeetsMinLength(sectionBodies[i]!, lang)) shortSections.push(i);
  }
  if (sectionBodies.some((s) => !s.trim()) && content.trim().length > 200) {
    checks.push({
      id: "section_length",
      label: "小节篇幅",
      status: "fail",
      detail: "存在空小节"
    });
  } else if (bodyForLang.trim().length < 80) {
    checks.push({
      id: "section_length",
      label: "小节篇幅",
      status: "fail",
      detail: "正文整体过短"
    });
  } else if (shortSections.length > 0) {
    const min = lang === "en" ? MIN_SECTION_WORDS_EN : MIN_SECTION_HAN_ZH;
    checks.push({
      id: "section_length",
      label: "小节篇幅",
      status: "warn",
      detail: `${shortSections.length} 个小节低于建议密度（约每节 ${min} ${lang === "en" ? "词" : "汉字"}）`
    });
  } else {
    checks.push({ id: "section_length", label: "小节篇幅", status: "pass" });
  }

  if (!hasExampleSignal(bodyForLang, lang)) {
    checks.push({
      id: "example",
      label: "示例与具象信息",
      status: "warn",
      detail: "建议补充具体示例（数字、场景或「例如」类表述）"
    });
  } else {
    checks.push({ id: "example", label: "示例与具象信息", status: "pass" });
  }

  if (!hasActionableSignal(bodyForLang, lang)) {
    checks.push({
      id: "actionable",
      label: "可执行建议",
      status: "warn",
      detail: "建议增加明确动作（步骤、祈使句或简短清单）"
    });
  } else {
    checks.push({ id: "actionable", label: "可执行建议", status: "pass" });
  }

  checks.push(duplicateParagraphRisk(content));

  const gate = validateSeoArticle({ title, description, content });
  if (!gate.ok) {
    checks.push({
      id: "publish_gate",
      label: "发布闸口（seo-gate）",
      status: "warn",
      detail: gate.reasons.slice(0, 4).join("; ") + (gate.reasons.length > 4 ? "…" : "")
    });
  } else {
    checks.push({ id: "publish_gate", label: "发布闸口（seo-gate）", status: "pass" });
  }

  let score = 100;
  const blockReasons: string[] = [];
  for (const c of checks) {
    if (c.status === "fail") {
      score -= 28;
      if (
        c.id === "title" ||
        c.id === "slug" ||
        c.id === "repeated_paragraph" ||
        c.id === "description" ||
        c.id === "section_length"
      ) {
        blockReasons.push(c.detail ?? c.label);
      }
    } else if (c.status === "warn") {
      score -= 10;
    }
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  const blocked =
    !title ||
    !slug ||
    !slugOk ||
    bodyForLang.trim().length < 80 ||
    checks.some((c) => c.id === "repeated_paragraph" && c.status === "fail") ||
    storedDesc.trim().length < 25 ||
    checks.some((c) => c.id === "section_length" && c.status === "fail");

  const hasWarn = checks.some((c) => c.status === "warn");

  let level: PublishReadinessLevel;
  if (blocked) {
    level = "block";
  } else if (!gate.ok || hasWarn || score < 88) {
    level = "review";
  } else {
    level = "ready";
  }

  return { level, score, checks, blockReasons: [...new Set(blockReasons)] };
}
