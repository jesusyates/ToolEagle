# V95 — Value Reconstruction

## Goal

Shift ToolEagle from single-line outputs to **result-driven, publish-ready post packages** with clear Free vs **Pro quality** (not only quantity).

## Paused in V95 (per spec)

- No new mass programmatic SEO / page inflation.
- No new auth, billing backend, payment providers, or broad tool-category explosion.

## Output schema (`CreatorPostPackage`)

| Field | Role |
|--------|------|
| `hook` | Scroll-stopping opener |
| `script_talking_points` | Short script / bullets |
| `caption` | Main caption body |
| `cta_line` | Comment / follow / link CTA |
| `hashtags` | Tag line |
| `why_it_works` | Strategy (shorter on Free) |
| `posting_tips` | Best-use / timing tips |
| `best_for` | Scenario hint |

## API

- **`POST /api/generate-package`** — JSON body: `{ userInput, toolKind: "tiktok_caption" \| "hook_focus" \| "ai_caption", locale? }`
- Response: `{ packages: CreatorPostPackage[], tierApplied, resultQuality }`
- **Free** (anonymous or `plan !== pro`): 2 compact packages (prompt depth `compact`).
- **Pro**: 4 full packages (prompt depth `full`).
- Shares usage limits with `/api/generate` via `src/lib/api/generation-usage.ts`.

## Core pages upgraded

1. `/tools/tiktok-caption-generator` — `PostPackageToolClient` + `tiktok_caption`
2. `/tools/hook-generator` — `hook_focus`
3. `/ai-caption-generator` — `ai_caption` (also in `tools.ts` + `toolSeo`)

## New pages

- **`/tiktok-growth-kit`** — Workflow / problem-solving page (not a flat directory).

## Modules

- **Examples:** `src/data/core-structured-examples.ts` + `StructuredExamplesLibrary` (12+ per category).
- **Value proof:** `ValueProofBlock` — `home` | `caption` | `hook` | `ai_caption` | `growth_kit`.
- **Results UI:** `PostPackageResults` — section cards, copy per block, copy all, regenerate, save local template (`localTemplates.ts`).

## Files reference

- Types / parse: `src/lib/ai/postPackage.ts`
- Prompts: `src/lib/ai/postPackagePrompts.ts`
- Client API: `src/lib/ai/generatePostPackage.ts`
- Shared tool UI: `src/components/tools/PostPackageToolClient.tsx`
