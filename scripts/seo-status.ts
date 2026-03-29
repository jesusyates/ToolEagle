#!/usr/bin/env npx tsx
/**
 * V164 — CLI: npm run seo:status
 */

import { runSeoStatus } from "../src/lib/seo/seo-status-core";

const cwd = process.cwd();
const { lines, exitCode } = runSeoStatus(cwd);
for (const line of lines) console.log(line);
process.exit(exitCode);
