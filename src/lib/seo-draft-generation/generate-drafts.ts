import fs from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { deepseekProvider } from "@/lib/ai/providers/deepseek";
import { fetchSeoArticlesCorpus, type SeoArticleCorpusRow } from "@/lib/seo/gap-topic-engine";
import { matchLedgerItemsForTopic, type SeoHistoryLedger } from "./seo-history-ledger";
import { generateArticleBySections } from "./section-generate";
import { polishSeoTitle, generateSeoDescription } from "@/lib/seo/seo-auto-polish";
import { classifyDraftForRecycle, finalizeSeoDraft, type FinalizedSeoDraft } from "./seo-draft-quality";
import { recordRecycleRetryConsumed } from "./recycle-retry-state";
import type { SeoDraftReviewStatus } from "./seo-draft-quality";
import {
  buildSeoArticlePlan,
  buildSeoHistoryContext,
  formatApprovedFrameworkForSections,
  generateSeoDraftFramework,
  isAcceptableFramework
} from "./seo-draft-handshake";
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
    /** When omitted, loads once via `fetchSeoArticlesCorpus` (same rows as automation pipeline). */
    corpus?: SeoArticleCorpusRow[];
    /** Published-article memory (`generated/seo-history-ledger.json`); avoids full published-body scan for AI context. */
    historyLedger?: SeoHistoryLedger;
  }
): Promise<SeoDraftGenerationJobResult> {
  const rows: SeoDraftRowResult[] = [];
  const admin = createAdminClient();
  const usable = await deepseekProvider.healthCheck();

  const historyLedger = options?.historyLedger;
  const ledgerReady = Boolean(historyLedger && historyLedger.items.length > 0);

  let corpus: SeoArticleCorpusRow[] = options?.corpus ?? [];
  if (corpus.length === 0 && !ledgerReady) {
    try {
      corpus = await fetchSeoArticlesCorpus(admin);
    } catch (e) {
      console.log("[seo-draft-debug] corpus_load_failed:", e instanceof Error ? e.message : String(e));
      corpus = [];
    }
  }

  let handshakeFrameworkAccepted = 0;
  let handshakeFrameworkRejected = 0;
  let handshakeArticleGenerated = 0;

  for (const c of approved) {
    const recycleId = c.existingArticleId;
    try {
    const outline = c.outlineHeadings ?? [];
    const lang = mapRebuildLanguage(c.contentLanguage);

    const baseRow = (partial: Partial<SeoDraftRowResult>): SeoDraftRowResult => {
      const row: SeoDraftRowResult = {
        topic: c.topic,
        title: partial.title ?? c.title,
        slug: partial.slug ?? c.slug,
        description: partial.description ?? c.description,
        outline: partial.outline ?? outline,
        fullContent: partial.fullContent ?? "",
        qualityPass: partial.qualityPass ?? false,
        qualityRejectReason: partial.qualityRejectReason ?? null,
        review_status: partial.review_status ?? "rejected",
        quality_reasons: partial.quality_reasons ?? [],
        savedAsDraft: partial.savedAsDraft ?? false,
        saveError: partial.saveError ?? null,
        articleId: partial.articleId ?? null
      };
      if (row.review_status !== "publish_ready") {
        row.recycle_class = classifyDraftForRecycle({
          title: row.title,
          quality_reasons: row.quality_reasons
        });
      }
      return row;
    };

    console.log(
      "[seo-draft-debug] input topic=",
      c.topic,
      "title=",
      c.title,
      "lang=",
      lang,
      "sections=",
      outline.length,
      recycleId ? `recycle_retry=${recycleId}` : ""
    );

    if (!usable) {
      console.log("[seo-draft-debug] failure_stage=A provider_unavailable");
      rows.push(
        baseRow({
          qualityRejectReason: "provider_unavailable",
          fullContent: "",
          review_status: "rejected",
          quality_reasons: ["provider_unavailable"]
        })
      );
      continue;
    }

    const matchedLedger =
      ledgerReady && historyLedger
        ? matchLedgerItemsForTopic(c.title, historyLedger, 10)
        : [];
    if (ledgerReady) {
      console.log("[SEO HISTORY LEDGER] matched for topic:", matchedLedger.length);
    }

    const history = buildSeoHistoryContext({
      title: c.title,
      corpus,
      ledgerItems: matchedLedger.length > 0 ? matchedLedger : undefined
    });
    const plan = buildSeoArticlePlan({ title: c.title, history });

    console.log("[SEO HANDSHAKE] history titles:", history.relatedPublishedTitles.length);

    let framework = await generateSeoDraftFramework({
      title: c.title,
      history,
      plan,
      contentLanguage: c.contentLanguage
    }).catch(() => null);

    if (!framework || !isAcceptableFramework(framework)) {
      framework = await generateSeoDraftFramework({
        title: c.title,
        history,
        plan,
        contentLanguage: c.contentLanguage
      }).catch(() => null);
    }

    if (!framework || !isAcceptableFramework(framework)) {
      handshakeFrameworkRejected++;
      console.log("[SEO HANDSHAKE] framework accepted:", handshakeFrameworkAccepted);
      console.log("[SEO HANDSHAKE] framework rejected:", handshakeFrameworkRejected);
      console.log("[SEO HANDSHAKE] article generated:", handshakeArticleGenerated);
      rows.push(
        baseRow({
          outline: outline,
          qualityRejectReason: "framework_rejected",
          fullContent: "",
          review_status: "rejected",
          quality_reasons: ["framework_rejected"]
        })
      );
      continue;
    }

    handshakeFrameworkAccepted++;
    const outlineFromFramework = framework.outline.map((h) => h.trim()).filter(Boolean);
    const rowOutline = outlineFromFramework.length >= 4 ? outlineFromFramework : outline;
    const frameworkBlock = formatApprovedFrameworkForSections(framework, history);

    let fullContent = "";
    let sectionGenError: string | null = null;
    let structureValidationOk = true;
    let structureReasons: string[] = [];
    let finalTitle = c.title.trim();
    let finalDescription = c.description;
    let fin: ReturnType<typeof finalizeSeoDraft> | null = null;
    let qualityReasons: string[] = [];
    let reviewStatus: SeoDraftReviewStatus = "rejected";
    let validationNote: string | null = null;
    let skipCandidateAfterProvider = false;
    type QaSnap = {
      fullContent: string;
      finalTitle: string;
      finalDescription: string;
      fin: FinalizedSeoDraft;
      reviewStatus: SeoDraftReviewStatus;
      qualityReasons: string[];
      validationNote: string | null;
    };
    let lastQaSnapshot: QaSnap | null = null;
    let finalizePasses = 0;

    for (let qaAttempt = 1; qaAttempt <= 2; qaAttempt++) {
      if (qaAttempt === 2) {
        console.log("[SEO QA] retry once:", c.title);
      }

      fullContent = "";
      sectionGenError = null;
      structureValidationOk = true;
      structureReasons = [];

      try {
        const { body, validation } = await generateArticleBySections({
          title: c.title,
          topic: c.topic,
          outlineHeadings: rowOutline,
          contentLanguage: c.contentLanguage,
          approvedFrameworkBlock: frameworkBlock
        });
        fullContent = body;
        structureValidationOk = validation.ok;
        structureReasons = validation.reasons;
        handshakeArticleGenerated++;
        console.log(
          "[seo-draft-debug] section_generate ok chars=",
          body.length,
          "qaAttempt=",
          qaAttempt,
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
              outline: rowOutline,
              qualityRejectReason: "provider_unavailable",
              fullContent: "",
              review_status: "rejected",
              quality_reasons: ["provider_unavailable"]
            })
          );
          console.log("[SEO HANDSHAKE] framework accepted:", handshakeFrameworkAccepted);
          console.log("[SEO HANDSHAKE] framework rejected:", handshakeFrameworkRejected);
          console.log("[SEO HANDSHAKE] article generated:", handshakeArticleGenerated);
          skipCandidateAfterProvider = true;
          break;
        }
        fullContent = buildOutlineFallbackBody({ ...c, outlineHeadings: rowOutline }, lang);
        structureValidationOk = false;
        structureReasons = [`fallback_after_error:${sectionGenError.slice(0, 160)}`];
      }

      if (skipCandidateAfterProvider) break;

      if (!fullContent.trim()) {
        if (qaAttempt < 2) continue;
        break;
      }

      const substantialThis =
        fullContent.trim().length >= 1500 || (lang === "en" && wordCountEn(fullContent) >= 400);

      validationNote =
        !structureValidationOk && structureReasons.length > 0 ? structureReasons.join(" | ") : null;

      if (!substantialThis) {
        if (qaAttempt === 2 && lastQaSnapshot) {
          fullContent = lastQaSnapshot.fullContent;
          finalTitle = lastQaSnapshot.finalTitle;
          finalDescription = lastQaSnapshot.finalDescription;
          fin = lastQaSnapshot.fin;
          reviewStatus = lastQaSnapshot.reviewStatus;
          qualityReasons = [...lastQaSnapshot.qualityReasons];
          validationNote = lastQaSnapshot.validationNote;
          qualityReasons.push("second_pass_too_short");
        } else {
          fin = null;
          reviewStatus = "rejected";
          qualityReasons = [validationNote ?? "content_too_short_for_draft"];
        }
        break;
      }

      fin = finalizeSeoDraft({
        title: finalTitle,
        description: finalDescription,
        content: fullContent
      });

      finalTitle = (fin.title || finalTitle).trim();
      finalDescription = (fin.description ?? finalDescription).trim();
      fullContent = (fin.content || fullContent).trim();

      qualityReasons = [...fin.quality_reasons];
      reviewStatus = fin.review_status;

      if (!structureValidationOk && validationNote) {
        qualityReasons.push(`structure_validation:${validationNote}`);
        if (reviewStatus === "publish_ready") reviewStatus = "needs_revision";
      }
      if (sectionGenError) {
        qualityReasons.push(`section_gen:${sectionGenError.slice(0, 120)}`);
        if (reviewStatus === "publish_ready") reviewStatus = "needs_revision";
      }

      finalizePasses += 1;
      lastQaSnapshot = {
        fullContent,
        finalTitle,
        finalDescription,
        fin,
        reviewStatus,
        qualityReasons: [...qualityReasons],
        validationNote
      };

      if (reviewStatus === "publish_ready") {
        break;
      }
    }

    console.log("[SEO HANDSHAKE] framework accepted:", handshakeFrameworkAccepted);
    console.log("[SEO HANDSHAKE] framework rejected:", handshakeFrameworkRejected);
    console.log("[SEO HANDSHAKE] article generated:", handshakeArticleGenerated);

    if (skipCandidateAfterProvider) {
      continue;
    }

    if (!fullContent.trim()) {
      rows.push(
        baseRow({
          outline: rowOutline,
          qualityRejectReason: "empty_body",
          fullContent: "",
          review_status: "rejected",
          quality_reasons: ["empty_body"]
        })
      );
      continue;
    }

    const substantial =
      fullContent.trim().length >= 1500 || (lang === "en" && wordCountEn(fullContent) >= 400);

    if (!substantial) {
      rows.push(
        baseRow({
          outline: rowOutline,
          title: finalTitle,
          fullContent,
          qualityPass: false,
          qualityRejectReason: validationNote ?? "content_too_short_for_draft",
          review_status: "rejected",
          quality_reasons: [validationNote ?? "content_too_short_for_draft"]
        })
      );
      continue;
    }

    if (!fin) {
      rows.push(
        baseRow({
          outline: rowOutline,
          title: finalTitle,
          fullContent,
          qualityPass: false,
          qualityRejectReason: "finalize_missing",
          review_status: "rejected",
          quality_reasons: ["finalize_missing"]
        })
      );
      continue;
    }

    /** After finalizeSeoDraft / QA loop, before any DB insert/update: overwrite EN title + description only. */
    if (lang === "en" && fullContent.trim()) {
      finalTitle = polishSeoTitle(finalTitle, fullContent);
      finalDescription = generateSeoDescription(finalTitle, fullContent);
    }

    if (finalizePasses >= 2 && reviewStatus !== "publish_ready") {
      qualityReasons.push("qa_retry_exhausted");
    }

    const qualityPass = reviewStatus === "publish_ready";
    const qualityRejectReason =
      qualityReasons.length > 0 ? qualityReasons.join("; ") : null;

    if (reviewStatus !== "publish_ready") {
      if (c.existingArticleId) {
        const finalSlug = await allocateUniqueSlug(admin, finalTitle);
        const now = new Date().toISOString();
        const { error: upErr } = await admin
          .from("seo_articles")
          .update({
            title: finalTitle,
            slug: finalSlug,
            description: finalDescription || null,
            content: fullContent,
            review_status: reviewStatus,
            quality_reasons: qualityReasons,
            updated_at: now
          })
          .eq("id", c.existingArticleId);
        if (upErr) {
          console.log("[seo-draft-debug] failure_stage=DB_update_non_publish", upErr.message);
        }
      }
      rows.push(
        baseRow({
          outline: rowOutline,
          title: finalTitle,
          description: finalDescription,
          fullContent,
          qualityPass: false,
          qualityRejectReason,
          review_status: reviewStatus,
          quality_reasons: qualityReasons,
          savedAsDraft: Boolean(c.existingArticleId),
          articleId: c.existingArticleId ?? null
        })
      );
      continue;
    }

    const finalSlug = await allocateUniqueSlug(admin, finalTitle);
    const now = new Date().toISOString();

    if (c.existingArticleId) {
      const { error } = await admin
        .from("seo_articles")
        .update({
          title: finalTitle,
          slug: finalSlug,
          description: finalDescription || null,
          content: fullContent,
          review_status: reviewStatus,
          quality_reasons: qualityReasons,
          updated_at: now
        })
        .eq("id", c.existingArticleId);

      if (error) {
        console.log("[seo-draft-debug] failure_stage=DB_update", error.message);
        rows.push(
          baseRow({
            title: finalTitle,
            slug: finalSlug,
            description: finalDescription,
            fullContent,
            qualityPass,
            qualityRejectReason,
            review_status: reviewStatus,
            quality_reasons: qualityReasons,
            savedAsDraft: false,
            saveError: error.message,
            articleId: c.existingArticleId
          })
        );
        continue;
      }

      const articleId = c.existingArticleId;
      console.log("[seo-draft-debug] updated draft slug=", finalSlug, "id=", articleId);
      console.log(
        "[SEO QA SAVE] title=",
        finalTitle,
        "review_status=",
        reviewStatus,
        "reasons=",
        qualityReasons
      );
      rows.push(
        baseRow({
          title: finalTitle,
          slug: finalSlug,
          description: finalDescription,
          fullContent,
          qualityPass,
          qualityRejectReason,
          review_status: reviewStatus,
          quality_reasons: qualityReasons,
          savedAsDraft: true,
          saveError: null,
          articleId
        })
      );
      continue;
    }

    const { data: inserted, error } = await admin
      .from("seo_articles")
      .insert({
        title: finalTitle,
        slug: finalSlug,
        description: finalDescription || null,
        content: fullContent,
        status: "draft",
        review_status: reviewStatus,
        quality_reasons: qualityReasons,
        created_at: now,
        updated_at: now
      })
      .select("id")
      .single();

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
          review_status: reviewStatus,
          quality_reasons: qualityReasons,
          savedAsDraft: false,
          saveError: error.message
        })
      );
      continue;
    }

    const articleId = String((inserted as { id?: string } | null)?.id ?? "").trim() || null;
    console.log("[seo-draft-debug] saved draft slug=", finalSlug, "id=", articleId ?? "(missing)");
    console.log(
      "[SEO QA SAVE] title=",
      finalTitle,
      "review_status=",
      reviewStatus,
      "reasons=",
      qualityReasons
    );
    rows.push(
      baseRow({
        title: finalTitle,
        slug: finalSlug,
        description: finalDescription,
        fullContent,
        qualityPass,
        qualityRejectReason,
        review_status: reviewStatus,
        quality_reasons: qualityReasons,
        savedAsDraft: true,
        saveError: null,
        articleId
      })
    );
    } finally {
      if (recycleId) {
        await recordRecycleRetryConsumed(options?.repoRoot ?? process.cwd(), recycleId);
      }
    }
  }

  const savedCount = rows.filter((r) => r.savedAsDraft).length;
  console.log("[seo-draft-debug] saved_draft_count=", savedCount);
  const qaReady = rows.filter((r) => r.review_status === "publish_ready").length;
  const qaNeeds = rows.filter((r) => r.review_status === "needs_revision").length;
  const qaRej = rows.filter((r) => r.review_status === "rejected").length;
  console.log("[SEO QA] generated:", rows.length);
  console.log("[SEO QA] publish_ready:", qaReady);
  console.log("[SEO QA] needs_revision:", qaNeeds);
  console.log("[SEO QA] rejected:", qaRej);
  console.log("[SEO DROP] rejected:", qaRej);
  if (qaRej > 0) {
    console.log(
      "[SEO QA] rejected_reasons:",
      rows
        .filter((r) => r.review_status === "rejected")
        .slice(0, 10)
        .map((r) => ({ title: r.title, reasons: r.quality_reasons }))
    );
  }

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
