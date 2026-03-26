#!/usr/bin/env node
/**
 * V113 — Before/after GSC metrics for registry entries → impact + lessons
 *
 * Env: GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL (same as V107)
 *
 * Usage: node scripts/measure-page-optimization-impact.js
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
require("dotenv").config();

const { google } = require("googleapis");
const { loadRegistry, REGISTRY_PATH } = require("./lib/page-optimization-registry");

const OUT_IMPACT = path.join(process.cwd(), "generated", "page-optimization-impact.json");
const OUT_LESSONS = path.join(process.cwd(), "generated", "page-optimization-lessons.json");

function getBaseOrigin() {
  const u = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.tooleagle.com";
  try {
    return new URL(u).origin;
  } catch {
    return "https://www.tooleagle.com";
  }
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

/** [start, end] inclusive calendar ranges as ISO dates */
function windowsForOptimization(optimizedAtIso) {
  const opt = new Date(optimizedAtIso);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const optDay = new Date(opt.getFullYear(), opt.getMonth(), opt.getDate());

  const beforeEnd = addDays(optDay, -1);
  const beforeStart = addDays(beforeEnd, -13);

  const afterStart = addDays(optDay, 1);
  const after7End = addDays(afterStart, 6);
  const after14End = addDays(afterStart, 13);

  const capEnd = (end) => (end > today ? today : end);

  return {
    before14: { start: isoDate(beforeStart), end: isoDate(beforeEnd) },
    after7: { start: isoDate(afterStart), end: isoDate(capEnd(after7End)) },
    after14: { start: isoDate(afterStart), end: isoDate(capEnd(after14End)) },
    daysAfterAvailable: Math.max(0, Math.floor((today - afterStart) / 86400000))
  };
}

async function fetchPageMetrics(searchconsole, siteUrl, pageUrl, startDate, endDate) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["page"],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "page",
              operator: "equals",
              expression: pageUrl
            }
          ]
        }
      ],
      rowLimit: 25,
      dataState: "all"
    }
  });
  const row = res.data.rows?.[0];
  if (!row) {
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }
  return {
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0
  };
}

async function fetchWithUrlVariants(searchconsole, siteUrl, urls, startDate, endDate) {
  for (const u of urls) {
    const m = await fetchPageMetrics(searchconsole, siteUrl, u, startDate, endDate);
    if (m.impressions > 0 || m.clicks > 0) return { metrics: m, matchedUrl: u };
  }
  const m = await fetchPageMetrics(searchconsole, siteUrl, urls[0], startDate, endDate);
  return { metrics: m, matchedUrl: urls[0] };
}

function classifyOutcome(before, after, minImp = 25) {
  const bi = before.impressions || 0;
  const ai = after.impressions || 0;
  if (bi < minImp && ai < minImp) {
    return { outcome: "insufficient_data", reason: "impressions too low in before/after windows" };
  }

  const bCtr = before.ctr ?? 0;
  const aCtr = after.ctr ?? 0;
  const bClk = before.clicks ?? 0;
  const aClk = after.clicks ?? 0;
  const bPos = before.position ?? 0;
  const aPos = after.position ?? 0;

  const ctrDelta = aCtr - bCtr;
  const clkRatio = bClk > 0 ? aClk / bClk : aClk > 0 ? 2 : 1;
  const impRatio = bi > 0 ? ai / bi : 1;
  const posDelta = bPos > 0 && aPos > 0 ? bPos - aPos : 0;

  if (ctrDelta < -0.003 && aClk < bClk * 0.85 && impRatio > 0.7) {
    return { outcome: "worse", reason: "CTR and clicks down with comparable impressions" };
  }

  if (ctrDelta >= 0.0015 && impRatio >= 0.65) {
    return { outcome: "improved_ctr", reason: `CTR +${(ctrDelta * 100).toFixed(2)}pp vs baseline 14d` };
  }

  if (clkRatio >= 1.1 && impRatio >= 0.75) {
    return { outcome: "improved_clicks", reason: "Clicks up materially with stable reach" };
  }

  if (posDelta >= 1 && aCtr >= bCtr * 0.92) {
    return { outcome: "improved_position", reason: "Average position improved without CTR collapse" };
  }

  if (bi < minImp * 2 || ai < minImp) {
    return { outcome: "insufficient_data", reason: "thin after window or noisy volumes" };
  }

  return { outcome: "neutral", reason: "No clear uplift or decline vs thresholds" };
}

function buildLessons(records) {
  const byOutcome = {};
  const byBucket = {};
  const byBucketOutcome = {};
  const byField = {};
  const byFieldOutcome = {};

  for (const r of records) {
    const o = r.classification?.outcome || "?";
    byOutcome[o] = (byOutcome[o] || 0) + 1;
    const b = r.bucketAtOptimization || "?";
    byBucket[b] = byBucket[b] || { improved: 0, total: 0 };
    byBucket[b].total++;
    if (["improved_ctr", "improved_clicks", "improved_position"].includes(o)) byBucket[b].improved++;

    byBucketOutcome[b] = byBucketOutcome[b] || {};
    byBucketOutcome[b][o] = (byBucketOutcome[b][o] || 0) + 1;

    for (const f of r.fieldsChanged || []) {
      byField[f] = byField[f] || { improved: 0, total: 0 };
      byField[f].total++;
      if (["improved_ctr", "improved_clicks", "improved_position"].includes(o)) byField[f].improved++;

      byFieldOutcome[f] = byFieldOutcome[f] || {};
      byFieldOutcome[f][o] = (byFieldOutcome[f][o] || 0) + 1;
    }
  }

  const patterns = [];
  const n = records.length;
  if (n === 0) {
    patterns.push("No measured optimizations yet — run optimize-en-pages --write, then pull GSC after windows elapse.");
  } else {
    patterns.push(
      `Measured ${n} page(s). Outcomes: ${JSON.stringify(byOutcome)}. Interpret with caution (seasonality, query mix).`
    );
    const hp = byBucket["high_potential"];
    if (hp && hp.total) {
      patterns.push(
        `high_potential bucket: ${hp.improved}/${hp.total} showed improved_* — ${
          hp.improved / hp.total >= 0.4 ? "description/meta work may be working" : "mixed; keep batches small"
        }.`
      );
    }
    const desc = byField["description"];
    if (desc && desc.total) {
      patterns.push(
        `description-only: ${desc.improved}/${desc.total} improved signals — ${
          desc.improved / desc.total < 0.25 ? "consider pairing with intro tests" : "reasonable early signal"
        }.`
      );
    }
  }

  const recommendations = [
    "Rollout: keep batches 5–10 pages; prioritize P1 high_potential from V112 until evidence accumulates.",
    "Re-measure after at least 14 days post-change for after14 window; ignore noisy 7d reads.",
    "If outcome is worse twice for the same bucket, pause that template and review title/meta alignment."
  ];

  return {
    updatedAt: new Date().toISOString(),
    source: "page-optimization-impact.json",
    sampleSize: n,
    aggregates: { byOutcome, byBucket, byBucketOutcome, byField, byFieldOutcome },
    patternsEffective: patterns.filter((p) => !p.includes("No measured")),
    patternsWeakOrRisky: patterns.filter((p) => p.includes("mixed") || p.includes("pause")),
    bucketResponseHints: byBucket,
    optimizationTypeHints: byField,
    recommendations,
    rolloutSafety: {
      maxBatchPages: 10,
      prioritizeBuckets: ["high_potential", "rising_pages"],
      note: "Do not scale rewrites until impact JSON shows repeatable improved_* for the same change type."
    }
  };
}

async function main() {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const siteUrl = process.env.GSC_SITE_URL ?? `${getBaseOrigin()}/`;

  const reg = loadRegistry();
  const entries = reg.entries || [];

  if (!clientEmail || !privateKey) {
    const stub = {
      updatedAt: new Date().toISOString(),
      error: "GSC credentials not configured",
      registryPath: REGISTRY_PATH,
      records: []
    };
    fs.mkdirSync(path.dirname(OUT_IMPACT), { recursive: true });
    fs.writeFileSync(OUT_IMPACT, JSON.stringify(stub, null, 2), "utf8");
    fs.writeFileSync(
      OUT_LESSONS,
      JSON.stringify(
        {
          updatedAt: stub.updatedAt,
          error: stub.error,
          patterns: ["Configure GSC env to measure before/after."],
          recommendations: []
        },
        null,
        2
      ),
      "utf8"
    );
    console.warn("[measure-page-optimization-impact] Missing GSC credentials — wrote stubs.");
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
  });
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const base = getBaseOrigin().replace(/\/$/, "");
  const records = [];

  for (const e of entries) {
    const slug = e.slug;
    if (!slug) continue;
    const urlA = `${base}/blog/${slug}`;
    const urlB = `${base}/blog/${slug}/`;

    const w = windowsForOptimization(e.optimizedAt);
    const before = await fetchWithUrlVariants(searchconsole, siteUrl, [urlA, urlB], w.before14.start, w.before14.end);
    const after7 = await fetchWithUrlVariants(searchconsole, siteUrl, [urlA, urlB], w.after7.start, w.after7.end);
    const after14 = await fetchWithUrlVariants(searchconsole, siteUrl, [urlA, urlB], w.after14.start, w.after14.end);

    const cls = classifyOutcome(before.metrics, after14.metrics);

    records.push({
      entryId: e.entryId,
      slug,
      path: e.path || `/blog/${slug}`,
      bucketAtOptimization: e.bucketAtOptimization ?? e.bucket,
      optimizedAt: e.optimizedAt,
      fieldsChanged: e.fieldsChanged || [],
      windows: {
        before14: { ...w.before14, metrics: before.metrics, matchedUrl: before.matchedUrl },
        after7: { ...w.after7, metrics: after7.metrics, matchedUrl: after7.matchedUrl },
        after14: { ...w.after14, metrics: after14.metrics, matchedUrl: after14.matchedUrl },
        daysAfterAvailable: w.daysAfterAvailable
      },
      deltas: {
        ctr: (after14.metrics.ctr ?? 0) - (before.metrics.ctr ?? 0),
        clicks: (after14.metrics.clicks ?? 0) - (before.metrics.clicks ?? 0),
        impressions: (after14.metrics.impressions ?? 0) - (before.metrics.impressions ?? 0),
        position: (after14.metrics.position ?? 0) - (before.metrics.position ?? 0)
      },
      classification: cls
    });
  }

  const lessons = buildLessons(records);

  const outImpact = {
    updatedAt: new Date().toISOString(),
    siteUrl,
    registryPath: REGISTRY_PATH,
    registryEntryCount: entries.length,
    measurementNote:
      "before14 = 14d ending day before optimization; after14 = up to 14d after optimization (capped to today). GSC lag ~2–3 days.",
    records
  };

  fs.mkdirSync(path.dirname(OUT_IMPACT), { recursive: true });
  fs.writeFileSync(OUT_IMPACT, JSON.stringify(outImpact, null, 2), "utf8");
  fs.writeFileSync(OUT_LESSONS, JSON.stringify(lessons, null, 2), "utf8");

  console.log(
    `[measure-page-optimization-impact] records=${records.length} → ${OUT_IMPACT} + ${OUT_LESSONS}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
