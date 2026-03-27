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

const crypto = require("crypto");
const { fetch, ProxyAgent } = require("undici");

const OUT_PERF = path.join(process.cwd(), "generated", "search-performance.json");
const OUT_REC = path.join(process.cwd(), "generated", "search-priority-recommendations.json");
const OUT_ERR = path.join(process.cwd(), "generated", "search-performance-error.json");

function loadEnvLocal() {
  try {
    const dotenv = require("dotenv");
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return {};
    const parsed = dotenv.parse(fs.readFileSync(envPath, "utf8"));
    return parsed || {};
  } catch {
    return {};
  }
}

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

function detectGscPropertyMode(siteUrl) {
  const s = String(siteUrl || "").trim();
  if (!s) return "invalid";
  if (s.startsWith("sc-url-prefix:")) return "invalid";
  if (s.startsWith("sc-domain:")) return "domain";
  if (/^https?:\/\/.+/i.test(s)) return "url-prefix";
  return "invalid";
}

/** Supports URL-prefix and sc-domain:* GSC properties. */
function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getProxyDispatcher() {
  // undici ProxyAgent only supports HTTP(S) proxy in this project.
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || "";
  if (!proxy) return undefined;
  if (proxy.startsWith("http://") || proxy.startsWith("https://")) {
    try {
      return new ProxyAgent(proxy);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function getGscAccessToken() {
  const env = loadEnvLocal();
  const clientEmail = env.GSC_CLIENT_EMAIL || process.env.GSC_CLIENT_EMAIL;
  const privateKey = (() => {
    const raw = env.GSC_PRIVATE_KEY || process.env.GSC_PRIVATE_KEY;
    if (!raw) return raw;
    let v = String(raw).trim();
    // Tolerate accidental JSON-like quoting/comma in env.
    v = v.replace(/^"+/, "").replace(/"+\s*,?$/, "");
    return v.replace(/\\n/g, "\n");
  })();
  const scope = "https://www.googleapis.com/auth/webmasters.readonly";
  const aud = "https://oauth2.googleapis.com/token";

  if (!clientEmail || !privateKey) {
    return { ok: false, error: "Missing GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY" };
  }

  const priv = crypto.createPrivateKey({ key: privateKey, format: "pem" });
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = { iss: clientEmail, scope, aud, iat, exp };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), priv);
  const jwt = `${signingInput}.${base64url(signature)}`;

  const dispatcher = getProxyDispatcher();
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        dispatcher
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { error: text };
      }

      if (!res.ok) {
        return { ok: false, error: `Token request failed: ${json?.error || res.status}`, details: json };
      }
      return { ok: true, accessToken: json.access_token };
    } catch (e) {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 700 * Math.pow(2, attempt)));
        continue;
      }
      return { ok: false, error: e?.message || "token fetch failed", details: { code: e?.code || null } };
    }
  }

  return { ok: false, error: "token fetch failed (unknown)" };
}

function originMatchesPageUrl(pageUrl, siteUrl) {
  try {
    // Search Analytics "page" dimension may be returned as a relative path like "/blog/slug".
    // In that case, treat it as belonging to the queried siteUrl property.
    if (typeof pageUrl === "string" && pageUrl.startsWith("/")) return true;

    // Some responses can return relative keys without a leading slash (rare).
    // Accept our known prefixes so later classification doesn't drop everything.
    if (
      typeof pageUrl === "string" &&
      !pageUrl.includes("://") &&
      (pageUrl.startsWith("blog/") ||
        pageUrl.startsWith("answers/") ||
        pageUrl.startsWith("en/how-to/") ||
        pageUrl.startsWith("tools/"))
    )
      return true;

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

async function fetchPageRows(accessToken, siteUrl, startDate, endDate, diagnostics) {
  const map = new Map();
  let startRow = 0;
  // Keep rowLimit moderate and cap pagination to reduce large responses
  // (proxy/network resets are common with very large payloads).
  const rowLimit = 2500;
  const maxStartRow = 10000; // cap at most 5 chunks

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isRetryable = (e) => {
    const code = String(e?.code || e?.cause?.code || "");
    const msg = String(e?.message || e?.cause?.message || "");
    return (
      code === "ECONNRESET" ||
      code === "ETIMEDOUT" ||
      code === "ECONNREFUSED" ||
      msg.includes("ECONNRESET") ||
      msg.includes("ETIMEDOUT")
    );
  };
  while (true) {
    if (startRow > maxStartRow) break;
    let res;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const dispatcher = getProxyDispatcher();
        const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
          siteUrl
        )}/searchAnalytics/query`;
        const dimensions = ["page"];
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
          body: JSON.stringify({
            startDate,
            endDate,
            dimensions,
            rowLimit,
            startRow,
            dataState: "all"
          }),
          dispatcher
        });
        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`GSC query failed: status=${resp.status} body=${t.slice(0, 200)}`);
        }
        const json = await resp.json();
        res = { data: json };
        if (startRow === 0 && diagnostics && diagnostics.enabled) {
          const firstRowCount = Array.isArray(json.rows) ? json.rows.length : 0;
          console.log(
            `[pull-search-performance][diag] mode=${diagnostics.mode} siteUrl=${siteUrl} dimensions=${dimensions.join(
              ","
            )} firstRowCount=${firstRowCount}`
          );
        }
        break;
      } catch (e) {
        if (attempt < 2 && isRetryable(e)) {
          await sleep(700 * Math.pow(2, attempt));
          continue;
        }
        throw e;
      }
    }
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
  const env = loadEnvLocal();
  const clientEmail = env.GSC_CLIENT_EMAIL || process.env.GSC_CLIENT_EMAIL;
  const privateKey = (() => {
    const raw = env.GSC_PRIVATE_KEY || process.env.GSC_PRIVATE_KEY;
    if (!raw) return raw;
    let v = String(raw).trim();
    v = v.replace(/^"+/, "").replace(/"+\s*,?$/, "");
    return v.replace(/\\n/g, "\n");
  })();
  const rawSiteUrl = env.GSC_SITE_URL ?? process.env.GSC_SITE_URL ?? `${getBaseOrigin()}/`;
  const siteUrl = String(rawSiteUrl).startsWith("sc-domain:")
    ? String(rawSiteUrl).replace(/\/+$/, "")
    : String(rawSiteUrl);
  const propertyMode = detectGscPropertyMode(siteUrl);
  if (propertyMode === "invalid") {
    const bad = {
      updatedAt: new Date().toISOString(),
      error:
        "Invalid GSC_SITE_URL. Use either sc-domain:example.com or literal URL-prefix like https://www.example.com/. Do NOT use sc-url-prefix:...",
      code: "GSC_SITE_URL_INVALID",
      siteUrl,
      pages: [],
      buckets: {}
    };
    ensureDir(OUT_PERF);
    fs.writeFileSync(OUT_PERF, JSON.stringify(bad, null, 2), "utf8");
    fs.writeFileSync(
      OUT_REC,
      JSON.stringify(
        {
          updatedAt: bad.updatedAt,
          error: bad.error,
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
    console.error(`[pull-search-performance] ${bad.error}`);
    return;
  }

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

  const tokenRes = await getGscAccessToken();
  if (!tokenRes.ok) {
    const stub = {
      updatedAt: new Date().toISOString(),
      error: tokenRes.error,
      code: "GSC_TOKEN_ERROR",
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
    return;
  }
  const accessToken = tokenRes.accessToken;

  const end = new Date();
  const mid = new Date();
  mid.setDate(mid.getDate() - 14);
  const start = new Date();
  start.setDate(start.getDate() - 28);

  const lastStart = isoDate(mid);
  const lastEnd = isoDate(end);
  const prevStart = isoDate(start);
  const prevEnd = isoDate(new Date(mid.getTime() - 86400000));

  // Run windows sequentially to reduce concurrent token/query pressure on proxy.
  const diagnostics = { enabled: true, mode: propertyMode };
  console.log(`[pull-search-performance][diag] mode=${propertyMode} siteUrl=${siteUrl} dimensions=page`);
  const mapLast = await fetchPageRows(accessToken, siteUrl, lastStart, lastEnd, diagnostics);
  const mapPrev = await fetchPageRows(accessToken, siteUrl, prevStart, prevEnd, diagnostics);

  const allUrls = new Set([...mapLast.keys(), ...mapPrev.keys()]);
  const pages = [];
  const rawPageKeysSample = Array.from(allUrls).slice(0, 50);
  const platformImp = { tiktok: 0, youtube: 0, instagram: 0 };
  const weakClusters = new Map();

  for (const pageUrl of allUrls) {
    let pathname;
    try {
      const u = new URL(pageUrl);
      if (!originMatchesPageUrl(pageUrl, siteUrl)) continue;
      pathname = u.pathname;
    } catch {
      // If pageUrl is relative (e.g. "/blog/slug"), classifyPath can still work.
      if (typeof pageUrl === "string") {
        if (pageUrl.startsWith("/")) {
          if (!originMatchesPageUrl(pageUrl, siteUrl)) continue;
          pathname = pageUrl;
        } else if (
          pageUrl.startsWith("blog/") ||
          pageUrl.startsWith("answers/") ||
          pageUrl.startsWith("en/how-to/") ||
          pageUrl.startsWith("tools/")
        ) {
          pathname = `/${pageUrl}`;
        } else {
          continue;
        }
      } else {
        continue;
      }
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

  // If request succeeded but we still ended up with zero pages, write debug info.
  if (pages.length === 0 && rawPageKeysSample.length) {
    const classifySamples = rawPageKeysSample.slice(0, 20).map((k) => {
      let pathname = null;
      try {
        pathname = new URL(k).pathname;
      } catch {
        if (typeof k === "string") {
          if (k.startsWith("/")) pathname = k;
          else if (
            k.startsWith("blog/") ||
            k.startsWith("answers/") ||
            k.startsWith("en/how-to/") ||
            k.startsWith("tools/")
          )
            pathname = `/${k}`;
        }
      }
      return { key: k, pathname, classifyPath: pathname ? classifyPath(pathname) : null };
    });

    try {
      fs.writeFileSync(
        path.join(process.cwd(), "generated", "search-performance-debug.json"),
        JSON.stringify(
          {
            updatedAt: new Date().toISOString(),
            siteUrl,
            pageKeysSampleCount: rawPageKeysSample.length,
            pageKeysSample: rawPageKeysSample,
            classifySamples,
            note: "pages=0 but request succeeded; inspect key formats and classification."
          },
          null,
          2
        ),
        "utf8"
      );
    } catch {
      // ignore debug write failures
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

  const isScDomain = String(rawSiteUrl || "").startsWith("sc-domain:");
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
  // sc-domain properties do not return "page" dimension rows (API returns 0 rows for dimensions=["page"]).
  // In that case, we add a clear error hint for operators.
  if (isScDomain && pages.length === 0) {
    outPerf.error =
      "Search Analytics for sc-domain:* returned 0 rows for dimensions=['page']. " +
      "Create/use an sc-url-prefix property for https://www.tooleagle.com/ and set GSC_SITE_URL accordingly.";
  }
  if (pages.length === 0) {
    console.warn(
      "[pull-search-performance] No page-level rows returned. Check whether this property is a URL-prefix property with page data available."
    );
  }
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
  try {
    ensureDir(OUT_ERR);
    fs.writeFileSync(
      OUT_ERR,
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          error: String(e?.message || e),
          code: e?.code || null,
          siteUrl: process.env.GSC_SITE_URL || null,
          note: "search:performance failed before writing fresh output; check network/proxy/credentials."
        },
        null,
        2
      ),
      "utf8"
    );
  } catch {
    // ignore secondary failure on error logging
  }
  console.error("[pull-search-performance]", e);
  process.exit(1);
});
