#!/usr/bin/env npx tsx
/**
 * V171.2 — Inventory of standard CTA components vs legacy patterns.
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "generated", "cta-standardization-report.json");

const STANDARD = {
  toolZones: ["hero", "post_generate", "workflow"],
  components: [
    "src/components/cta/StandardBlogMidWorkflowCta.tsx",
    "src/components/cta/StandardBlogEndToolsCta.tsx",
    "src/components/cta/StandardAnswerPrimaryToolCta.tsx",
    "src/components/cta/StandardToolSurfaceCtas.tsx",
    "src/components/seo/SeoToolCTA.tsx",
    "src/components/blog/BlogToolCTA.tsx",
    "src/components/tools/ToolNextSteps.tsx"
  ],
  wiredRoutes: [
    { route: "/blog/[slug] (MDX)", midCta: "StandardBlogMidWorkflowCta", endCta: "StandardBlogEndToolsCta" },
    { route: "/answers/[slug]", topCta: "StandardAnswerPrimaryToolCta", bottomCta: "SeoToolCTA (existing)" }
  ]
};

function main() {
  const doc = {
    version: "171.2",
    generatedAt: new Date().toISOString(),
    standard: STANDARD,
    notes: [
      "Tool pages: use SeoToolCTA on SEO surfaces; GenericToolClient / PostPackageToolClient provide generate + workflow CTAs.",
      "Blog programmatic branch still uses ProgrammaticBlogPost — ensure it mirrors MDX CTA stack when updated."
    ]
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[build-cta-standardization-report]", OUT);
}

main();
