#!/usr/bin/env node
/**
 * V180 + V180.1 — Revenue attribution (exact / inferred / fallback), funnel, paywall friction, A/B defs, dashboard, paywall runtime + log.
 * Depends on: generated/v180-payment-db-snapshot.json (from build-v180-payment-snapshot.ts),
 * tool-conversion-map, optional v179-revenue-dashboard, tool event jsonl.
 * Blog MDX trust strip when V177_AUTO_EXECUTION=1 and not --dry-run.
 * CLI: --dry-run
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = process.cwd();
const mdxSafety = require(path.join(ROOT, "scripts", "lib", "mdx-safety.js"));

const V178_CORE = [
  "tiktok-caption-generator",
  "hashtag-generator",
  "hook-generator",
  "title-generator"
];

const PATHS = {
  paymentSnap: path.join(ROOT, "generated", "v180-payment-db-snapshot.json"),
  v179Dash: path.join(ROOT, "generated", "v179-revenue-dashboard.json"),
  toolConv: path.join(ROOT, "generated", "tool-conversion-map.json"),
  dataFreshness: path.join(ROOT, "generated", "data-freshness.json"),
  toolClickJsonl: path.join(ROOT, "generated", "tool-click-events.jsonl"),
  toolOutputJsonl: path.join(ROOT, "generated", "tool-output-actions.jsonl"),
  blogDir: path.join(ROOT, "content", "blog"),
  outAttr: path.join(ROOT, "generated", "v180-revenue-attribution.json"),
  outFunnel: path.join(ROOT, "generated", "v180-revenue-funnel.json"),
  outFriction: path.join(ROOT, "generated", "v180-paywall-friction-report.json"),
  outAb: path.join(ROOT, "generated", "v180-paywall-ab-test.json"),
  outDash: path.join(ROOT, "generated", "v180-revenue-dashboard.json"),
  outRuntime: path.join(ROOT, "generated", "v180-paywall-runtime.json"),
  outPrecise: path.join(ROOT, "generated", "v180-precise-paths.json"),
  paywallLog: path.join(ROOT, "generated", "v180-paywall-optimization-log.jsonl")
};

const BLOG_TRUST_HEADING = "## Trust & billing (auto)";

function parseArgs() {
  return { dryRun: process.argv.includes("--dry-run") };
}

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function appendPaywallLog(row) {
  fs.mkdirSync(path.dirname(PATHS.paywallLog), { recursive: true });
  fs.appendFileSync(PATHS.paywallLog, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n", "utf8");
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

function countJsonlTypes(fp, typeSet) {
  const counts = {};
  for (const t of typeSet) counts[t] = 0;
  if (!fs.existsSync(fp)) return counts;
  for (const line of fs.readFileSync(fp, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      const t = String(o.type || o.event_type || "");
      if (counts[t] !== undefined) counts[t] += 1;
    } catch {
      /* ignore */
    }
  }
  return counts;
}

function upgradeClicksByTool() {
  const byTool = {};
  if (!fs.existsSync(PATHS.toolClickJsonl)) return byTool;
  for (const line of fs.readFileSync(PATHS.toolClickJsonl, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      if (String(o.type) !== "upgrade_clicked" && String(o.event_type) !== "upgrade_clicked") continue;
      const slug = o.tool_slug || o.toolSlug;
      if (!slug) continue;
      byTool[slug] = (byTool[slug] || 0) + 1;
    } catch {
      /* ignore */
    }
  }
  return byTool;
}

function normalizePath(input) {
  if (!input || typeof input !== "string") return "/";
  const trimmed = input.trim();
  if (!trimmed) return "/";
  try {
    const u = trimmed.startsWith("http") ? new URL(trimmed) : new URL(trimmed, "https://placeholder.local");
    let p = u.pathname || "/";
    if (!p.startsWith("/")) p = `/${p}`;
    const collapsed = p.replace(/\/+/g, "/");
    if (collapsed.length > 1 && collapsed.endsWith("/")) return collapsed.slice(0, -1) || "/";
    return collapsed || "/";
  } catch {
    if (!trimmed.startsWith("/")) return `/${trimmed}`.replace(/\/+/g, "/");
    return trimmed.replace(/\/+/g, "/");
  }
}

function parseReturnPathFromPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const u = payload.return_url || payload.returnUrl;
  if (typeof u !== "string") return null;
  try {
    const x = new URL(u, "https://placeholder.local");
    return x.pathname || null;
  } catch {
    return null;
  }
}

function inferPageTypeFromPath(p) {
  if (!p || p === "/") return "home";
  if (p.startsWith("/zh/pricing") || p === "/pricing" || p.startsWith("/pricing")) return "pricing";
  if (p.startsWith("/zh/tools/") || p.startsWith("/tools/")) return "tool";
  if (p.startsWith("/blog/") || p.startsWith("/zh/blog/")) return "blog";
  if (p.startsWith("/answers/")) return "answer";
  return "other";
}

function inferToolSlugFromPath(p) {
  const m = String(p).match(/^\/(?:zh\/)?tools\/([^/]+)/);
  return m ? m[1] : null;
}

/**
 * Mirrors src/lib/payment/order-attribution.ts extractV180AttributionFromProviderPayload.
 */
function extractAttributionFromOrder(o) {
  const p = (o.provider_payload && typeof o.provider_payload === "object" ? o.provider_payload : {}) || {};
  const fallback = {
    order_id: o.order_id,
    market: String(o.market || "unknown"),
    plan: String(o.plan || o.package_id || "unknown"),
    anonymous_or_user: o.user_id ? "user" : o.anonymous_user_id ? "anonymous" : "unknown"
  };

  if (typeof p.source_path === "string" && p.source_path.trim()) {
    const sourcePath = normalizePath(p.source_path);
    const pageType = typeof p.page_type === "string" ? p.page_type : inferPageTypeFromPath(sourcePath);
    let toolSlug;
    if (typeof p.tool_slug === "string") toolSlug = p.tool_slug;
    else if (p.tool_slug === null) toolSlug = null;
    else toolSlug = inferToolSlugFromPath(sourcePath);
    const conf = p.attribution_confidence || "exact";
    const src = p.attribution_source || "order_payload";
    const sourceType = typeof p.source_type === "string" ? p.source_type : "unknown";
    return {
      source_path: sourcePath,
      source_type: sourceType,
      page_type: pageType,
      tool_slug: toolSlug,
      referrer_path: typeof p.referrer_path === "string" ? p.referrer_path : null,
      market: typeof p.market === "string" ? p.market : fallback.market,
      plan: typeof p.plan === "string" ? p.plan : fallback.plan,
      anonymous_or_user: typeof p.anonymous_or_user === "string" ? p.anonymous_or_user : fallback.anonymous_or_user,
      attribution_confidence: conf,
      attribution_source: src,
      attribution_key: {
        order_id: fallback.order_id,
        source_path: sourcePath,
        tool_slug: toolSlug,
        page_type: pageType
      }
    };
  }

  const fromReturn = parseReturnPathFromPayload(p);
  if (fromReturn && fromReturn !== "/") {
    const sourcePath = normalizePath(fromReturn);
    return {
      source_path: sourcePath,
      source_type: "legacy_return_url",
      page_type: inferPageTypeFromPath(sourcePath),
      tool_slug: inferToolSlugFromPath(sourcePath),
      referrer_path: null,
      market: fallback.market,
      plan: fallback.plan,
      anonymous_or_user: fallback.anonymous_or_user,
      attribution_confidence: "inferred",
      attribution_source: "return_url",
      attribution_key: {
        order_id: fallback.order_id,
        source_path: sourcePath,
        tool_slug: inferToolSlugFromPath(sourcePath),
        page_type: inferPageTypeFromPath(sourcePath)
      }
    };
  }

  const defaultPath = fallback.market === "cn" ? "/zh/pricing" : "/pricing";
  return {
    source_path: defaultPath,
    source_type: "unknown",
    page_type: "pricing",
    tool_slug: null,
    referrer_path: null,
    market: fallback.market,
    plan: fallback.plan,
    anonymous_or_user: fallback.anonymous_or_user,
    attribution_confidence: "fallback",
    attribution_source: "return_url",
    attribution_key: {
      order_id: fallback.order_id,
      source_path: defaultPath,
      tool_slug: null,
      page_type: "pricing"
    }
  };
}

function baseRecordFromOrder(o, att, eventType, extra) {
  return {
    event_type: eventType,
    order_id: o.order_id,
    source_path: att.source_path,
    page_type: att.page_type,
    tool_slug: att.tool_slug,
    referrer_path: att.referrer_path,
    source_type: att.source_type,
    market: att.market,
    plan: att.plan,
    anonymous_or_user: att.anonymous_or_user,
    attribution_confidence: att.attribution_confidence,
    attribution_source: att.attribution_source,
    attribution_key: att.attribution_key,
    ...extra
  };
}

function main() {
  const { dryRun } = parseArgs();
  const builtAt = new Date().toISOString();
  const applyMdx = process.env.V177_AUTO_EXECUTION === "1" && !dryRun;

  const snap = readJson(PATHS.paymentSnap) || { ok: false, orders: [], payment_events: [] };
  const orders = Array.isArray(snap.orders) ? snap.orders : [];
  const payEv = Array.isArray(snap.payment_events) ? snap.payment_events : [];
  const toolConv = readJson(PATHS.toolConv) || {};
  const v179d = readJson(PATHS.v179Dash) || {};
  const freshness = readJson(PATHS.dataFreshness) || {};

  const funnelTypes = countJsonlTypes(PATHS.toolOutputJsonl, [
    "output_copy",
    "generation_complete",
    "publish_redirect_click"
  ]);
  const toolEntries = countJsonlTypes(PATHS.toolClickJsonl, ["tool_entry"]);
  const upgradeByTool = upgradeClicksByTool();
  const v179UpgradeTotal =
    typeof v179d.upgrade_click_total === "number" ? v179d.upgrade_click_total : Object.values(upgradeByTool).reduce((a, b) => a + b, 0);

  const createOrderTotal = orders.length;
  const paymentSuccessTotal = orders.filter((o) => o.status === "paid" || o.paid_at).length;
  const activationTotal = orders.filter((o) => o.status === "paid" && o.order_type === "credits").length;

  const attributionRecords = [];

  for (const o of orders) {
    const att = extractAttributionFromOrder(o);

    attributionRecords.push(
      baseRecordFromOrder(o, att, "payment_create_order", {
        attributed_stage: "create_order",
        created_at: o.created_at
      })
    );

    if (o.status === "paid" || o.paid_at) {
      const cbAtt = { ...att, attribution_source: "callback_payload", source_type: "payment_webhook" };
      attributionRecords.push(
        baseRecordFromOrder(o, cbAtt, "payment_callback_success", {
          attributed_stage: "payment_success",
          page: "/api/payment/callback",
          page_type_api: "api",
          paid_at: o.paid_at
        })
      );
      if (o.order_type === "credits") {
        const actAtt = { ...att, source_type: "entitlement" };
        attributionRecords.push(
          baseRecordFromOrder(o, actAtt, "membership_activated", {
            attributed_stage: "membership_active",
            page: att.source_path
          })
        );
      }
    }
  }

  for (const [slug, n] of Object.entries(upgradeByTool)) {
    attributionRecords.push({
      event_type: "upgrade_click",
      page: `/tools/${slug}`,
      page_type: "tool",
      tool_slug: slug,
      source_path: `/tools/${slug}`,
      source_type: "tool",
      market: "global",
      plan: "n/a",
      anonymous_or_user: "unknown",
      attribution_confidence: "inferred",
      attribution_source: "page_inference",
      attributed_stage: "upgrade_intent",
      event_count: n,
      note: "aggregated_from_tool_click_jsonl"
    });
  }

  const revenueByPageExact = {};
  const revenueByPageInferred = {};
  const revenueByToolExact = {};
  const revenueByToolInferred = {};
  const revenueByPageTypeExact = {};
  const revenueByPageTypeInferred = {};

  for (const o of orders) {
    if (o.status !== "paid" && !o.paid_at) continue;
    const att = extractAttributionFromOrder(o);
    const p = att.source_path || "unknown";
    const pt = att.page_type || "other";
    const isExact = att.attribution_confidence === "exact";
    if (isExact) {
      revenueByPageExact[p] = (revenueByPageExact[p] || 0) + 1;
      revenueByPageTypeExact[pt] = (revenueByPageTypeExact[pt] || 0) + 1;
      if (att.tool_slug) revenueByToolExact[att.tool_slug] = (revenueByToolExact[att.tool_slug] || 0) + 1;
    } else {
      revenueByPageInferred[p] = (revenueByPageInferred[p] || 0) + 1;
      revenueByPageTypeInferred[pt] = (revenueByPageTypeInferred[pt] || 0) + 1;
      if (att.tool_slug) revenueByToolInferred[att.tool_slug] = (revenueByToolInferred[att.tool_slug] || 0) + 1;
    }
  }

  const topPaidPathsExact = Object.entries(revenueByPageExact)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, n]) => ({ path, conversions: n, attribution_confidence: "exact" }));

  const topPaidPathsInferred = Object.entries(revenueByPageInferred)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, n]) => ({ path, conversions: n, attribution_confidence: "inferred_or_fallback" }));

  const funnelOverall = {
    visit: null,
    tool_click: toolEntries.tool_entry || 0,
    generation_complete: funnelTypes.generation_complete || 0,
    copy: funnelTypes.output_copy || 0,
    publish_redirect_click: funnelTypes.publish_redirect_click || 0,
    upgrade_click: v179UpgradeTotal,
    create_order: createOrderTotal,
    payment_success: paymentSuccessTotal,
    membership_active: activationTotal
  };

  const byToolFunnel = {};
  for (const slug of new Set([...Object.keys(upgradeByTool), ...Object.keys(revenueByToolExact), ...Object.keys(revenueByToolInferred), ...V178_CORE])) {
    byToolFunnel[slug] = {
      upgrade_click: upgradeByTool[slug] || 0,
      payment_success_exact: revenueByToolExact[slug] || 0,
      payment_success_inferred: revenueByToolInferred[slug] || 0,
      create_order_exact: orders.filter((o) => {
        const a = extractAttributionFromOrder(o);
        return a.attribution_confidence === "exact" && (a.source_path || "").includes(`/tools/${slug}`);
      }).length
    };
  }

  const highClickLowPayment = [];
  for (const slug of Object.keys(byToolFunnel)) {
    const row = byToolFunnel[slug];
    if (row.upgrade_click >= 2 && row.payment_success_exact === 0 && row.create_order_exact === 0) {
      highClickLowPayment.push({
        path: `/tools/${slug}`,
        tool_slug: slug,
        upgrade_click: row.upgrade_click,
        create_order_exact: row.create_order_exact,
        payment_success_exact: row.payment_success_exact,
        friction_score: row.upgrade_click,
        attribution_scope: "exact_only"
      });
    }
  }
  highClickLowPayment.sort((a, b) => b.friction_score - a.friction_score);

  const frictionReport = {
    version: "180.1",
    builtAt,
    criteria: "upgrade_click>=2 and zero exact-attributed paid orders and zero exact create_order for that tool slug",
    paths: highClickLowPayment.slice(0, 40),
    non_exact_mixing: "disallowed_for_top_paths",
    note: "Top paid paths and this friction list use exact client/order_payload attribution only; inferred and fallback are reported separately."
  };

  const paywallAb = {
    version: "180.1",
    builtAt,
    tests: [
      ...V178_CORE.map((slug) => ({
        target_type: "core_tool",
        target_id: slug,
        axis: "upgrade_cta_copy",
        variant_a: { upgrade_label: "Upgrade for higher limits →" },
        variant_b: { upgrade_label: "Unlock plans & remove limits →" }
      })),
      ...highClickLowPayment.slice(0, 12).map((x) => ({
        target_type: "high_click_low_payment_tool",
        target_id: x.tool_slug,
        axis: "trust_block",
        variant_a: { trust: "compact" },
        variant_b: { trust: "full" }
      })),
      {
        target_type: "pricing_guidance",
        target_id: "global",
        axis: "pricing_copy",
        variant_a: { line: "Compare plans on the pricing page." },
        variant_b: { line: "See transparent pricing — cancel anytime." }
      }
    ]
  };

  function pickVariant(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
    return h % 2 === 0 ? "a" : "b";
  }

  const runtimeTools = {};
  for (const slug of V178_CORE) {
    runtimeTools[slug] = {
      trust_block: "compact",
      workflow_upgrade_hidden: false,
      paywall_ab: pickVariant(`v180-core-${slug}`)
    };
  }
  for (const row of highClickLowPayment.slice(0, 24)) {
    const slug = row.tool_slug;
    runtimeTools[slug] = {
      ...(runtimeTools[slug] || {}),
      trust_block: "full",
      workflow_upgrade_hidden: true,
      paywall_ab: pickVariant(`v180-fr-${slug}`)
    };
  }

  const runtime = {
    version: "180.1",
    builtAt,
    dry_run: dryRun,
    tools: runtimeTools
  };

  const clickToOrder =
    funnelOverall.upgrade_click > 0 ? funnelOverall.create_order / funnelOverall.upgrade_click : null;
  const orderToSuccess =
    funnelOverall.create_order > 0 ? funnelOverall.payment_success / funnelOverall.create_order : null;
  const successToActivation =
    funnelOverall.payment_success > 0 ? funnelOverall.membership_active / funnelOverall.payment_success : null;

  const unattributedOrders = orders
    .filter((o) => extractAttributionFromOrder(o).attribution_confidence === "fallback")
    .map((o) => ({
      order_id: o.order_id,
      status: o.status,
      market: o.market,
      reason: "no_source_path_and_no_return_url"
    }));

  const inferredOnlyPaths = Object.entries(revenueByPageInferred)
    .filter(([path]) => !revenueByPageExact[path])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([path, n]) => ({ path, paid_conversions: n, attribution_confidence: "inferred_or_fallback" }));

  const precisePathsDoc = {
    version: "180.1",
    builtAt,
    top_paid_tools_exact: Object.entries(revenueByToolExact)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([tool_slug, n]) => ({ tool_slug, paid_conversions: n })),
    top_paid_pages_exact: topPaidPathsExact,
    top_paid_paths_exact: topPaidPathsExact,
    inferred_only_paths: inferredOnlyPaths,
    unattributed_orders: unattributedOrders.slice(0, 500)
  };

  const dashboard = {
    version: "180.1",
    builtAt,
    upgrade_click_total: funnelOverall.upgrade_click,
    create_order_total: funnelOverall.create_order,
    payment_success_total: funnelOverall.payment_success,
    activation_total: funnelOverall.membership_active,
    click_to_order_rate: clickToOrder,
    order_to_success_rate: orderToSuccess,
    success_to_activation_rate: successToActivation,
    revenue_by_page_exact: revenueByPageExact,
    revenue_by_page_inferred: revenueByPageInferred,
    revenue_by_tool_exact: revenueByToolExact,
    revenue_by_tool_inferred: revenueByToolInferred,
    revenue_by_page_type_exact: revenueByPageTypeExact,
    revenue_by_page_type_inferred: revenueByPageTypeInferred,
    top_paid_paths_exact: topPaidPathsExact,
    top_paid_paths_inferred_separate: topPaidPathsInferred,
    high_click_low_payment_paths: highClickLowPayment.slice(0, 24),
    stale_revenue_data: Boolean(freshness.stale_data) || snap.ok === false,
    payment_snapshot_ok: snap.ok === true,
    precise_paths_artifact: "generated/v180-precise-paths.json"
  };

  const attributionDoc = {
    version: "180.1",
    builtAt,
    records: attributionRecords.slice(0, 8000),
    record_count: attributionRecords.length,
    truncated: attributionRecords.length > 8000,
    rollup: {
      by_event_type: attributionRecords.reduce((m, r) => {
        m[r.event_type] = (m[r.event_type] || 0) + 1;
        return m;
      }, {}),
      by_attribution_confidence: attributionRecords.reduce((m, r) => {
        const c = r.attribution_confidence || "unknown";
        m[c] = (m[c] || 0) + 1;
        return m;
      }, {})
    }
  };

  const funnelDoc = {
    version: "180.1",
    builtAt,
    stages: [
      "visit",
      "tool_click",
      "generation_complete",
      "copy",
      "publish_redirect_click",
      "upgrade_click",
      "create_order",
      "payment_success",
      "membership_active"
    ],
    overall: funnelOverall,
    attribution_split: {
      exact_paid_conversions: Object.values(revenueByPageExact).reduce((a, b) => a + b, 0),
      inferred_or_fallback_paid_conversions: Object.values(revenueByPageInferred).reduce((a, b) => a + b, 0)
    },
    by_page_type: {
      tool: {
        upgrade_click: funnelOverall.upgrade_click,
        create_order_exact: orders.filter((o) => extractAttributionFromOrder(o).attribution_confidence === "exact" && extractAttributionFromOrder(o).page_type === "tool").length
      },
      pricing: {
        create_order_exact: orders.filter((o) => {
          const a = extractAttributionFromOrder(o);
          return a.attribution_confidence === "exact" && (a.source_path || "").includes("pricing");
        }).length
      }
    },
    by_tool: byToolFunnel,
    by_path_exact: revenueByPageExact,
    by_path_inferred: revenueByPageInferred
  };

  fs.mkdirSync(path.dirname(PATHS.outAttr), { recursive: true });
  fs.writeFileSync(PATHS.outAttr, JSON.stringify(attributionDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outFunnel, JSON.stringify(funnelDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outFriction, JSON.stringify(frictionReport, null, 2), "utf8");
  fs.writeFileSync(PATHS.outAb, JSON.stringify(paywallAb, null, 2), "utf8");
  fs.writeFileSync(PATHS.outDash, JSON.stringify(dashboard, null, 2), "utf8");
  fs.writeFileSync(PATHS.outRuntime, JSON.stringify(runtime, null, 2), "utf8");
  fs.writeFileSync(PATHS.outPrecise, JSON.stringify(precisePathsDoc, null, 2), "utf8");

  appendPaywallLog({
    kind: "v180_artifacts_written",
    page_type: "system",
    action_type: "paywall_optimization",
    dry_run: dryRun,
    version: "180.1"
  });

  for (const slug of Object.keys(runtimeTools)) {
    appendPaywallLog({
      kind: "v180_paywall_runtime_row",
      page_type: "tool",
      action_type: "paywall_optimization",
      tool_slug: slug,
      trust_block: runtimeTools[slug].trust_block,
      workflow_upgrade_hidden: runtimeTools[slug].workflow_upgrade_hidden
    });
  }

  const trustMd =
    "Secure checkout via our payment partners. Review [ToolEagle pricing](/pricing) before you buy — no surprise charges.";

  let mdxTouched = 0;
  if (applyMdx && highClickLowPayment.length > 0) {
    const slugSet = new Set(highClickLowPayment.slice(0, 15).map((x) => x.tool_slug));
    for (const slug of slugSet) {
      const metaPath = path.join(ROOT, "content", "blog");
      if (!fs.existsSync(metaPath)) continue;
      const files = fs.readdirSync(metaPath).filter((f) => f.endsWith(".mdx"));
      let hit = 0;
      for (const f of files) {
        if (hit >= 6) break;
        const fp = path.join(metaPath, f);
        const raw = fs.readFileSync(fp, "utf8");
        if (!raw.includes(`/tools/${slug}`)) continue;
        const blogSlug = f.replace(/\.mdx$/, "");
        const parsed = matter(raw);
        const fm = { ...(parsed.data || {}) };
        if (fm.v180_trust_at || String(parsed.content || "").includes(BLOG_TRUST_HEADING)) continue;
        const body = upsertBeforeSummary(String(parsed.content || ""), BLOG_TRUST_HEADING, trustMd);
        const out = matter.stringify(body, { ...fm, v180_trust_at: builtAt });
        const res = mdxSafety.sanitizeAndValidateMdxForWrite({
          mdxString: out,
          filePath: fp,
          slug: blogSlug,
          failureKind: "v180_trust_strip"
        });
        if (res.ok) {
          fs.writeFileSync(fp, res.sanitizedMdx, "utf8");
          mdxTouched++;
          hit++;
          appendPaywallLog({
            kind: "v180_blog_trust_applied",
            page_type: "blog",
            action_type: "paywall_optimization",
            slug: blogSlug,
            linked_tool: slug
          });
        }
      }
    }
  } else {
    appendPaywallLog({
      kind: "v180_blog_trust_skipped",
      reason: applyMdx ? "no_friction_targets" : "need_V177_AUTO_EXECUTION_and_not_dry_run",
      dry_run: dryRun
    });
  }

  console.log(
    `[run-v180-revenue-attribution] v180.1 records=${attributionDoc.record_count} friction=${frictionReport.paths.length} runtime_tools=${Object.keys(runtimeTools).length} mdx_touched=${mdxTouched} dryRun=${dryRun}`
  );
}

main();
