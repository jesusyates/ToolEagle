#!/usr/bin/env node
/**
 * V167 — ZH internal linking: batch backfill not yet split from generators.
 * Placeholder hook for future zh cross-link pass; exits 0 so daily-engine can proceed.
 */
console.log(
  "[zh-internal-linking] noop: ZH internal links are applied during zh content generation / future backfill."
);
process.exit(0);
