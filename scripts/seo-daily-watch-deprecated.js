#!/usr/bin/env node
/**
 * V170 — `npm run seo:daily:watch` removed from production path (no dual long-running triggers).
 */
console.error(
  "[V170] npm run seo:daily:watch is deprecated.\n" +
    "  Schedule production with: npm run daily-engine (e.g. cron / Task Scheduler).\n" +
    "  Legacy orchestrator watch loop: npm run seo:orchestrator:watch"
);
process.exit(1);
