#!/usr/bin/env node
/**
 * V177 + V178 — Auto execution: EN blog MDX (structure) + full-surface manifest for tools/answers.
 * CLI: --dry-run  --limit=N  (default limit: 80 winners)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const matter = require("gray-matter");

const ROOT = process.cwd();
const enLinking = require(path.join(ROOT, "scripts", "lib", "en-internal-linking.js"));
const mdxSafety = require(path.join(ROOT, "scripts", "lib", "mdx-safety.js"));

const PATHS = {
  winners: path.join(ROOT, "generated", "v176-top-winners.json"),
  lowCtr: path.join(ROOT, "generated", "v176-low-ctr-fix.json"),
  amplify: path.join(ROOT, "generated", "v176-conversion-path-amplify.json"),
  abTest: path.join(ROOT, "generated", "v176-ab-test.json"),
  searchPerf: path.join(ROOT, "generated", "search-performance.json"),
  blogDir: path.join(ROOT, "content", "blog"),
  logJsonl: path.join(ROOT, "generated", "v177-execution-log.jsonl"),
  outCtr: path.join(ROOT, "generated", "v177-ctr-updates.json"),
  outAb: path.join(ROOT, "generated", "v177-ab-selected.json"),
  outV178: path.join(ROOT, "generated", "v178-full-surface-manifest.json")
};

/** V178.1 — static EN tool routes; manifest forces conversion path + logged as core_tool. */
const V178_CORE_TOOL_SLUGS = [
  "tiktok-caption-generator",
  "hashtag-generator",
  "hook-generator",
  "title-generator"
];

function gscCtr(p) {
  const l = p.last14;
  if (l) {
    const im = Number(l.impressions) || 0;
    const cl = Number(l.clicks) || 0;
    return l.ctr != null ? Number(l.ctr) : im > 0 ? cl / im : 0;
  }
  return Number(p.ctr) || 0;
}

function gscImpressions(p) {
  const l = p.last14;
  if (l) return Number(l.impressions) || 0;
  return Number(p.impressions) || 0;
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let dryRun = false;
  let limit = 80;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    if (a.startsWith("--limit=")) limit = Math.max(1, parseInt(a.split("=")[1], 10) || 80);
  }
  return { dryRun, limit };
}

function appendLog(row) {
  fs.mkdirSync(path.dirname(PATHS.logJsonl), { recursive: true });
  fs.appendFileSync(PATHS.logJsonl, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n", "utf8");
}

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function parseSlugMeta(slug) {
  const parts = slug.split("-");
  if (parts.length < 3) return null;
  return { platform: parts[0], contentType: parts[1], topic: parts.slice(2).join("-") };
}

function findSectionRange(body, heading) {
  const b = String(body || "");
  const start = b.indexOf(heading);
  if (start < 0) return { start: -1, end: -1 };
  const next = b.indexOf("\n## ", start + heading.length);
  const end = next >= 0 ? next : b.length;
  return { start, end };
}

function upsertBeforeSummary(body, heading, md) {
  const b = String(body || "");
  const summaryMarker = "\n## Summary";
  const range = findSectionRange(b, heading);
  const block = `${heading}\n\n${md}\n`;
  if (range.start >= 0 && range.end > range.start) {
    return `${b.slice(0, range.start)}${block}${b.slice(range.end)}`.replace(/\n{3,}/g, "\n\n");
  }
  const idx = b.indexOf(summaryMarker);
  if (idx >= 0) {
    return `${b.slice(0, idx).trimEnd()}\n\n${block}${b.slice(idx)}`.replace(/\n{3,}/g, "\n\n");
  }
  return `${b.trimEnd()}\n\n${block}`;
}

function replaceFirstH1(body, newH1) {
  const m = body.match(/^#\s+.+$/m);
  if (!m) return body;
  return body.replace(/^#\s+.+$/m, `# ${newH1}`);
}

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function loadGeneratorSlugs() {
  try {
    const fp = path.join(ROOT, "src", "config", "generators.ts");
    const txt = fs.readFileSync(fp, "utf8");
    const i = txt.indexOf("export const generators");
    if (i < 0) return new Set();
    const sub = txt.slice(i, i + 900000);
    const set = new Set();
    const re = /"([a-z0-9][a-z0-9-]*)"\s*:\s*\{/g;
    let m;
    while ((m = re.exec(sub)) !== null) {
      set.add(m[1]);
    }
    return set;
  } catch {
    return new Set();
  }
}

function dedupeStrings(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    if (!x || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function dedupeWorkflow(arr) {
  const out = [];
  const seen = new Set();
  for (const row of arr) {
    if (!row || !row.href || seen.has(row.href)) continue;
    seen.add(row.href);
    out.push(row);
  }
  return out;
}

function slugToLabel(s) {
  return String(s)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildV178Manifest({ winnersSlice, amplify, dryRun, builtAt }) {
  const validSlugs = loadGeneratorSlugs();
  for (const s of V178_CORE_TOOL_SLUGS) {
    validSlugs.add(s);
  }
  const toolAccum = {};

  function ensure(slug) {
    if (!validSlugs.has(slug)) return null;
    if (!toolAccum[slug]) {
      toolAccum[slug] = {
        extraRelatedSlugs: [],
        workflowExtra: [],
        showConversionPath: false
      };
    }
    return toolAccum[slug];
  }

  const highCopy = new Set(
    (amplify?.high_copy_tools || []).map((x) => x.tool_slug).filter(Boolean)
  );
  const prioritize = new Set(amplify?.prioritize_tools_for_cta || []);

  for (const s of highCopy) {
    const t = ensure(s);
    if (t) t.showConversionPath = true;
  }
  for (const s of prioritize) {
    const t = ensure(s);
    if (t) t.showConversionPath = true;
  }

  for (const s of V178_CORE_TOOL_SLUGS) {
    const t = ensure(s);
    if (t) t.showConversionPath = true;
  }

  for (const w of winnersSlice) {
    const toolsList = dedupeStrings(
      (w.actions?.internal_links?.tools || [])
        .map((x) => x.slug)
        .filter((x) => validSlugs.has(x))
    );
    for (let i = 0; i < toolsList.length; i++) {
      const slug = toolsList[i];
      const row = ensure(slug);
      if (!row) continue;
      for (const other of toolsList) {
        if (other !== slug) row.extraRelatedSlugs.push(other);
      }
      for (const nextSlug of toolsList.slice(i + 1, i + 3)) {
        row.workflowExtra.push({
          href: `/tools/${nextSlug}`,
          label: slugToLabel(nextSlug)
        });
      }
    }
  }

  const toolsOut = {};
  for (const slug of Object.keys(toolAccum)) {
    const row = toolAccum[slug];
    const extras = dedupeStrings(row.extraRelatedSlugs).slice(0, 8);
    const wf = dedupeWorkflow(row.workflowExtra).slice(0, 4);
    if (extras.length > 0 || wf.length > 0 || row.showConversionPath) {
      toolsOut[slug] = {
        extraRelatedSlugs: extras,
        workflowExtra: wf,
        showConversionPath: row.showConversionPath
      };
    }
  }

  const winnerToolSet = new Set(Object.keys(toolsOut));
  for (const s of highCopy) winnerToolSet.add(s);
  for (const s of prioritize) winnerToolSet.add(s);

  let answerRows = [];
  try {
    const scriptPath = path.join(ROOT, "scripts", "extract-answer-pages-for-v178.ts");
    const out = execSync(`npx tsx "${scriptPath}"`, {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 12 * 1024 * 1024
    });
    answerRows = JSON.parse(out.trim());
  } catch (e) {
    console.warn("[run-v177-auto-execution] v178 answer index extract failed:", e?.message || e);
  }

  const answersOut = {};
  for (const a of answerRows) {
    if (!a.slug || !a.toolSlug || !winnerToolSet.has(a.toolSlug)) continue;
    const tSurf = toolsOut[a.toolSlug];
    const extra = dedupeStrings((tSurf?.extraRelatedSlugs || []).filter((x) => x !== a.toolSlug)).slice(
      0,
      8
    );
    answersOut[a.slug] = {
      toolSlug: a.toolSlug,
      extraRelatedToolSlugs: extra,
      workflowToTool: (tSurf?.workflowExtra || []).slice(0, 4),
      emphasizePrimaryCta: Boolean(tSurf?.showConversionPath)
    };
  }

  return {
    version: "178.1",
    builtAt,
    dry_run: dryRun,
    tools: toolsOut,
    answers: answersOut
  };
}

function main() {
  const { dryRun, limit } = parseArgs();
  const builtAt = new Date().toISOString();

  const ctrUpdates = [];
  const abSelected = [];

  const winnersDoc = readJson(PATHS.winners);
  const amplify = readJson(PATHS.amplify);
  const lowCtrDoc = readJson(PATHS.lowCtr);
  const abDoc = readJson(PATHS.abTest);
  const search = readJson(PATHS.searchPerf);

  const blogCtrs = [];
  const pathGsc = new Map();
  for (const p of search?.pages || []) {
    const pathname = String(p.path || "");
    if (!pathname.startsWith("/blog/")) continue;
    const im = gscImpressions(p);
    const c = gscCtr(p);
    pathGsc.set(pathname, { ctr: c, impressions: im });
    if (im > 0 || (p.last14?.clicks ?? 0) > 0) blogCtrs.push(c);
  }
  const ctrMedian = blogCtrs.length ? median(blogCtrs) : null;

  const highTools = (amplify?.high_copy_tools || []).slice(0, 4);
  const conversionMd =
    highTools.length > 0
      ? [
          ...highTools.map(
            (t) =>
              `- [${t.tool_slug.replace(/-/g, " ")}](/tools/${t.tool_slug}) — copy results, then publish in your app.`
          ),
          `- [Upgrade for higher limits](/pricing) — when you need more generations.`,
          "",
          "_Path: generate → copy → publish → upgrade when limits apply._"
        ].join("\n")
      : `- [Browse all tools](/tools) — copy results and publish anywhere.\n- [Upgrade](/pricing) — unlock higher limits.`;

  const winners = (winnersDoc?.winners || []).slice(0, limit);
  let winnersTouched = 0;

  for (const w of winners) {
    const slug = w.slug;
    if (!slug) continue;
    const fp = path.join(PATHS.blogDir, `${slug}.mdx`);
    if (!fs.existsSync(fp)) {
      appendLog({
        kind: "winner_skip",
        slug,
        reason: "missing_mdx",
        page_type: "blog",
        action_type: "workflow",
        source: "v176_top_winners"
      });
      continue;
    }

    const raw = fs.readFileSync(fp, "utf8");
    const parsed = matter(raw);
    const fm = { ...(parsed.data || {}) };
    if (fm.v177_winner_enhanced === true) {
      appendLog({
        kind: "winner_skip",
        slug,
        reason: "already_enhanced",
        page_type: "blog",
        action_type: "workflow",
        source: "v176_top_winners"
      });
      continue;
    }
    let body = String(parsed.content || "");
    const meta = parseSlugMeta(slug);

    const toolLinks = (w.actions?.internal_links?.tools || []).map((t) => ({
      href: t.href,
      label: t.label
    }));

    const related = (w.actions?.internal_links?.related_blogs || [])
      .filter((x) => x.slug)
      .map((x) => ({ slug: x.slug, title: x.slug.replace(/-/g, " ") }));

    let answerLinks = [];
    let guideLinks = [];
    if (meta) {
      answerLinks = enLinking.computeEnRelatedAnswerLinksForBlogPage({
        platform: meta.platform,
        contentType: meta.contentType
      });
      guideLinks = enLinking.computeEnRelatedGuideLinksForBlogPage({
        platform: meta.platform,
        contentType: meta.contentType
      });
    }

    body = enLinking.upsertEnBlogRelatedToolsSectionIntoBody(body, toolLinks, { maxLinks: 6 });
    body = enLinking.upsertEnBlogLinksSectionIntoBody(body, "## Related answers", answerLinks, {
      minLinks: 1,
      maxLinks: 4
    });
    body = enLinking.upsertEnBlogLinksSectionIntoBody(body, "## Related guides", guideLinks, {
      minLinks: 1,
      maxLinks: 3
    });
    body = enLinking.mergeEnBlogRelatedPagesSectionIntoBody(body, related, { maxLinks: 14 });

    body = upsertBeforeSummary(
      body,
      "## Next steps (ToolEagle)",
      [
        "- [Try free generators](/tools) — copy outputs, then paste into your app.",
        "- [Upgrade for unlimited usage](/pricing) — when you outgrow free limits."
      ].join("\n")
    );

    body = upsertBeforeSummary(body, "## High-conversion tools (auto)", conversionMd);

    const nextData = { ...fm, v177_winner_enhanced: true, v177_winner_enhanced_at: builtAt };
    const out = matter.stringify(body, nextData);
    const res = mdxSafety.sanitizeAndValidateMdxForWrite({
      mdxString: out,
      filePath: fp,
      slug,
      failureKind: "v177_winner_execution"
    });

    if (res.ok) {
      if (!dryRun) fs.writeFileSync(fp, res.sanitizedMdx, "utf8");
      winnersTouched++;
      appendLog({
        kind: "winner_enhanced",
        slug,
        path: w.path,
        source: "v176_top_winners",
        dry_run: dryRun,
        page_type: "blog",
        action_type: "workflow"
      });
    } else {
      appendLog({
        kind: "winner_failed_compile",
        slug,
        path: w.path,
        page_type: "blog",
        action_type: "workflow",
        source: "v176_top_winners"
      });
    }
  }

  for (const fix of lowCtrDoc?.fixes || []) {
    const slug = fix.slug;
    if (!slug) continue;
    const fp = path.join(PATHS.blogDir, `${slug}.mdx`);
    if (!fs.existsSync(fp)) {
      appendLog({
        kind: "ctr_fix_skip",
        slug,
        reason: "missing_mdx",
        page_type: "blog",
        action_type: "CTR",
        source: "v176_low_ctr"
      });
      continue;
    }
    const raw = fs.readFileSync(fp, "utf8");
    const parsed = matter(raw);
    const data = { ...(parsed.data || {}) };
    if (data.v177_ctr_applied === true) {
      appendLog({
        kind: "ctr_fix_skip",
        slug,
        reason: "already_applied",
        page_type: "blog",
        action_type: "CTR",
        source: "v176_low_ctr"
      });
      continue;
    }
    const before = {
      title: String(data.title || fix.current.title || ""),
      description: String(data.description || fix.current.meta_description || ""),
      h1: fix.current.h1
    };
    const after = {
      title: fix.rewrite_suggestions.title_b || before.title,
      description: fix.rewrite_suggestions.meta_description || before.description,
      h1: fix.rewrite_suggestions.h1 || before.h1
    };
    data.title = after.title;
    data.description = after.description;
    data.v177_ctr_applied = true;
    data.v177_ctr_applied_at = builtAt;
    let body = String(parsed.content || "");
    body = replaceFirstH1(body, after.h1);

    const out = matter.stringify(body, data);
    const res = mdxSafety.sanitizeAndValidateMdxForWrite({
      mdxString: out,
      filePath: fp,
      slug,
      failureKind: "v177_ctr_fix"
    });
    if (res.ok) {
      if (!dryRun) fs.writeFileSync(fp, res.sanitizedMdx, "utf8");
      ctrUpdates.push({
        slug,
        path: fix.path,
        before,
        after,
        source: "v176_low_ctr"
      });
      appendLog({
        kind: "ctr_meta_h1_updated",
        slug,
        path: fix.path,
        source: "v176_low_ctr",
        dry_run: dryRun,
        page_type: "blog",
        action_type: "CTR"
      });
    }
  }

  for (const v of abDoc?.variants || []) {
    if (v.axis !== "title") {
      abSelected.push({
        path: v.page,
        slug: v.slug,
        axis: v.axis,
        decision: "skip_no_gsc",
        ctr: null,
        median_ctr: ctrMedian,
        reason: "cta_axis_not_auto_in_v177"
      });
      continue;
    }
    const g = pathGsc.get(v.page);
    const ctr = g?.ctr ?? null;
    const im = g?.impressions ?? 0;
    if (!g || im < 1 || ctrMedian == null) {
      abSelected.push({
        path: v.page,
        slug: v.slug,
        axis: "title",
        decision: "skip_no_gsc",
        ctr,
        median_ctr: ctrMedian,
        reason: "need_gsc_impressions_and_median"
      });
      continue;
    }
    const useB = ctr < ctrMedian;
    const chosen = useB ? v.variant_b : v.variant_a;
    const decision = useB ? "variant_b" : "variant_a";

    const fp = path.join(PATHS.blogDir, `${v.slug}.mdx`);
    if (!fs.existsSync(fp)) {
      abSelected.push({
        path: v.page,
        slug: v.slug,
        axis: "title",
        decision: "skip_no_gsc",
        ctr,
        median_ctr: ctrMedian,
        reason: "missing_mdx"
      });
      appendLog({
        kind: "ab_skip",
        slug: v.slug,
        reason: "missing_mdx",
        page_type: "blog",
        action_type: "CTR",
        source: "v176_ab_test"
      });
      continue;
    }
    const raw = fs.readFileSync(fp, "utf8");
    const parsed = matter(raw);
    const data = { ...(parsed.data || {}) };
    if (data.v177_ab_title_applied_at) {
      abSelected.push({
        path: v.page,
        slug: v.slug,
        axis: "title",
        decision: "skip_already_applied",
        ctr,
        median_ctr: ctrMedian,
        reason: "v177_ab_title_already_applied"
      });
      appendLog({
        kind: "ab_skip",
        slug: v.slug,
        reason: "already_applied",
        page_type: "blog",
        action_type: "CTR",
        source: "v176_ab_test"
      });
      continue;
    }
    const prevTitle = String(data.title || "");
    data.title = chosen;
    data.v177_ab_title_selected = decision;
    data.v177_ab_title_applied_at = builtAt;
    const out = matter.stringify(String(parsed.content || ""), data);
    const res = mdxSafety.sanitizeAndValidateMdxForWrite({
      mdxString: out,
      filePath: fp,
      slug: v.slug,
      failureKind: "v177_ab_select"
    });
    if (res.ok) {
      if (!dryRun) fs.writeFileSync(fp, res.sanitizedMdx, "utf8");
      appendLog({
        kind: "ab_title_applied",
        slug: v.slug,
        path: v.page,
        decision,
        prev_title: prevTitle,
        new_title: chosen,
        dry_run: dryRun,
        page_type: "blog",
        action_type: "CTR",
        source: "v176_ab_test"
      });
      abSelected.push({
        path: v.page,
        slug: v.slug,
        axis: "title",
        decision,
        ctr,
        median_ctr: ctrMedian,
        reason: useB ? "ctr_below_site_median_apply_b" : "ctr_at_or_above_median_keep_a",
        applied: !dryRun
      });
    } else {
      abSelected.push({
        path: v.page,
        slug: v.slug,
        axis: "title",
        decision,
        ctr,
        median_ctr: ctrMedian,
        reason: "mdx_compile_failed"
      });
    }
  }

  const fingerprintPath = path.join(ROOT, "generated", "quality-gate", "en-blog-fingerprints.json");
  if (!dryRun && fs.existsSync(fingerprintPath)) {
    try {
      execSync(`node "${path.join(ROOT, "scripts", "backfill-en-blog-linking.js")}"`, {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env
      });
      appendLog({
        kind: "backfill_en_blog_linking",
        ok: true,
        page_type: "blog",
        action_type: "internal_link",
        source: "backfill_en_blog_linking"
      });
    } catch (e) {
      appendLog({
        kind: "backfill_en_blog_linking",
        ok: false,
        error: String(e),
        page_type: "blog",
        action_type: "internal_link",
        source: "backfill_en_blog_linking"
      });
    }
  } else {
    appendLog({
      kind: "backfill_skipped",
      reason: dryRun ? "dry_run" : "missing_en_blog_fingerprints",
      page_type: "blog",
      action_type: "internal_link",
      source: "backfill_en_blog_linking"
    });
  }

  fs.mkdirSync(path.dirname(PATHS.outCtr), { recursive: true });
  fs.writeFileSync(
    PATHS.outCtr,
    JSON.stringify(
      {
        version: "177",
        builtAt,
        dry_run: dryRun,
        updates: ctrUpdates
      },
      null,
      2
    ),
    "utf8"
  );

  fs.writeFileSync(
    PATHS.outAb,
    JSON.stringify(
      {
        version: "177",
        builtAt,
        dry_run: dryRun,
        median_blog_ctr: ctrMedian,
        selections: abSelected
      },
      null,
      2
    ),
    "utf8"
  );

  const v178Manifest = buildV178Manifest({
    winnersSlice: winners,
    amplify,
    dryRun,
    builtAt
  });
  fs.mkdirSync(path.dirname(PATHS.outV178), { recursive: true });
  fs.writeFileSync(PATHS.outV178, JSON.stringify(v178Manifest, null, 2), "utf8");

  for (const [toolSlug, surf] of Object.entries(v178Manifest.tools)) {
    if (surf.extraRelatedSlugs.length > 0 || surf.workflowExtra.length > 0) {
      appendLog({
        kind: "v178_tool_surface",
        page_type: "tool",
        action_type: "internal_link",
        tool_slug: toolSlug,
        extras: surf.extraRelatedSlugs.length,
        workflow_steps: surf.workflowExtra.length,
        dry_run: dryRun,
        source: "v176_top_winners"
      });
    }
    if (surf.showConversionPath) {
      appendLog({
        kind: "v178_tool_surface",
        page_type: "tool",
        action_type: "CTA",
        tool_slug: toolSlug,
        dry_run: dryRun,
        source: "v176_conversion_path_amplify"
      });
    }
  }
  for (const answerSlug of Object.keys(v178Manifest.answers)) {
    appendLog({
      kind: "v178_answer_surface",
      page_type: "answer",
      action_type: "workflow",
      answer_slug: answerSlug,
      dry_run: dryRun,
      source: "v178_full_surface"
    });
  }

  for (const slug of V178_CORE_TOOL_SLUGS) {
    appendLog({
      kind: "v178_core_tool_surface",
      page_type: "core_tool",
      action_type: "v178_core_tool_surface",
      tool_slug: slug,
      dry_run: dryRun,
      source: "v178.1_core_tool_integration"
    });
  }

  console.log(
    `[run-v177-auto-execution] winners_touched=${winnersTouched} ctr_fixes=${ctrUpdates.length} ab=${abSelected.length} v178_tools=${Object.keys(v178Manifest.tools).length} v178_answers=${Object.keys(v178Manifest.answers).length} dryRun=${dryRun}`
  );
}

main();
