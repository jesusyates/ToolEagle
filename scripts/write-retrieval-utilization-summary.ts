#!/usr/bin/env npx tsx
/**
 * V166 — Refresh generated/seo-retrieval-utilization.json from seo-retrieval-events.jsonl.
 */

import { writeSeoRetrievalUtilizationSummary } from "../src/lib/seo/retrieval-utilization-summary";

const cwd = process.cwd();
const out = writeSeoRetrievalUtilizationSummary(cwd);
console.log(
  `[write-retrieval-utilization-summary] hits=${out.retrieval_hits} fallbacks=${out.retrieval_fallbacks} window_share=${out.retrieval_share}`
);
