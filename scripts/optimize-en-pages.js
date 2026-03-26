#!/usr/bin/env node
/**
 * V112 + V113 — Apply safe EN blog MDX updates; V113 appends generated/page-optimization-registry.json on --write
 *
 * Usage:
 *   node scripts/optimize-en-pages.js --dry-run
 *   node scripts/optimize-en-pages.js --write --limit 5
 *   node scripts/optimize-en-pages.js --write --only high_potential
 *   node scripts/optimize-en-pages.js --write --only rising_pages --include-intro
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { BLOG_DIR, safeReadJson } = require("./lib/page-optimization-shared");

const REC_PATH = path.join(process.cwd(), "generated", "page-optimization-recommendations.json");
const HISTORY = path.join(process.cwd(), "generated", "page-optimization-history.jsonl");
const { appendEntries } = require("./lib/page-optimization-registry");

function parseArgs(argv) {
  const out = {
    dryRun: argv.includes("--dry-run"),
    write: argv.includes("--write"),
    limit: null,
    only: null,
    includeIntro: argv.includes("--include-intro"),
  };
  const li = argv.indexOf("--limit");
  if (li >= 0) out.limit = parseInt(argv[li + 1], 10) || null;
  const oi = argv.indexOf("--only");
  if (oi >= 0) out.only = argv[oi + 1] || null;
  return out;
}

function shouldInclude(item, only) {
  if (!only) return true;
  return item.bucket === only;
}

function appendHistory(entry) {
  fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
  fs.appendFileSync(HISTORY, JSON.stringify(entry) + "\n", "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const doc = safeReadJson(REC_PATH);
  if (!doc || !Array.isArray(doc.items)) {
    console.error("Missing generated/page-optimization-recommendations.json — run build-page-optimization-recommendations.js");
    process.exit(1);
  }

  if (args.write && args.dryRun) {
    console.error("Use either --write or --dry-run, not both.");
    process.exit(1);
  }

  const doWrite = args.write;
  if (!doWrite && !args.dryRun) {
    console.log("No --write or --dry-run: defaulting to --dry-run (no files changed).");
  }
  const dry = !doWrite;

  let items = doc.items.filter((it) => it.status !== "missing_file" && it.recommendations);
  if (args.only) {
    items = items.filter((it) => shouldInclude(it, args.only));
  }
  if (args.limit) items = items.slice(0, args.limit);

  let applied = 0;
  for (const item of items) {
    const slug = item.slug;
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) {
      console.log(`[skip] missing ${filePath}`);
      continue;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const nextData = { ...data };
    let nextContent = content;
    const changes = [];

    const safe = item.safeApply || {};
    const newDesc = safe.description;
    if (typeof newDesc === "string" && newDesc.trim() && newDesc.trim() !== String(data.description || "").trim()) {
      nextData.description = newDesc.trim();
      changes.push("description");
    }

    if (args.includeIntro) {
      const plat = slug.startsWith("youtube-") ? "YouTube" : slug.startsWith("instagram-") ? "Instagram" : "TikTok";
      const prefix = `Practical, copy-ready ${plat} ideas below — use the linked generator to adapt lines to your niche.`;
      const marker = "<!-- v112-intro -->";
      if (!content.includes(marker) && (item.current?.introWordCount ?? 0) < 45) {
        nextContent = `${marker}\n\n${prefix}\n\n${content}`;
        changes.push("intro_prefix");
      }
    }

    if (changes.length === 0) {
      console.log(`[noop] ${slug} — no safe field changes (already aligned or empty diff)`);
      continue;
    }

    const outStr = matter.stringify(nextContent, nextData);
    const preview = `[${slug}] ${changes.join("+")}`;

    if (dry) {
      console.log(`[dry-run] would write ${filePath} (${preview})`);
      applied++;
      continue;
    }

    fs.writeFileSync(filePath, outStr, "utf8");
    const optimizedAt = new Date().toISOString();
    appendHistory({
      at: optimizedAt,
      slug,
      file: path.relative(process.cwd(), filePath),
      changes,
      bucket: item.bucket,
      ctr: item.ctr
    });
    registryBatch.push({
      entryId: `${slug}@${optimizedAt}`,
      slug,
      path: `/blog/${slug}`,
      bucketAtOptimization: item.bucket,
      optimizedAt,
      fieldsChanged: changes,
      previous: {
        title: data.title ?? null,
        description: data.description ?? null,
        intro: String(content).slice(0, 1200)
      },
      new: {
        title: nextData.title ?? null,
        description: nextData.description ?? null,
        intro: String(nextContent).slice(0, 1200)
      },
      priorityReason: item.priorityReason ?? null,
      sourceRecommendationRef: {
        file: "generated/page-optimization-recommendations.json",
        recommendationsUpdatedAt: doc.updatedAt ?? null
      }
    });
    console.log(`[write] ${preview}`);
    applied++;
  }

  if (!dry && registryBatch.length) {
    appendEntries(registryBatch);
    console.log(`[V113] registry +${registryBatch.length} → generated/page-optimization-registry.json`);
  }

  console.log(`Done. ${dry ? "Dry-run" : "Wrote"} ${applied} file(s). History: ${HISTORY}`);
}

main();
