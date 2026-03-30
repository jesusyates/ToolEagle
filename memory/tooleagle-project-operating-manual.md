# ToolEagle Project Operating Manual

**Audience:** Cursor and other engineering executors in this repo.  
**Authority:** `docs/MEMORY.md` wins on any conflict. This file is **how to run** the project, not the normative rulebook.

---

## 1. Purpose of this manual

**Objective:** Give Cursor a single execution map from development through automatic daily production, publishing (EN + ZH), upload/sync, safety, growth, monetization, retrieval/flywheel, and **V167 unified daily engine**—**without guessing**.

**Trigger:** Any multi-step task touching production, SEO pipelines, artifacts, release, or deployment/build constraints.

**Do:** Follow sections 6–14 for workflows; use sections **2.5–2.7** for truth hierarchy, Vercel doctrine, and capability status; use section 16 before starting a new version.  
**Do not:** Paste or paraphrase the full text of `docs/MEMORY.md` here; point to it instead.

**Success criteria:** Executor can pick the right script, artifact, and reporting shape with low ambiguity.  
**Fallback:** If repo behavior diverges from this doc, **runtime truth** (section 2.5) overrides the manual—**update this file** after confirming intent with the owner.

---

## 2. Relationship to docs/MEMORY.md

| Source | Role |
|--------|------|
| `docs/MEMORY.md` | Permanent direction: product, compliance (e.g. CSE), mobile-first, markets, red lines. |
| This manual | Executable workflows, commands, artifact paths, stop/retry/fallback behavior. |

**Conflict rule:** Follow `docs/MEMORY.md` and flag the inconsistency (see section 15).

**Rule reference (do not duplicate):** Content Safety Engine, mobile-first, tool quality bar, global + local structure—see `docs/MEMORY.md` (e.g. sections 零, 二点五, 零点六).

---

## 2.5 Runtime truth and execution source of truth

| Layer | What it is | Executor rule |
|--------|------------|----------------|
| **`docs/MEMORY.md`** | **Permanent rule source** — product, compliance, markets, red lines. | On conflict with anything below, **MEMORY wins**. Do not “fix” behavior by ignoring MEMORY. |
| **This operating manual** | **Execution guide** — how to run pipelines, which scripts, what to report on upload. | Follow when it matches runtime; **if code/artifacts disagree**, treat manual as stale until updated. |
| **`generated/*` JSON/JSONL + current code** | **Runtime truth** — what actually ran, thresholds, counts, last writes. | Ground troubleshooting and “what happened” here; cite paths in reports. |

**If runtime truth diverges from this manual** (script renamed, new artifact, noop upgraded to active): **update `memory/tooleagle-project-operating-manual.md`** (and `memory/README.md` index line if the one-liner changes). Do not leave the manual asserting commands that no longer exist.

---

## 2.6 Deployment / build doctrine

**Platform (e.g. Vercel):** **`next build` is for compile and deploy only.**

- **No production content generation inside the build.** Blog/page generation, zh:auto, orchestrator ticks, and LLM calls belong in **scheduled jobs, CI steps, or host runners**—not in `next build`.
- **`generateStaticParams` caps are mandatory** for large route families (EN/ZH programmatic SEO, tools, etc.). Use shared helpers (e.g. `limitBuildStaticParams`, zh guide helpers) so build time stays bounded.
- **Build-time heavy logic** (scanning huge corpora, unbounded static paths) must be **migrated out** of the Next build path—**do not** brute-force longer build timeouts as the primary fix.

**Local / CI before push:** `npx tsc --noEmit` and `npm run build` (or project CI) validate deployability; they do not replace daily production pipelines (section 7).

---

## 2.7 Capability status marking

Use these labels when describing layers in issues, PRs, or reports:

| Label | Meaning |
|--------|---------|
| **active** | In production path; expected to run on schedule or user command; artifacts maintained. |
| **partially active** | Works for a subset of routes/markets, behind flags, or depends on env; document gaps. |
| **placeholder / noop** | Script or step exists but intentionally does not perform full work yet. |
| **not yet activated** | Designed but not wired into default daily flow. |

**Major layers (as of V169 alignment):**

| Layer | Status | Notes |
|--------|--------|------|
| V153 background SEO engine | **active** | Batched EN/ZH ticks; cost/router hooks. |
| V154 daily orchestrator | **active** | Health, safe mode, daily report, pipeline state. |
| V155 watchdog | **active** | Stale/missed detection; recovery caps. |
| V156–V163 intent / segment / escalation | **active** | Risk, segments, intent ladder; artifacts under `generated/asset-seo-*`. |
| **V163.1 real system activation** | **partially active** | First-touch / activation timestamps and flywheel-related JSON (e.g. `seo-flywheel-activation.json`); tied to HQ + retrieval usage signals—verify `seo:status` / flywheel lines for current flags. |
| **V164 build efficiency + flywheel ramp** | **active** | Static param caps; `seo-flywheel-ramp.json`; `npm run seo:status` flywheel block. |
| **V165 retrieval dataset** | **active** | `npm run build-retrieval-dataset`; `workflow-assets-retrieval.json` from HQ; gating in retrieval path. |
| **V166 / V166.1 retrieval utilization + activation** | **active** | `seo-retrieval-events.jsonl`, `seo-retrieval-utilization.json`, `seo-retrieval-activation.json`; expanded matching + activation pass in `scripts/lib/seo-retrieval-v153.js`. |
| **V167 daily engine** | **active** | `npm run daily-engine` — allocation → EN/ZH gen → linking → indexing → retrieval summary → growth → `logs/daily-report.json`. |
| **V168 retrieval optimizer** | **active** | `generated/retrieval-optimization-plan.json`; `npm run retrieval:optimize` (`--apply` runs dataset build when needed); env hints `RETRIEVAL_SCORE_THRESHOLD_MULT`, `RETRIEVAL_BIAS_EXTRA`; surfaced in `seo:status` recommendations. |
| **V169 system map** | **active** | `generated/system-map.json`; refreshed by `seo:status` and daily-engine (`npm run write-system-map`). |
| **V170 production entry** | **active** | **`npm run daily-engine`** is the **only** scheduled production execution entry; `npm run seo:daily` proxies to it with a deprecation warning; V154 orchestrator = `npm run seo:orchestrator` (lanes / debugging). Canonical daily report: **`logs/daily-report.json`**. |
| **V171 quality + conversion convergence** | **partially active** | Rule-driven thin-page signals, sitemap/noindex for worst `/ideas/*` + `/answers/*`, **`logs/content-quality-decisions.jsonl`**, **`generated/content-quality-status.json`**, conversion-weighted tool links (**`generated/internal-link-priority-report.json`**), static CTA audit (**`generated/conversion-entry-audit.json`**). Thresholds: **`src/config/content-quality-v171.ts`**. Full UI/CTA standardization and all programmatic routes in scope are **ongoing** — see **`generated/system-map.json`** → `v171_convergence`. |
| **V171.1 UX + conversion fix** | **partially active → EN cards active** | **`generated/zh-content-cleanup.json`**（启发式英文污染扫描 + **`sitemap-zh` 过滤**）· **`EnglishToolEntryCard`** 统一 EN 工具入口（Platform hub / `tools/category/*` / `ai-tools-directory`）· **`generated/tool-card-standardization-report.json`** · Usage 行无数据时为 **「—」**（可选 **`generated/tool-usage-display.json`**）· EN 工具复制成功后 **发布平台弹窗** + 埋点 `copy_click` / `copy_modal_shown` / `publish_redirect_*`。ZH 结果区文案走 **`messages/*` `common.resultAttribution` 等**。详见 **`generated/system-map.json`** → `v171_1_ux`。 |
| **`scripts/zh-internal-linking.js`** | **placeholder / noop** | **Not** a full production ZH cross-link backfill; exits 0. EN internal linking uses `scripts/en-internal-linking.js` → `backfill-en-blog-linking.js`. Treat ZH batch linking as **not yet activated** until replaced with a real implementation. |

---

## 3. ToolEagle project definition

**What ToolEagle is**

- A **large-scale creator workflow system** (not “a few AI toys”).
- An **SEO + AI-search growth engine** with structured pages and citation-oriented surfaces where applicable.
- A **data flywheel**: retrieval, reuse, and incremental improvement of assets.
- A **monetization system** that converts traffic → tool use → repeat use → paid conversion, with bounded UX cost.

**What ToolEagle is NOT**

- A random collection of low-differentiation generators.
- A UI-only or feature-churn project without traffic/revenue logic.
- A thin-content or duplicate-expansion farm.
- A site that treats “upload” as the primary production engine.

**Mission (global):** Grow traffic, scale **quality** content, deepen workflows, improve reusable data assets, increase revenue—**in that priority spirit** (aligned with section 5).

---

## 4. Roles and authority

| Role | Responsibility |
|------|----------------|
| Product / architecture owner (e.g. ChatGPT in your process) | Goals, priorities, version scope, tradeoffs that touch MEMORY-level direction. |
| **Cursor (executor)** | Implement scoped changes, run validations, operate pipelines per this manual, report briefly. |
| **User** | Credentials, hosting, manual **upload** (git push/deploy), external accounts, operational approval when required. |

**Boundaries for Cursor**

- **Do** implement within the stated version scope and preserve safety/reporting hooks.
- **Do not** unilaterally change global priority order, monetization philosophy, or MEMORY-level compliance shortcuts.
- **Stop** and ask for human/owner confirmation per section 15.

---

## 5. Global priorities and forbidden directions

### 5.1 Priority order (execution weighting)

When tradeoffs are required **and MEMORY does not forbid the choice**:

1. **SEO / AI-search traffic systems**
2. **Content production systems** (quality-gated)
3. **Creator workflow depth** (tools + journeys)
4. **Data flywheel** (retrieval, assets, telemetry)
5. **Monetization** (after value delivery; bounded triggers)

**Product stance:** English main site leads; **ZH also runs on a daily rhythm** (separate lane state).

### 5.2 Quality stack (when in conflict)

Apply this order:

**Quality > uniqueness > usefulness > SEO structure > raw volume**

### 5.3 Forbidden directions (executor checklist)

**Do not:**

- Ship thin, near-duplicate, or saturated-topic spam.
- Add random tools with no traffic/flywheel/monetization role.
- Prefer full expensive generation when retrieval + rewrite is enough.
- Treat upload as substitute for automatic production.
- Silence failures in production pipelines (always surface status in artifacts/reports).
- Run **unbounded** static generation in **Vercel build** (see section 2.6).

**Do:**

- Prefer **retrieval + rewrite**, then **low-cost models**, then **expensive fallback** only when needed (see section 10).
- Expand topics from **high-quality / high-signal** clusters; deprioritize saturated clusters (see section 13).
- Use **`npm run daily-engine`** for **sequenced** production (V170); use **`npm run seo:orchestrator`** only for V154 lane/debug paths; keep build and generation concerns separate.

**Rule reference:** Tool quality bar, CSE, “no thin content” alignment—`docs/MEMORY.md`.

---

## 6. Version-based development workflow

**Objective:** Every material change is version-scoped, testable, and reportable.

**Trigger:** New feature batch, V-series SEO/engine upgrade, or owner-defined “version”.

### 6.1 Steps

1. **Clarify goal** — One or two sentences; bounded scope.
2. **Read** `docs/MEMORY.md` (per AGENTS / cursor policy: first substantive work in a thread, or when stale).
3. **Read** this manual + **only** relevant source files (grep/search first).
4. **Implement** — Minimal diff; backward compatible unless version explicitly breaks behavior.
5. **Validate** — `npx tsc --noEmit`, targeted `npx jest …`, lint if touching edited areas; **`npm run build`** when changing routes/static params (deploy doctrine, section 2.6).
6. **Artifacts/contracts** — If the version defines JSON outputs or agent contracts, update generators and `generated/*` per project practice.
7. **Report** — Use section 14 template.

### 6.2 Success criteria

- Tests/typecheck pass or failures are explicitly listed as blockers.
- No silent removal of production telemetry or safety hooks without owner approval.

### 6.3 Fallback / failure handling

- If scope explodes: split into sub-versions; do not merge unrelated refactors.
- If MEMORY conflicts: stop; section 15.

---

## 7. Daily automatic production workflow

**Objective:** EN and ZH production runs **automatically** (scheduler/cron/host), not only when someone types a command. User may still run commands manually for recovery or debugging.

**Trigger:** Cron / Task Scheduler → **`npm run daily-engine`** (V170). Afternoon stack and ad-hoc runs may chain **sub-steps** (e.g. V122 EN daily, watchdog). **`npm run seo:daily`** forwards to daily-engine with a deprecation warning (do not add a second cron that still calls the raw orchestrator).

### Production Entry (V170)

- **`daily-engine`** is the **only** production execution entry for scheduled full cycles.
- **`npm run seo:daily`** is **deprecated**; it **proxies** to daily-engine (same flags: `--dry-run`, `--skip-quality`, `--max-retry=N`, `--no-stop-on-error`).
- **All other npm scripts** in the SEO stack are **sub-steps**, **lane-specific** tools, or **debugging** (e.g. `seo:orchestrator`, `seo:background`, `seo:watchdog`, `seo:status`).
- **Canonical daily report** for production health when daily-engine runs: **`logs/daily-report.json`**. `generated/seo-daily-report.json` remains the orchestrator artifact when **`seo:orchestrator`** is run **alone**.

### V171 — Quality convergence + conversion tightening

**Goal:** Tighten live-site quality and the path **traffic → workflow → payment** without shipping unrelated product modules.

**Commands**

```bash
npm run v171:artifacts    # quality JSON + link-priority + conversion audit (also runs at end of daily-engine)
npm run v171:quality      # content-quality-status.json + logs/content-quality-decisions.jsonl only
```

**Thresholds (code)** — `src/config/content-quality-v171.ts` + evaluators in `src/lib/seo/content-quality-evaluate.ts` (ideas topics + answer pages).

**Runtime wiring**

- Sitemap: `src/lib/sitemap-data.ts` drops URLs listed in `generated/content-quality-status.json` → `excludedSitemapPaths`.
- Metadata: `/ideas/...` and `/answers/...` may set **`robots: noindex`** when listed in `noindexPaths` (same JSON).
- EN blog internal linking: `scripts/lib/en-internal-linking.js` reads **`generated/content-quality-status.json`** and **hard-excludes** paths in **`internalLinkExcludePaths`** (and falls back to **`noindexPaths`** when needed) from automated blog→blog backlink targets — **V171.2+** no longer uses `linkPoolSoftPaths` (field is empty / deprecated in new builds).
- Tool pages: **`WorkflowProminenceCard`** + conversion-ranked **`RelatedToolsCard`**; extended **`en-tool-journey.ts`** next steps for more generators.

**Runtime truth** — `generated/system-map.json` → **`v171_convergence`**: `content_quality_gate` / `thin_page_suppression` = **partially_active**; `conversion_weighted_linking` = **active** (until all routes and CTAs are fully standardized).

### V171.1 — UX + conversion fix（ZH 洁净 / EN 卡片 / 复制后跳转）

```bash
npm run v171.1:artifacts   # zh-content-cleanup.json + tool-card-standardization-report（daily-engine 尾部也会跑）
```

- **ZH**：`scripts/build-zh-content-cleanup.ts` 写入 **`generated/zh-content-cleanup.json`**；`api/sitemap-zh` 排除其中的 `excludedSitemapPaths`。共享结果列表中的硬编码英文已迁到 **`messages/zh.json`** / **`en.json`**（如 `resultAttribution`、`generating`、`loginPromptSave`）。
- **EN 工具入口**：**`EnglishToolEntryCard`** 统一 Platform hub、`/tools/category/*`、`/ai-tools-directory`（icon / title / description 三行 / **Usage**（无数据为 **—**）/ **Open tool**）。
- **复制**：EN 工具在剪贴板写入成功后弹出 **`CopyPublishModal`**；埋点 **`copy_click`**、**`copy_modal_shown`**、**`publish_redirect_click`** / **`publish_redirect_cancel`**；保留原有 **`tool_copy`**。

**Runtime truth** — `generated/system-map.json` → **`v171_1_ux`**。

### 7.1 Production stack (operating map)

| Layer | Role | Primary entry points |
|-----|------|----------------------|
| **V153** Background production | Batched EN/ZH SEO content generation, incremental state, cost/router hooks | `npx tsx scripts/run-background-seo-engine.ts --once` · `npm run seo:background` · core: `scripts/lib/seo-background-engine-core.ts` |
| **V154** Daily orchestrator | Health, retries, safe mode, stall recovery; **legacy report** `generated/seo-daily-report.json` when run standalone | **`npm run seo:orchestrator`** · **`npm run seo:orchestrator:watch`** · **`npm run seo:orchestrator:check`** (not the primary cron entry under V170) |
| **V155** Reliability watchdog | Stale/missed detection, reliability summary, capped recovery | `npx tsx scripts/run-seo-watchdog.ts` · `npm run seo:watchdog` |
| **V156** Search risk control | Risk signals, concentration, pattern risk | `src/lib/seo/seo-risk-summary.ts` (invoked from orchestrator path) · read `generated/seo-risk-summary.json` |
| **V157** Dry-run / sandbox | No live production writes; sandbox under `generated/sandbox/` | `npm run seo:daily:dry` (= daily-engine `--dry-run`) · `npm run seo:background:dry` · `npm run seo:watchdog:dry` · `src/lib/seo/seo-sandbox.ts` |
| **V158** Revenue scaling | Revenue artifacts, CTA/monetization intelligence inputs | `npm run seo:revenue-summary` · `scripts/build-asset-seo-revenue-summary.ts` · `generated/asset-seo-revenue-summary.json` |
| **V159/V160** AI citation | Citation-oriented metrics + dominance artifacts | `npm run seo:ai-citation-dominance` · `generated/asset-seo-ai-citation-dominance.json` |
| **V161** Traffic allocation | Batch scale / lane pressure recommendations | `generated/asset-seo-traffic-allocation.json` |
| **V162** Segment strategy | Segments, runtime bias for CTA/conversion/monetization | `src/lib/seo/asset-seo-segment-strategy*.ts` · `generated/asset-seo-segment-strategy.json` |
| **V163** Intent escalation | Ladder on top of V162; bounded nudges; artifact | `src/lib/seo/asset-seo-intent-escalation*.ts` · `generated/asset-seo-intent-escalation.json` |
| **V163.1** Real system activation | Activation / first-touch style signals for flywheel readiness (HQ + usage) | `generated/seo-flywheel-activation.json` (and related writers in `seo-status-core`); confirm with **`npm run seo:status`**. |
| **V164** Build efficiency + flywheel ramp | Static param caps (build); flywheel summary for ops | `src/lib/build-static-params-limit.ts`, `src/lib/zh-guide-static-params.ts`; **`generated/seo-flywheel-ramp.json`**; **`npm run seo:status`**. |
| **V165** Retrieval dataset | HQ → deduped workflow retrieval JSON; gating | **`npm run build-retrieval-dataset`** · **`generated/workflow-assets-retrieval.json`**. |
| **V166 / V166.1** Retrieval utilization + activation | Telemetry JSONL, window share, activation readiness, bounded matching + activation pass | **`generated/seo-retrieval-events.jsonl`**, **`seo-retrieval-utilization.json`**, **`seo-retrieval-activation.json`**; scoring in **`scripts/lib/seo-retrieval-v153.js`**. |
| **V167** Daily engine | Single sequential hub: **growth → V172/V173/V174 → allocation → gen → …** (see §7.2); post-pass retrieval + system-map | **`npm run daily-engine`** · `scripts/daily-engine.js` · **`logs/daily-report.json`**, **`logs/daily-engine-log.jsonl`**. |
| **V168** Retrieval optimizer | Plan + env suggestions; optional dataset rebuild | **`npm run retrieval:optimize`** (`--apply`) · **`generated/retrieval-optimization-plan.json`**; recommendations line on **`seo:status`**. |
| **V169** System map | Operator-facing module map | **`generated/system-map.json`** · **`npm run write-system-map`**. |

### 7.2 V167 daily engine (command sequence)

When using **`npm run daily-engine`** (see `scripts/daily-engine.js` for flags):

1. **Growth (GSC aggregates)** — `npm run search:growth` — **runs before allocation** so **`generated/growth-priority.json`** is fresh for the same cycle.
2. **V172 / V173 / V174** — `build-high-quality-signals`, `build-content-deduplication`, `build-v173-production-ramp`, **`build-v174-controlled-scale`** (tiered ramp + metrics; writes **`generated/v174-scale-plan.json`** among others).
3. **Content allocation** — `npm run build-content-allocation-plan` (uses growth + **V174 `topicFrequencyMultipliers`** via `scripts/lib/content-allocation.js`).
4. **Retrieval optimizer (apply)** — `npx tsx scripts/run-retrieval-optimizer.ts --apply` (dataset build if under threshold)
5. **Generate** — `npm run seo:generate:en`, `npm run seo:generate:zh` (aliases for `en-auto` / `zh:auto`)
6. **Internal links** — `node scripts/en-internal-linking.js` (EN backfill); `node scripts/zh-internal-linking.js` (**noop** today—section 2.7)
7. **Indexing** — `npm run en:indexing:queue` (retries per `--max-retry`); `npm run zh:indexing:queue` (same queue processor)
8. **Retrieval stats** — `npm run write-retrieval-utilization-summary`
9. **Post-pass** — `run-retrieval-optimizer.ts` (refresh plan, no `--apply`), `write-system-map.ts`, **`logs/daily-report.json`**

**Preflight:** Default runs **`seo-quality-scan.js --fail-on-violations`** (skip with `--skip-quality`). High retrieval fallback ratio may set **`DAILY_ENGINE_BATCH_SCALE`** for smaller batches.

### 7.3 Completion rule (per owner spec)

A daily publishing cycle for a **lane** (EN or ZH) is **complete** when:

- **safe limit reached**, OR  
- **candidate pool exhausted**

EN and ZH must be **evaluated separately** (orchestrator: `generated/seo-daily-report.json` · daily-engine: `logs/daily-report.json` `steps_ok` / `generated_pages_detail` and pipeline state).

### 7.4 Key artifacts & reports

**Do** ensure these exist or are explicitly missing-with-reason after a full run:

- **`logs/daily-report.json`** (V170 primary when using daily-engine)
- `generated/seo-daily-report.json` (when **seo:orchestrator** ran standalone)
- `generated/seo-pipeline-state.json` (and sandbox counterparts when dry-run)
- `generated/seo-reliability-summary.json`, `generated/seo-watchdog-state.json` as applicable
- `generated/seo-risk-summary.json`, `generated/seo-risk-context.json`
- **V164–V169:** `seo-flywheel-ramp.json`, `workflow-assets-retrieval.json`, `seo-retrieval-utilization.json`, `seo-retrieval-activation.json`, `retrieval-optimization-plan.json`, `system-map.json` as applicable
- Queue / revenue / citation / traffic / segment / intent files as required by the active version

### 7.5 Failure handling

**Do:** Retry with smaller batches, enter **safe mode** or **degraded** reporting when logic dictates; log to `logs/*.jsonl` where implemented.  
**Do not:** Fail silently with no updated report/state.

**Commands (examples)**

```bash
# Production cron / scheduler (V170) — single entry
npm run daily-engine

# Deprecated alias → same as daily-engine (prints warning)
npm run seo:daily

# Dry-run (daily-engine; sandbox where children respect SEO_DRY_RUN)
npm run seo:daily:dry

# Background engine only (debug)
npm run seo:background

# Watchdog
npm run seo:watchdog

# Ops snapshot (flywheel + retrieval + recommendations + system map)
npm run seo:status
```

**Windows afternoon bundle (if used on host):** `npm run seo:afternoon-stack` → runs `scripts/run-afternoon-seo-automation.ps1`.

### 7.6 Success criteria

- **`logs/daily-report.json`** (daily-engine) shows fresh `generatedAt`, `steps_ok`, and execution metadata; or **`generated/seo-daily-report.json`** after a standalone orchestrator run—with plausible lane / safety fields where applicable.
- No unexplained gap: if production skipped, report or logs say why.

### 7.7 Fallback

- Use `--check-only` / dry-run modes to diagnose without writing live artifacts.
- Watchdog recovery: see `SEO_WATCHDOG_RECOVERY` in `run-seo-watchdog.ts` header comments.

---

## 8. Upload workflow

**Objective:** Sync **already produced** code and content to remote; never confuse upload with the production engine.

**Trigger:** User explicitly requests **upload** (e.g. git push, deploy).

**Default (Cursor — optimal):** When the user says **上传**, **upload**, **push** (to remote), or **sync to GitHub**, treat this section as **mandatory** before any `git commit` / `git push`: Read **§8.2–8.3** (this file once per upload request is enough). **First** read **`logs/daily-report.json`** if present, else `generated/seo-daily-report.json`, then proceed. Do not claim “full success” without the production snapshot in your report (§14).

### 8.1 Rules

- **Production:** automatic (section 7).  
- **Upload:** manual user action; Cursor may run `git` commands **only when user asks** and environment allows.
- **Deploy:** Vercel (or host) **build** validates compile only (section 2.6)—not a substitute for section 7.

### 8.2 Steps (when user says upload)

1. **Read production state** — At minimum **`logs/daily-report.json`** or `generated/seo-daily-report.json` (and note EN/ZH completion or partial/degraded).
2. **Validate** — `npx tsc --noEmit`; quick sanity on changed areas; **`npm run build`** if static routes or caps changed.
3. **Scope** — `git status`; avoid committing secrets or unintended local-only files.
4. **Commit/push** — Clear message; user-approved scope.
5. **Report** — Section 14 template **must include production snapshot** (section 8.3).

### 8.3 Upload “success” definition (mandatory reporting)

Full success is **not** “push only.” Cursor must report:

- **EN status** / **ZH status** (from daily report or explicit “artifact missing / stale”)
- **Complete vs partial vs degraded** for the day’s production intent
- **stop_reason** (if available)
- **safety_status** (if available)
- **Capacity / batch** hints if present in report or pipeline state

If production did not finish, label upload as **partial** or **rules/code-only**—do not imply full daily production success.

### 8.4 Fallback

- If report is missing or stale: say so; recommend `npm run seo:orchestrator:check` (or legacy `seo:daily:check`) or `npm run daily-engine -- --dry-run` before claiming health.

---

## 9. SEO / AI-search publishing workflow

**Objective:** Publish structured, useful, non-duplicate pages that support SEO and AI-visible answers.

**Trigger:** Background engine + blog/MDX pipelines; orchestrator-driven batches; **V167 daily-engine** steps 2–4.

### 9.1 Execution principles

- Dynamic volume capped by **safety** and **quality**, not a blind fixed count.
- Prefer **citation-friendly** structure where product allows (clear headings, lists, FAQs—without stuffing).
- **Build:** static paths capped (section 2.6); do not move LLM generation into `next build`.

### 9.2 Supporting scripts (examples)

- EN blog generation: `npm run blog:generate` (and variants in `package.json`)
- ZH automation: `npm run zh:auto`, `npm run seo:generate:zh`, keyword flows as applicable
- EN internal linking batch: `node scripts/en-internal-linking.js`
- Publish queue / SEO assembly: `npm run seo:publish-queue`, `scripts/build-asset-seo-publish-queue.ts`
- Indexing queue processing: `npm run en:indexing:queue` / `zh:indexing:queue` when appropriate

### 9.3 Success criteria

- New/changed content passes project quality gates where enforced (e.g. fingerprint/audit scripts if part of pipeline).
- Risk summary does not show unmitigated concentration spikes without a documented response.

### 9.4 Fallback

- Reduce batch; switch lane priority; increase retrieval share; run sandbox dry-run; use **V168** plan env suggestions on next run.

**Rule reference:** SEO and content philosophy—`docs/MEMORY.md` (performance, compliance, mobile).

---

## 10. Data flywheel and retrieval workflow

**Objective:** Reuse high-quality assets; minimize cost and variance; **measure and improve** retrieval usage (V166–V168).

**Trigger:** Any generation path that can call retrieval/router (V153 core and related libs); **daily-engine** step 6; **`seo:status`**.

### 10.1 Preferred order

1. **Retrieval + rewrite** (prefer existing workflow assets / high-quality snippets)
2. **Low-cost model** generation
3. **Expensive model** only as fallback when required

**Pointers:** `generated/workflow-assets-retrieval.json` (V165), `generated/agent_high_quality_assets.json`, `scripts/lib/seo-model-router-v153.js`, **`scripts/lib/seo-retrieval-v153.js`** (V166.1 matching + activation pass), **`scripts/lib/retrieval-threshold-bias.cjs`** (V168 bias env).

### 10.2 Telemetry and plans

- **Window / prod share:** `generated/seo-retrieval-utilization.json`, `generated/seo-retrieval-stats.json`, `seo-retrieval-events.jsonl`
- **Activation readiness:** `generated/seo-retrieval-activation.json`
- **Optimizer:** `generated/retrieval-optimization-plan.json` — follow **`recommendations`** and **`env_suggestions`** on next run (merged by daily-engine preflight where applicable)

### 10.3 Success criteria

- `retrieval_share` / cost metrics trend sane in `seo-daily-report.json` when those fields are populated.
- No systematic bypass of retrieval when the pipeline is configured to use it.

### 10.4 Fallback

- If retrieval corpus thin: run **`npm run build-retrieval-dataset`**; document gap; avoid fake citations; narrow topic scope.

---

## 11. Conversion and monetization workflow

**Objective:** Traffic → tool entry → generation → repeat use → monetization, **without** blocking first value.

**Trigger:** Runtime tool flows (e.g. `PostPackageToolClient`), segment + intent escalation layers.

### 11.1 Rules

- **Value first**; bounded triggers; caps and safety in `deriveMonetizationTrigger` and related SEO libs must stay intact unless a version explicitly changes them with approval.
- **V162** segment strategy and **V163** intent escalation **refine** CTAs and timing; they **do not** override MEMORY or hard safety.

### 11.2 Artifacts

- `generated/asset-seo-segment-strategy.json`
- `generated/asset-seo-intent-escalation.json` (when publish queue / build steps emit it)
- `generated/asset-seo-revenue-summary.json`

### 11.3 Success criteria

- No regression to “paywall before first result” unless product owner explicitly changes MEMORY-level UX rules.

### 11.4 Fallback

- Prefer softer CTAs on mismatch or low confidence; log telemetry events where implemented.

---

## 12. Risk control, reliability, and sandbox workflow

**Objective:** Detect unsafe volume/concentration/template risk; keep production **observable** and **recoverable**.

**Trigger:** Every orchestrator cycle; watchdog schedule; manual investigation.

### 12.1 Risk signals

Read/consult:

- `generated/seo-risk-summary.json`, `generated/seo-risk-context.json`
- Orchestrator notes / logs under `logs/`

**Responses (conceptual):** reduce batch, diversify topics/slug patterns, prefer retrieval/rewrite, pause expansion—per code paths and owner rules.

### 12.2 Reliability

- `generated/seo-reliability-summary.json`, watchdog state, production history (`generated/seo-production-history.jsonl` when present).

### 12.3 Sandbox / dry-run

**Objective:** Validate pipeline without live writes.

**Do:** Use `npm run seo:daily:dry` (daily-engine dry-run), `seo:background:dry`, `seo:watchdog:dry`; confirm outputs under `generated/sandbox/` and sandbox logs where applicable.

**Do not:** Point dry-run at production indexes or live enqueue if code marks those as live-only.

### 12.4 Success criteria

- Degraded/safe modes still **write explanatory status** to reports/state.

### 12.5 Fallback

- If recovery loops too often: cap triggers (watchdog env limits); escalate to human.

---

## 13. Content governance workflow

**Objective:** Prevent duplication, saturation, and low-value expansion.

**Trigger:** Topic registry / allocation / quality fingerprints / publish queue builders; **daily-engine** step 1.

### 13.1 Rules

**Expand only when:**

- Quality threshold met
- Not duplicate/near-duplicate vs existing corpus
- Cluster not saturated (signals from planning artifacts / fingerprints / owner rules)

**Do:** Deprioritize saturated clusters; shift capacity to under-served, high-signal areas.  
**Do not:** Blind volume targets that violate quality stack (section 5.2).

### 13.2 Pointers

- `generated/topic-registry.json`, content allocation / distribution artifacts as applicable
- `generated/quality-gate/*-fingerprints.json` where used
- **`generated/content-allocation-plan.json`** (after `build-content-allocation-plan`)

### 13.3 Success criteria

- Fingerprints/gates show expected updates after batches; no mass template collisions without review.

### 13.4 Fallback

- Stop expansion for cluster; require human approval to override gates.

---

## 14. Cursor execution and reporting rules

### 14.1 Before work

1. Read `docs/MEMORY.md` (per session policy).  
2. Read **this manual** when touching production, SEO, monetization, governance, **retrieval**, **daily-engine**, or **deploy/build caps**.  
3. Grep/read **only** relevant modules.

### 14.2 During work

- Small diffs; preserve additive contracts when possible.
- Keep `generated/*` and contract JSON in sync when changing pipelines (run documented generators).

### 14.3 After work — **mandatory short report (scannable)**

Use this skeleton (no long essays unless user asks):

```
## Summary
- Status: done | partial | blocked
- Scope: <one line>

## Changes
- Files: <bullets or count>
- Outcome: <one line>

## Validation
- tsc / tests: pass | fail (which)
- build (if routes/static params): pass | skip | fail

## Production / upload (if relevant)
- EN: completed | partial | failed | unknown (+ source)
- ZH: completed | partial | failed | unknown (+ source)
- stop_reason / safety: <if known>
- Upload: code-only | full | partial

## Risks / follow-ups
- <bullets or "none">
```

**Do not** bury failures in prose.

---

## 15. Human-confirmation-only cases

**Stop and ask** before shipping if the change would:

- Contradict `docs/MEMORY.md`
- Change site-wide IA/navigation semantics
- Redefine upload vs production responsibilities
- Weaken content safety or quality gates
- Bypass reliability, risk reporting, or sandbox discipline
- Flip “English main first” or ZH daily rhythm without owner decision
- Remove or neutralize monetization safety caps without explicit approval
- **Remove or substantially raise `generateStaticParams` caps** without owner sign-off (deploy / cost risk)

---

## 16. Quick start checklist for Cursor before any new version

- [ ] Version goal and **bounded** scope written
- [ ] Likely files/artifacts identified
- [ ] Checked against `docs/MEMORY.md` (no conflict)
- [ ] Impact on **daily production**, **upload reporting**, **safety**, **EN/ZH lanes**, **retrieval/flywheel**, **Vercel build**
- [ ] Contract / `generated/*` updates planned if needed
- [ ] Tests / `tsc` / **build** plan if touching app routes
- [ ] Reporting template (section 14) ready

If any item is unclear, **clarify before coding**.

---

## Rules reference

- Normative rules: `docs/MEMORY.md`
- Cursor read policy: `.cursor/rules/00-memory-read-policy.mdc`, `AGENTS.md`
- Runbook authoring for new procedures: `memory/FOR-EXTERNAL-AI-CHATGPT.md`
- **Runtime map (regenerated):** `generated/system-map.json` (V169)

**Revision:** 2.0 — aligned with V163.1–V169 (daily engine, retrieval optimizer, system map, deploy doctrine, capability table). If commands or artifacts move, update this file per section 2.5.
