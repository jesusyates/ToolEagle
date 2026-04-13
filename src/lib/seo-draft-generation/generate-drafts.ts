import fs from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { deepseekProvider } from "@/lib/ai/providers/deepseek";
import { generateArticleBySections } from "./section-generate";
import type { SeoPreflightCandidateResult } from "@/lib/seo-preflight";
import type { SeoDraftGenerationJobResult, SeoDraftRowResult } from "./types";

type DraftSource = SeoDraftGenerationJobResult["source"];

function mapRebuildLanguage(contentLanguage: string): "en" | "zh" {
  return contentLanguage.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function wordCountEn(s: string): number {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Non-reflective stub if section generation fails entirely. */
function buildOutlineFallbackBody(c: SeoPreflightCandidateResult, lang: "en" | "zh"): string {
  const outline =
    c.outlineHeadings.length > 0 ? c.outlineHeadings : ["Scope", "Steps", "Examples", "Checklist", "Summary"];
  if (lang === "zh") {
    const parts: string[] = [`# ${c.title}`, "", `> ${c.description}`, ""];
    for (const h of outline) {
      parts.push(`## ${h}`, "");
      parts.push(
        "本节说明可操作步骤与验收标准。示例：将任务拆为三天可完成的最小单元；每天记录一个指标；周末复盘是否更接近目标。避免空泛口号，优先写清「谁、在什么场景、先做什么」。"
      );
    }
    let text = parts.join("\n\n");
    while (text.length < 3500) {
      text +=
        "\n\n补充要点：列出常见误区与对应修正；给出一份简短检查清单，便于发布前自检。";
    }
    return text;
  }
  const parts: string[] = [`# ${c.title}`, "", `> ${c.description}`, ""];
  for (const h of outline) {
    parts.push(`## ${h}`, "");
    parts.push(
      "This section focuses on concrete steps and acceptance checks. Example: break work into a three-day slice you can finish; track one metric daily; review on Friday whether you moved the outcome. Name the audience and scenario; state the first action; avoid generic slogans."
    );
  }
  let text = parts.join("\n\n");
  while (wordCountEn(text) < 680) {
    text +=
      "\n\nAdd-on: list two common mistakes and fixes, plus a short pre-publish checklist.";
  }
  return text;
}

async function allocateUniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  baseFromTitle: string
): Promise<string> {
  const normalized =
    baseFromTitle
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "guide";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? normalized : `${normalized}-${n}`;
    const { data } = await admin.from("seo_articles").select("slug").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    n++;
  }
}

function isProviderUnavailableError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("http 402") ||
    m.includes("insufficient balance") ||
    m.includes("deepseek_api_key not configured") ||
    m.includes("deepseek_api_key missing")
  );
}

export async function generateSeoDraftsFromPreflight(
  approved: SeoPreflightCandidateResult[],
  options?: {
    repoRoot?: string;
    persistLog?: boolean;
    source?: DraftSource;
  }
): Promise<SeoDraftGenerationJobResult> {
  const rows: SeoDraftRowResult[] = [];
  const admin = createAdminClient();
  const usable = await deepseekProvider.healthCheck();

  for (const c of approved) {
    const outline = c.outlineHeadings ?? [];
    const lang = mapRebuildLanguage(c.contentLanguage);

    const baseRow = (partial: Partial<SeoDraftRowResult>): SeoDraftRowResult => ({
      topic: c.topic,
      title: c.title,
      slug: c.slug,
      description: c.description,
      outline,
      fullContent: "",
      qualityPass: false,
      qualityRejectReason: null,
      savedAsDraft: false,
      saveError: null,
      ...partial
    });

    console.log("[seo-draft-debug] input topic=", c.topic, "title=", c.title, "lang=", lang, "sections=", outline.length);

    if (!usable) {
      console.log("[seo-draft-debug] failure_stage=A provider_unavailable");
      rows.push(
        baseRow({
          qualityRejectReason: "provider_unavailable",
          fullContent: ""
        })
      );
      continue;
    }

    let fullContent = "";
    let sectionGenError: string | null = null;
    let structureValidationOk = true;
    let structureReasons: string[] = [];

    try {
      const { body, validation } = await generateArticleBySections({
        title: c.title,
        outlineHeadings: outline,
        contentLanguage: c.contentLanguage
      });
      fullContent = body;
      structureValidationOk = validation.ok;
      structureReasons = validation.reasons;
      console.log(
        "[seo-draft-debug] section_generate ok chars=",
        body.length,
        "validation_ok=",
        validation.ok,
        validation.reasons.length ? validation.reasons.join("; ") : ""
      );
    } catch (e) {
      sectionGenError = e instanceof Error ? e.message : String(e);
      console.log("[seo-draft-debug] section_generate threw:", sectionGenError);
      if (isProviderUnavailableError(sectionGenError)) {
        rows.push(
          baseRow({
            qualityRejectReason: "provider_unavailable",
            fullContent: ""
          })
        );
        continue;
      }
      fullContent = buildOutlineFallbackBody(c, lang);
      structureValidationOk = false;
      structureReasons = [`fallback_after_error:${sectionGenError.slice(0, 160)}`];
    }

    if (!fullContent.trim()) {
      rows.push(
        baseRow({
          qualityRejectReason: "empty_body",
          fullContent: ""
        })
      );
      continue;
    }

    const substantial =
      fullContent.trim().length >= 1500 || (lang === "en" && wordCountEn(fullContent) >= 400);
    const validationNote =
      !structureValidationOk && structureReasons.length > 0 ? structureReasons.join(" | ") : null;

    if (!substantial) {
      rows.push(
        baseRow({
          title: c.title.trim(),
          fullContent,
          qualityPass: false,
          qualityRejectReason: validationNote ?? "content_too_short_for_draft"
        })
      );
      continue;
    }

    const finalTitle = c.title.trim();
    const finalDescription = c.description;
    const qualityPass = structureValidationOk && !sectionGenError;
    const qualityRejectReason =
      !structureValidationOk && validationNote
        ? `structure_validation:${validationNote}`
        : sectionGenError
          ? `section_gen_used_fallback:${sectionGenError.slice(0, 120)}`
          : null;

    const finalSlug = await allocateUniqueSlug(admin, finalTitle);
    const now = new Date().toISOString();
    const { error } = await admin.from("seo_articles").insert({
      title: finalTitle,
      slug: finalSlug,
      description: finalDescription || null,
      content: fullContent,
      status: "draft",
      created_at: now,
      updated_at: now
    });

    if (error) {
      console.log("[seo-draft-debug] failure_stage=DB", error.message);
      rows.push(
        baseRow({
          title: finalTitle,
          slug: finalSlug,
          description: finalDescription,
          fullContent,
          qualityPass,
          qualityRejectReason,
          savedAsDraft: false,
          saveError: error.message
        })
      );
      continue;
    }

    console.log("[seo-draft-debug] saved draft slug=", finalSlug);
    rows.push(
      baseRow({
        title: finalTitle,
        slug: finalSlug,
        description: finalDescription,
        fullContent,
        qualityPass,
        qualityRejectReason,
        savedAsDraft: true,
        saveError: null
      })
    );
  }

  const savedCount = rows.filter((r) => r.savedAsDraft).length;
  console.log("[seo-draft-debug] saved_draft_count=", savedCount);

  const result: SeoDraftGenerationJobResult = {
    ranAt: new Date().toISOString(),
    source: options?.source ?? "request_body",
    inputCount: approved.length,
    rows
  };

  if (options?.persistLog !== false) {
    const root = options?.repoRoot ?? process.cwd();
    await fs.writeFile(
      path.join(root, "generated", "seo-draft-generation-last-run.json"),
      `${JSON.stringify(result, null, 2)}\n`,
      "utf8"
    );
  }

  return result;
}
