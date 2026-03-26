#!/usr/bin/env node
/**
 * V107: Batch pull Google Search Console page-level Search Analytics (last 14d vs previous 14d),
 * classify EN SEO URLs, write compact JSON for growth + internal-link priority.
 *
 * Env: GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL (or NEXT_PUBLIC_SITE_URL for origin match)
 *
 * Usage: node scripts/pull-search-performance.js
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
require("dotenv").config();

const { google } = require("googleapis");

const OUT_PERF = path.join(process.cwd(), "generated", "search-performance.json");
const OUT_REC = path.join(process.cwd(), "generated", "search-priority-recommendations.json");

function ensureDir(p) {
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function getBaseOrigin() {
  const u = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.tooleagle.com";
  try {
    return new URL(u).origin;
  } catch {
    return "https://www.tooleagle.com";
  }
}

/** Supports URL-prefix and sc-domain:* GSC properties. */
function originMatchesPageUrl(pageUrl, siteUrl) {
  try {
    const u = new URL(pageUrl);
    const s = String(siteUrl || "").trim();
    if (s.startsWith("sc-domain:")) {
      const domain = s.replace(/^sc-domain:/i, "").replace(/\/$/, "");
      return u.hostname === domain || u.hostname.endsWith(`.${domain}`);
    }
    const su = new URL(s.endsWith("/") ? s : `${s}/`);
    return u.origin === su.origin;
  } catch {
    return false;
  }
}

function classifyPath(pathname) {
  if (pathname.startsWith("/blog/")) return "blog";
  if (pathname.startsWith("/answers/")) return "answer";
  if (pathname.startsWith("/en/how-to/")) return "guide";
  if (pathname.startsWith("/tools/")) return "tool";
  return null;
}

function blogSlugFromPath(pathname) {
  if (!pathname.startsWith("/blog/")) return null;
  const rest = pathname.slice("/blog/".length).replace(/\/$/, "");
  if (!rest || rest.includes("/")) return null;
  return rest;
}

function parseBlogMeta(slug) {
  const parts = String(slug || "").split("-");
  if (parts.length < 3) return null;
  return { platform: parts[0], contentType: parts[1], topic: parts.slice(2).join("-") };
}

async function fetchPageRows(searchconsole, siteUrl, startDate, endDate) {
  const map = new Map();
  let startRow = 0;
  const rowLimit = 25000;
  while (true) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit,
        startRow,
        dataState: "all"
      }
    });
    const rows = res.data.rows || [];
    if (rows.length === 0) break;
    for (const row of rows) {
      const pageUrl = row.keys?.[0];
      if (!pageUrl) continue;
      map.set(pageUrl, {
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0
      });
    }
    if (rows.length < rowLimit) break;
    startRow += rowLimit;
  }
  return map;
}

function mergeMetrics(a, b) {
  return {
    clicks: (a?.clicks || 0) + (b?.clicks || 0),
    impressions: (a?.impressions || 0) + (b?.impressions || 0),
    ctr: 0,
    position: a?.position || b?.position || 0
  };
}

function assignBucket(last, prev) {
  const impL = last?.impressions || 0;
  const impP = prev?.impressions || 0;
  const clkL = last?.clicks || 0;
  const clkP = prev?.clicks || 0;
  const ctr = last?.ctr || 0;
  const posL = last?.position || 0;
  const posP = prev?.position || 0;

  if (clkL >= 5 || (ctr >= 0.04 && impL >= 100)) return "winners";

  if (impL >= 20 && impP > 0 && impL >= impP * 1.15) return "rising_pages";
  if (impL >= 20 && posP > 0 && posL > 0 && posL < posP - 0.5) return "rising_pages";

  if (impL >= 150 && ctr < 0.02 && clkL < 20) return "high_potential";

  if (impL + impP < 50 && clkL + clkP === 0 && impL + impP > 0) return "weak_pages";

  return "neutral";
}

async function main() {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const siteUrl = process.env.GSC_SITE_URL ?? `${getBaseOrigin()}/`;

  ensureDir(OUT_PERF);

  if (!clientEmail || !privateKey) {
    const stub = {
      updatedAt: new Date().toISOString(),
      error: "GSC credentials not configured",
      siteUrl,
      pages: [],
      buckets: {}
    };
    fs.writeFileSync(OUT_PERF, JSON.stringify(stub, null, 2), "utf8");
    fs.writeFileSync(
      OUT_REC,
      JSON.stringify(
        {
          updatedAt: stub.updatedAt,
          error: stub.error,
          linkPrioritySlugs: [],
          weakLinkSlugs: [],
          decisions: {
            expandTopics: [],
            ctrTitleMetaImprove: [],
            internalLinkBoostRationale: "No GSC data.",
            slowDownClusters: []
          }
        },
        null,
        2
      ),
      "utf8"
    );
    console.warn("[pull-search-performance] Missing GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY — wrote stub JSON.");
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
  });
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const end = new Date();
  const mid = new Date();
  mid.setDate(mid.getDate() - 14);
  const start = new Date();
  start.setDate(start.getDate() - 28);

  const lastStart = isoDate(mid);
  const lastEnd = isoDate(end);
  const prevStart = isoDate(start);
  const prevEnd = isoDate(new Date(mid.getTime() - 86400000));

  const [mapLast, mapPrev] = await Promise.all([
    fetchPageRows(searchconsole, siteUrl, lastStart, lastEnd),
    fetchPageRows(searchconsole, siteUrl, prevStart, prevEnd)
  ]);

  const allUrls = new Set([...mapLast.keys(), ...mapPrev.keys()]);
  const pages = [];
  const platformImp = { tiktok: 0, youtube: 0, instagram: 0 };
  const weakClusters = new Map();

  for (const pageUrl of allUrls) {
    let pathname;
    try {
      const u = new URL(pageUrl);
      if (!originMatchesPageUrl(pageUrl, siteUrl)) continue;
      pathname = u.pathname;
    } catch {
      continue;
    }

    const ptype = classifyPath(pathname);
    if (!ptype) continue;

    const last = mapLast.get(pageUrl);
    const prev = mapPrev.get(pageUrl);
    const lastM = last || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const prevM = prev || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const total28 = mergeMetrics(lastM, prevM);
    total28.ctr = total28.impressions > 0 ? total28.clicks / total28.impressions : 0;

    const bucket = assignBucket(lastM, prevM);

    const entry = {
      url: pageUrl,
      path: pathname,
      pageType: ptype,
      bucket,
      last14: {
        clicks: lastM.clicks,
        impressions: lastM.impressions,
        ctr: lastM.ctr,
        position: lastM.position
      },
      prev14: {
        clicks: prevM.clicks,
        impressions: prevM.impressions,
        ctr: prevM.ctr,
        position: prevM.position
      },
      total28: {
        clicks: total28.clicks,
        impressions: total28.impressions,
        ctr: total28.ctr,
        position: lastM.position || prevM.position
      }
    };
    pages.push(entry);

    if (ptype === "blog" && bucket === "weak_pages") {
      const slug = blogSlugFromPath(pathname);
      const meta = slug ? parseBlogMeta(slug) : null;
      if (meta) {
        const k = `${meta.platform}|${meta.contentType}`;
        weakClusters.set(k, (weakClusters.get(k) || 0) + 1);
      }
    }

    if (ptype === "blog" && (bucket === "winners" || bucket === "rising_pages")) {
      const slug = blogSlugFromPath(pathname);
      const meta = slug ? parseBlogMeta(slug) : null;
      if (meta?.platform && platformImp[meta.platform] != null) {
        platformImp[meta.platform] += lastM.impressions;
      }
    }
  }

  pages.sort((a, b) => b.last14.impressions - a.last14.impressions);

  const buckets = {
    winners: pages.filter((p) => p.bucket === "winners").map((p) => p.path),
    rising_pages: pages.filter((p) => p.bucket === "rising_pages").map((p) => p.path),
    high_potential: pages.filter((p) => p.bucket === "high_potential").map((p) => p.path),
    weak_pages: pages.filter((p) => p.bucket === "weak_pages").map((p) => p.path),
    neutral: pages.filter((p) => p.bucket === "neutral").length
  };

  const outPerf = {
    updatedAt: new Date().toISOString(),
    siteUrl,
    baseOrigin: getBaseOrigin(),
    periods: {
      last14: { start: lastStart, end: lastEnd },
      prev14: { start: prevStart, end: prevEnd }
    },
    pageCount: pages.length,
    pages,
    buckets
  };
  fs.writeFileSync(OUT_PERF, JSON.stringify(outPerf, null, 2), "utf8");

  const blogPages = pages.filter((p) => p.pageType === "blog");
  const linkPriority = [];
  const seenPri = new Set();
  for (const p of blogPages) {
    if (!["winners", "rising_pages", "high_potential"].includes(p.bucket)) continue;
    const slug = blogSlugFromPath(p.path);
    if (!slug || seenPri.has(slug)) continue;
    seenPri.add(slug);
    linkPriority.push({ slug, bucket: p.bucket, impressions: p.last14.impressions });
  }
  linkPriority.sort((a, b) => b.impressions - a.impressions);
  const linkPrioritySlugs = linkPriority.slice(0, 120).map((x) => x.slug);

  const weakLinkSlugs = [];
  const seenW = new Set();
  for (const p of blogPages) {
    if (p.bucket !== "weak_pages") continue;
    const slug = blogSlugFromPath(p.path);
    if (!slug || seenW.has(slug)) continue;
    seenW.add(slug);
    weakLinkSlugs.push(slug);
  }

  const expandTopics = Object.entries(platformImp)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0)
    .map(([k]) => k);

  const ctrTitleMetaImprove = pages
    .filter((p) => p.bucket === "high_potential")
    .slice(0, 80)
    .map((p) => ({
      path: p.path,
      pageType: p.pageType,
      impressions: p.last14.impressions,
      ctr: p.last14.ctr,
      position: p.last14.position,
      note: "Improve title/meta/snippets for CTR"
    }));

  const slowDownClusters = [...weakClusters.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([key, count]) => {
      const [platform, contentType] = key.split("|");
      return { platform, contentType, weakPageSignals: count, note: "Reduce blind volume until demand shows" };
    });

  const decisions = {
    expandTopics,
    ctrTitleMetaImprove,
    internalLinkBoostRationale:
      "linkPrioritySlugs = blog URLs in winners, rising_pages, or high_potential (by impressions). weakLinkSlugs = weak_pages for deprioritized internal links.",
    slowDownClusters,
    internalLinkBoostCount: linkPrioritySlugs.length,
    weakDeprioritizeCount: weakLinkSlugs.length
  };

  const outRec = {
    updatedAt: new Date().toISOString(),
    linkPrioritySlugs,
    weakLinkSlugs,
    decisions
  };
  fs.writeFileSync(OUT_REC, JSON.stringify(outRec, null, 2), "utf8");

  console.log(
    `[pull-search-performance] pages=${pages.length} priority=${linkPrioritySlugs.length} weak=${weakLinkSlugs.length} → generated/`
  );
}

main().catch((e) => {
  console.error("[pull-search-performance]", e);
  process.exit(1);
});
