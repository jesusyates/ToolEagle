/**
 * V105: Legacy backfill for EN blog internal linking structure.
 *
 * - Preserves frontmatter + body except for linking sections.
 * - Adds/normalizes:
 *   - Related pages (blog-to-blog)
 *   - Related tools
 *   - Related answers
 *   - Related guides
 *   - Related hubs
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const {
  buildEnBlogLinkIndex,
  selectEnBlogRelatedPageSlugs,
  loadSearchLinkPriority,
  extractEnBlogTitleFromMdx,
  computeEnRelatedToolLinksForBlogPage,
  computeEnRelatedAnswerLinksForBlogPage,
  computeEnRelatedGuideLinksForBlogPage,
  computeEnRelatedHubLinksForBlogPage,
  upsertEnBlogRelatedPagesSectionIntoBody,
  upsertEnBlogLinksSectionIntoBody,
  upsertEnBlogRelatedToolsSectionIntoBody
} = require("./lib/en-internal-linking");
const { sanitizeAndValidateMdxForWrite } = require("./lib/mdx-safety");

function parseEnBlogSlugMeta(slug) {
  const parts = String(slug || "").split("-");
  if (parts.length < 3) return null;
  return {
    platform: parts[0],
    contentType: parts[1],
    topic: parts.slice(2).join("-")
  };
}

function getArgs() {
  const argv = process.argv.slice(2);
  const out = { dryRun: false, limit: null };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    if (a.startsWith("--limit=")) out.limit = Number(a.slice("--limit=".length));
  }
  return out;
}

function readAllBlogMdxFiles(blogDir) {
  const files = [];
  const entries = fs.readdirSync(blogDir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    if (!ent.name.endsWith(".mdx")) continue;
    files.push(path.join(blogDir, ent.name));
  }
  return files;
}

function slugFromBlogMdxPath(filePath) {
  const name = path.basename(filePath);
  return name.replace(/\.mdx$/i, "");
}

async function main() {
  const { dryRun, limit } = getArgs();

  const repoRoot = process.cwd();
  const blogDir = path.join(repoRoot, "content", "blog");
  const fingerprintPath = path.join(repoRoot, "generated", "quality-gate", "en-blog-fingerprints.json");

  if (!fs.existsSync(blogDir)) {
    console.error(`[backfill-en-blog-linking] Missing blog dir: ${blogDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(fingerprintPath)) {
    console.error(`[backfill-en-blog-linking] Missing fingerprints: ${fingerprintPath}`);
    process.exit(1);
  }

  const fingerprintsRaw = JSON.parse(fs.readFileSync(fingerprintPath, "utf8"));
  const fingerprints = fingerprintsRaw?.items || fingerprintsRaw || [];
  const linkIndex = buildEnBlogLinkIndex(fingerprints);
  const searchLink = loadSearchLinkPriority();

  const mdxFiles = readAllBlogMdxFiles(blogDir);
  const titleBySlug = new Map();

  // Build a title cache once to avoid repeated file reads for Related pages.
  for (const filePath of mdxFiles) {
    const slug = slugFromBlogMdxPath(filePath);
    const raw = fs.readFileSync(filePath, "utf8");
    titleBySlug.set(slug, extractEnBlogTitleFromMdx(raw));
  }

  let processed = 0;
  let updated = 0;
  let skipped = 0;

  for (const filePath of mdxFiles) {
    if (limit != null && processed >= limit) break;
    processed++;

    const slug = slugFromBlogMdxPath(filePath);
    const meta = parseEnBlogSlugMeta(slug);
    if (!meta) {
      skipped++;
      continue;
    }

    const fp = linkIndex.fpBySlug.get(slug);
    if (!fp?.hashes) {
      skipped++;
      continue;
    }

    const toolLinks = computeEnRelatedToolLinksForBlogPage(
      { platform: meta.platform, contentType: meta.contentType },
      searchLink.v181,
      searchLink.v182
    );
    const answerLinks = computeEnRelatedAnswerLinksForBlogPage({ platform: meta.platform, contentType: meta.contentType });
    const guideLinks = computeEnRelatedGuideLinksForBlogPage({ platform: meta.platform, contentType: meta.contentType });
    const hubLinks = computeEnRelatedHubLinksForBlogPage(meta.platform);

    const relatedPageSlugs = selectEnBlogRelatedPageSlugs({
      index: linkIndex,
      platform: meta.platform,
      contentType: meta.contentType,
      topic: meta.topic,
      newSlug: slug,
      newHashes: fp.hashes,
      desiredMin: 3,
      desiredMax: 10,
      desiredCount: 8,
      linkPriority: searchLink
    });

    const relatedPageLinks = relatedPageSlugs.map((s) => ({
      slug: s,
      title: titleBySlug.get(s) || s
    }));

    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);

    let body = String(parsed.content || "");
    const before = body;

    body = upsertEnBlogRelatedToolsSectionIntoBody(body, toolLinks, { maxLinks: 3 });
    body = upsertEnBlogLinksSectionIntoBody(body, "## Related answers", answerLinks, { minLinks: 1, maxLinks: 3 });
    body = upsertEnBlogLinksSectionIntoBody(body, "## Related guides", guideLinks, { minLinks: 1, maxLinks: 3 });
    body = upsertEnBlogLinksSectionIntoBody(body, "## Related hubs", hubLinks, { minLinks: 1, maxLinks: 1 });
    body = upsertEnBlogRelatedPagesSectionIntoBody(body, relatedPageLinks, { minLinks: 3, maxLinks: 10 });

    if (body !== before) {
      updated++;
      if (!dryRun) {
        const out = matter.stringify(body, parsed.data);
        const res = sanitizeAndValidateMdxForWrite({
          mdxString: out,
          filePath,
          slug,
          failureKind: "en_blog_backfill_linking_mdx_compile_check"
        });
        if (res.ok) {
          fs.writeFileSync(filePath, res.sanitizedMdx, "utf8");
        } else {
          skipped++;
          updated--;
        }
      }
    }
  }

  console.log(`[backfill-en-blog-linking] processed=${processed} updated=${updated} skipped=${skipped} dryRun=${dryRun}`);
}

main().catch((err) => {
  console.error("[backfill-en-blog-linking] failed:", err);
  process.exit(1);
});

