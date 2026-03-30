#!/usr/bin/env node
/**
 * V167 — EN blog internal linking backfill (wraps backfill-en-blog-linking).
 */
const { execSync } = require("child_process");
const path = require("path");

const root = process.cwd();
const extra = process.argv.slice(2).join(" ");
execSync(`node ${path.join(root, "scripts", "backfill-en-blog-linking.js")} ${extra}`.trim(), {
  cwd: root,
  stdio: "inherit"
});
