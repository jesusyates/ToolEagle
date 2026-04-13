import { estimatePreflightCandidateCost } from "../policy/budget";
import { buildCheapOutlineHeadings } from "../policy/outline";
import { buildMetaDescription } from "../policy/meta-description";
import { slugifyForSeo } from "../policy/slug";
import { candidateFromStructureReject, validateSeoStructure } from "../policy/seo-structure";
import { structuralTitleFingerprint } from "../policy/title-job-dedupe";
import { evaluateSeoPreflightTopicSeed, evaluateTopicEligibility } from "../policy/topic-eligibility";
import { proposeTitleFromTopic } from "../policy/title-from-topic";
import { loadPublishedCorpusFromTopicRegistry } from "../adapters/load-corpus";
import { loadOptionalCandidateFile, loadRegistryTopicSeeds, mergeCandidateTopics } from "../adapters/load-candidates";
import { writePreflightJobLog } from "../adapters/job-log";
import type {
  SeoPreflightCandidateResult,
  SeoPreflightConfig,
  SeoPreflightJobResult
} from "../types/preflight";

const TITLE_PATTERN_RETRY_MAX = 3;

function bump(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

export type RunPreflightOptions = {
  repoRoot?: string;
  candidateSeeds?: string[];
  persistLog?: boolean;
  /** When true, skip registry + seo-preflight-candidates.json; only merged request seeds (and optional scenario file via API). */
  seedsOnly?: boolean;
};

export async function runSeoPreflightJob(
  config: SeoPreflightConfig,
  options?: RunPreflightOptions
): Promise<SeoPreflightJobResult> {
  const corpus = await loadPublishedCorpusFromTopicRegistry(options?.repoRoot);
  const seedsOnly = options?.seedsOnly === true;
  const fileTopics = seedsOnly ? [] : await loadOptionalCandidateFile(options?.repoRoot);
  const registrySeeds = seedsOnly ? [] : await loadRegistryTopicSeeds(options?.repoRoot);
  const candidates = mergeCandidateTopics(fileTopics, options?.candidateSeeds ?? [], registrySeeds);

  const existingTitles = corpus.titleHints;
  const approved: SeoPreflightCandidateResult[] = [];
  const rejected: SeoPreflightCandidateResult[] = [];
  const rejectReasonCounts: Record<string, number> = {};
  let estimatedTotalCost = 0;
  let runningBudget = 0;
  const maxCost = config.maxEstimatedCost ?? Number.POSITIVE_INFINITY;
  const target = Math.max(0, Math.floor(config.targetCount));

  let candidatesSeen = 0;
  const approvedTitleStructures = new Set<string>();

  topicLoop: for (const topicSeed of candidates) {
    if (approved.length >= target) break;

    candidatesSeen++;
    const perUnit = estimatePreflightCandidateCost(config.contentType);
    const variationIndex = candidatesSeen - 1;

    for (let attempt = 0; attempt <= TITLE_PATTERN_RETRY_MAX; attempt++) {
      const title = proposeTitleFromTopic(
        topicSeed,
        config.contentType,
        config.contentLanguage,
        variationIndex,
        attempt
      );
      const slug = slugifyForSeo(title, config.contentLanguage);
      const description = buildMetaDescription(topicSeed, title, config.contentLanguage, config.contentType);
      const outlineHeadings = buildCheapOutlineHeadings(title, config.contentType, config.contentLanguage);

      const base: Omit<SeoPreflightCandidateResult, "approved" | "rejectReason"> = {
        topic: topicSeed,
        title,
        slug,
        description,
        outlineHeadings,
        estimatedCost: perUnit,
        market: config.market,
        locale: config.locale,
        contentLanguage: config.contentLanguage
      };

      const eligSeed = evaluateSeoPreflightTopicSeed(topicSeed, config.contentLanguage, config.contentType);
      if (!eligSeed.ok) {
        const row: SeoPreflightCandidateResult = { ...base, approved: false, rejectReason: eligSeed.rejectReason };
        rejected.push(row);
        if (eligSeed.rejectReason) bump(rejectReasonCounts, eligSeed.rejectReason);
        continue topicLoop;
      }

      const eligTitle = evaluateTopicEligibility(title, existingTitles, config.contentLanguage, config.contentType);
      if (!eligTitle.ok) {
        const row: SeoPreflightCandidateResult = { ...base, approved: false, rejectReason: eligTitle.rejectReason };
        rejected.push(row);
        if (eligTitle.rejectReason) bump(rejectReasonCounts, eligTitle.rejectReason);
        continue topicLoop;
      }

      const issue = validateSeoStructure({ title, slug, description, outlineHeadings });
      if (issue) {
        const row = candidateFromStructureReject(base, issue);
        rejected.push(row);
        bump(rejectReasonCounts, row.rejectReason ?? "seo_structure");
        continue topicLoop;
      }

      const tfp = structuralTitleFingerprint(title, topicSeed);
      if (approvedTitleStructures.has(tfp)) {
        if (attempt === TITLE_PATTERN_RETRY_MAX) {
          const row: SeoPreflightCandidateResult = {
            ...base,
            approved: false,
            rejectReason: "preflight:title_pattern_duplicate_in_job_after_retries"
          };
          rejected.push(row);
          bump(rejectReasonCounts, "preflight:title_pattern_duplicate_in_job_after_retries");
        }
        continue;
      }

      if (runningBudget + perUnit > maxCost) {
        const row: SeoPreflightCandidateResult = { ...base, approved: false, rejectReason: "budget_cap" };
        rejected.push(row);
        bump(rejectReasonCounts, "budget_cap");
        continue topicLoop;
      }

      approvedTitleStructures.add(tfp);
      runningBudget += perUnit;
      estimatedTotalCost += perUnit;
      const row: SeoPreflightCandidateResult = { ...base, approved: true, rejectReason: null };
      approved.push(row);
      continue topicLoop;
    }
  }

  const ranAt = new Date().toISOString();
  const result: SeoPreflightJobResult = {
    targetCount: target,
    candidatesSeen,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    rejectReasonCounts,
    estimatedTotalCost,
    approved,
    rejected,
    ranAt
  };

  if (options?.persistLog !== false) {
    await writePreflightJobLog(result, options?.repoRoot);
  }

  return result;
}
