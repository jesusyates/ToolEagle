#!/usr/bin/env npx tsx
/**
 * V165 — CLI: npm run build-retrieval-dataset
 * Reads generated/agent_high_quality_assets.json → generated/workflow-assets-retrieval.json
 */

import { buildAndWriteRetrievalDataset } from "../src/lib/seo/retrieval-dataset-build";

const cwd = process.cwd();
const { itemCount, builtAt } = buildAndWriteRetrievalDataset(cwd);
console.log(`[build-retrieval-dataset] wrote ${itemCount} rows, builtAt=${builtAt}`);
