#!/usr/bin/env npx tsx
/**
 * V171 — Static scan of upgrade / CTA entry points → generated/conversion-entry-audit.json
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "generated", "conversion-entry-audit.json");
const APP = path.join(ROOT, "src", "app");

type Row = {
  file: string;
  pageTypeGuess: string;
  ctaSignals: Record<string, number>;
  upgradeDestinations: string[];
};

function walk(dir: string, acc: string[]) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "api" || name.name.startsWith("_")) continue;
      walk(p, acc);
    } else if (name.name === "page.tsx" || name.name === "pageClient.tsx") acc.push(p);
  }
}

function guessPageType(rel: string): string {
  if (rel.includes("pageClient")) return "tool_client";
  if (rel.includes(`${path.sep}tools${path.sep}`)) return "tool_page";
  if (rel.includes(`${path.sep}answers${path.sep}`)) return "answer_page";
  if (rel.includes(`${path.sep}blog${path.sep}`)) return "blog_page";
  if (rel.endsWith(`home${path.sep}page.tsx`) || rel.endsWith(`src${path.sep}app${path.sep}page.tsx`))
    return "homepage";
  if (rel.includes("pricing")) return "pricing";
  if (rel.includes(`${path.sep}zh${path.sep}`)) return "zh_page";
  if (rel.includes("launch") || rel.includes("growth") || rel.includes("creator")) return "workflow_landing";
  return "other";
}

function scanFile(abs: string): Row {
  const text = fs.readFileSync(abs, "utf8");
  const rel = path.relative(ROOT, abs).replace(/\\/g, "/");

  const count = (re: RegExp) => (text.match(re) || []).length;

  const ctaSignals: Record<string, number> = {
    SeoToolCTA: count(/SeoToolCTA/g),
    PricingLink: count(/href=\{?[`'"](\/pricing|\/zh\/pricing)/g) + count(/\/pricing"/g),
    UpgradeButton: count(/UpgradeButton/g),
    DonationBox: count(/DonationBox/g),
    subscription: count(/subscribe|Subscription|checkout/gi),
    signIn: count(/signIn|Sign in|get started/gi)
  };

  const upgradeDestinations = new Set<string>();
  const pr = text.matchAll(/href=\{?[`'"](\/(?:pricing|zh\/pricing|dashboard)[^`'"]*)/g);
  for (const m of pr) upgradeDestinations.add(m[1].split(/["']/)[0]);

  return {
    file: rel,
    pageTypeGuess: guessPageType(rel),
    ctaSignals,
    upgradeDestinations: [...upgradeDestinations]
  };
}

function main() {
  const files: string[] = [];
  walk(APP, files);

  const rows = files.map(scanFile);
  const summary = {
    filesScanned: rows.length,
    totalSeoToolCTA: rows.reduce((a, r) => a + r.ctaSignals.SeoToolCTA, 0),
    totalPricingHref: rows.reduce((a, r) => a + r.ctaSignals.PricingLink, 0)
  };

  const doc = {
    version: "171",
    generatedAt: new Date().toISOString(),
    summary,
    note:
      "Heuristic static scan (regex). Use for tightening redundant CTAs — not a runtime DOM audit.",
    pages: rows.filter((r) => Object.values(r.ctaSignals).some((n) => n > 0) || r.upgradeDestinations.length)
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[build-conversion-entry-audit]", OUT, summary);
}

main();
