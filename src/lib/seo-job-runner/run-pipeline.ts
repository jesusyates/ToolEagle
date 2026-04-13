import fs from "node:fs/promises";
import path from "node:path";
import { generateSeoDraftsFromPreflight } from "@/lib/seo-draft-generation";
import { runSeoPreflightJob, type SeoPreflightConfig } from "@/lib/seo-preflight";
import { readAppSeoSeedStore } from "@/lib/seo-seed-registry";
import { mapSeedsToScenarioTopics, writeScenarioTopicsJson } from "@/lib/seo-scenario-mapper";
import type { SeoAutomationJobResult, SeoAutomationJobStepLog } from "./types";

const JOB_LOG = path.join("generated", "seo-automation-last-run.json");

function push(steps: SeoAutomationJobStepLog[], name: string, ok: boolean, detail?: string) {
  steps.push({ name, ok, detail });
}

export type RunSeoAutomationPipelineInput = {
  repoRoot?: string;
  preflightConfig: SeoPreflightConfig;
  runDraftGeneration: boolean;
  /** When false, still maps seeds but skips preflight/drafts (smoke). */
  runPreflight: boolean;
};

export async function runSeoAutomationPipeline(input: RunSeoAutomationPipelineInput): Promise<SeoAutomationJobResult> {
  const root = input.repoRoot ?? process.cwd();
  const steps: SeoAutomationJobStepLog[] = [];
  const result: SeoAutomationJobResult = {
    startedAt: new Date().toISOString(),
    ok: true,
    steps
  };

  try {
    const store = await readAppSeoSeedStore(root);
    push(steps, "load_seeds", true, `${store.seeds.length} seed(s)`);
    if (store.seeds.length === 0) {
      push(steps, "abort", false, "no seeds in data/app-seo-seeds.json");
      result.ok = false;
      result.error = "no_seeds";
      result.finishedAt = new Date().toISOString();
      await writeJobLog(root, result);
      return result;
    }

    const mapped = mapSeedsToScenarioTopics(store.seeds, {
      defaultMarket: input.preflightConfig.market,
      defaultLocale: input.preflightConfig.locale,
      defaultContentLanguage: input.preflightConfig.contentLanguage
    });
    await writeScenarioTopicsJson(mapped.topics, root);
    result.scenarioTopicCount = mapped.topics.length;
    push(steps, "map_scenarios", true, `${mapped.topics.length} topic(s), dedup_stale_estimate=${mapped.deduped}`);

    if (!input.runPreflight) {
      result.finishedAt = new Date().toISOString();
      await writeJobLog(root, result);
      return result;
    }

    const topicStrings = mapped.topics.map((t) => t.topic);
    const preflight = await runSeoPreflightJob(input.preflightConfig, {
      repoRoot: root,
      candidateSeeds: topicStrings,
      seedsOnly: true,
      persistLog: true
    });
    result.preflight = preflight;
    push(
      steps,
      "preflight",
      true,
      `approved ${preflight.approvedCount}/${preflight.targetCount} (seen ${preflight.candidatesSeen})`
    );

    if (input.runDraftGeneration) {
      const approved = preflight.approved.filter((r) => r.approved);
      if (approved.length === 0) {
        push(steps, "drafts", false, "no approved candidates");
      } else {
        const draftResult = await generateSeoDraftsFromPreflight(approved, {
          repoRoot: root,
          persistLog: true,
          source: "automation_pipeline"
        });
        result.drafts = draftResult;
        push(steps, "drafts", true, `${draftResult.rows?.length ?? 0} row(s)`);
      }
    }
  } catch (e) {
    result.ok = false;
    result.error = e instanceof Error ? e.message : String(e);
    push(steps, "error", false, result.error);
  }

  result.finishedAt = new Date().toISOString();
  await writeJobLog(root, result);
  return result;
}

async function writeJobLog(root: string, doc: SeoAutomationJobResult) {
  const p = path.join(root, JOB_LOG);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(doc, null, 2), "utf8");
}
