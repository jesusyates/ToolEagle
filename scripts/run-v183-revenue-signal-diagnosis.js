#!/usr/bin/env node
/**
 * V183 — Revenue signal activation diagnosis (exact revenue empty root cause).
 *
 * Outputs:
 * - generated/v183-revenue-signal-diagnosis.json
 * - generated/v183-signal-freshness-audit.json
 * - generated/v183-exact-revenue-sample.json
 * - generated/v183-v182-activation-threshold.json
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const PATHS = {
  outDiagnosis: path.join(ROOT, "generated", "v183-revenue-signal-diagnosis.json"),
  outFreshnessAudit: path.join(ROOT, "generated", "v183-signal-freshness-audit.json"),
  outExactSample: path.join(ROOT, "generated", "v183-exact-revenue-sample.json"),
  outActivationThreshold: path.join(ROOT, "generated", "v183-v182-activation-threshold.json"),
  v180Attr: path.join(ROOT, "generated", "v180-revenue-attribution.json"),
  paymentSnap: path.join(ROOT, "generated", "v180-payment-db-snapshot.json"),
  dataFreshness: path.join(ROOT, "generated", "data-freshness.json"),
  searchPerf: path.join(ROOT, "generated", "search-performance.json"),
  toolConvMap: path.join(ROOT, "generated", "tool-conversion-map.json")
};

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function safeReadEnvBool(name) {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

function toIsoOrNull(x) {
  if (typeof x !== "string" || !x.trim()) return null;
  const d = new Date(x);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

function ageHours(isoString) {
  if (!isoString) return null;
  const t = new Date(isoString).getTime();
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / 3600000;
}

function pickLatestIso(arr, field) {
  let best = null;
  for (const x of arr || []) {
    const iso = toIsoOrNull(x?.[field]);
    if (!iso) continue;
    if (!best) best = iso;
    else if (new Date(iso).getTime() > new Date(best).getTime()) best = iso;
  }
  return best;
}

function main() {
  const builtAt = new Date().toISOString();

  const v180 = safeReadJson(PATHS.v180Attr) || {};
  const snap = safeReadJson(PATHS.paymentSnap) || {};
  const freshness = safeReadJson(PATHS.dataFreshness) || {};
  const searchPerf = safeReadJson(PATHS.searchPerf) || {};
  const toolConvMap = safeReadJson(PATHS.toolConvMap) || {};

  const attributionRecords = Array.isArray(v180.records) ? v180.records : [];
  const ordersFound = Array.isArray(snap.orders) ? snap.orders.length : 0;
  const paymentEventsFound = Array.isArray(snap.payment_events) ? snap.payment_events.length : 0;

  const chainBreak = {
    upgrade_click: 0,
    create_order: 0,
    payment_callback_success: 0,
    membership_activated: 0
  };

  for (const r of attributionRecords) {
    const et = String(r.event_type || "");
    if (et === "upgrade_click") chainBreak.upgrade_click++;
    if (et === "payment_create_order") chainBreak.create_order++;
    if (et === "payment_callback_success") chainBreak.payment_callback_success++;
    if (et === "membership_activated") chainBreak.membership_activated++;
  }

  const exact = attributionRecords.filter((r) => String(r.attribution_confidence) === "exact");
  const inferred = attributionRecords.filter((r) => String(r.attribution_confidence) === "inferred");
  const unattributed = attributionRecords.filter((r) => String(r.attribution_confidence) === "fallback");

  // "Exact revenue" in our allocation pipeline is tool/page revenue derived from paid & exact-attributed signals.
  // Since v180 output here contains only create_order records (all fallback + tool_slug=null), exact is empty.
  const exactOrders = exact.filter((r) => r.event_type === "payment_callback_success" || r.event_type === "membership_activated");
  const exactOrderIds = exactOrders.map((r) => r.order_id).filter(Boolean);

  const exactAttributionRecords = exact.map((r) => ({
    order_id: r.order_id,
    source_path: r.source_path,
    page_type: r.page_type,
    tool_slug: r.tool_slug,
    market: r.market,
    plan: r.plan,
    payment_stage: r.attributed_stage || r.event_type
  }));

  const inferredOnlyOrders = inferred.map((r) => r.order_id).filter(Boolean);
  const unattributedOrderIds = unattributed.map((r) => r.order_id).filter(Boolean);

  // Snapshot validation (step 3 requirement).
  const credentialsOk = safeReadEnvBool("NEXT_PUBLIC_SUPABASE_URL") && safeReadEnvBool("SUPABASE_SERVICE_ROLE_KEY");
  const snapshotOk = Boolean(snap?.ok);

  const latestOrderAt = pickLatestIso(snap.orders || [], "created_at");
  const latestPaymentEventAt = pickLatestIso(snap.payment_events || [], "created_at");

  let missingServiceRoleReason = null;
  if (!credentialsOk) {
    missingServiceRoleReason = !safeReadEnvBool("SUPABASE_SERVICE_ROLE_KEY")
      ? "SUPABASE_SERVICE_ROLE_KEY not set in environment (needed to read orders + payment_events)."
      : "NEXT_PUBLIC_SUPABASE_URL not set in environment.";
  }

  const paymentSnapshotStatus = {
    snapshot_ok: Boolean(snapshotOk),
    credentials_ok: Boolean(credentialsOk),
    missing_service_role_key_reason: missingServiceRoleReason,
    orders_row_count: ordersFound,
    payment_events_row_count: paymentEventsFound,
    latest_order_at: latestOrderAt,
    latest_payment_event_at: latestPaymentEventAt,
    payment_events_error: snap?.payment_events_error || null,
    orders_error: snap?.orders_error || null
  };

  // Staleness audit (step 2 requirement: must say which dataset stale).
  const staleData = Boolean(freshness?.stale_data);
  const staleReaso = Array.isArray(freshness?.stale_reasons) ? freshness.stale_reasons : [];
  const thresholdHours = Number.isFinite(Number(freshness?.threshold_hours)) ? Number(freshness.threshold_hours) : 48;

  const searchPerfUpdatedAt = toIsoOrNull(searchPerf?.updatedAt);
  const toolConvUpdatedAt = toIsoOrNull(toolConvMap?.updatedAt || toolConvMap?.builtAt);
  const paymentSnapBuiltAt = toIsoOrNull(snap?.builtAt);
  const dataFreshnessUpdatedAt = toIsoOrNull(freshness?.updatedAt);

  const freshnessAudit = {
    version: "183.1",
    builtAt,
    stale_data: staleData,
    stale_reasons: staleReaso,
    stale_sources: {
      "data_freshness.json": {
        updatedAt: dataFreshnessUpdatedAt,
        staleness_applied: staleData,
        reason: staleReaso
      },
      "search_performance.json": {
        updatedAt: searchPerfUpdatedAt,
        age_hours: ageHours(searchPerfUpdatedAt),
        error: searchPerf?.error || null,
        data_empty: searchPerf?.gsc?.data_empty || null,
        is_stale: Boolean(searchPerf?.error || searchPerf?.gsc?.status === "token_error" || searchPerf?.gsc?.data_empty === true)
      },
      "tool_conversion_map.json": {
        updatedAt: toolConvUpdatedAt,
        age_hours: ageHours(toolConvUpdatedAt),
        is_stale: false
      },
      "v180_payment_db_snapshot.json": {
        builtAt: paymentSnapBuiltAt,
        age_hours: ageHours(paymentSnapBuiltAt),
        payment_events_error: snap?.payment_events_error || null,
        is_stale: false
      }
    },
    freshness_threshold_hours: thresholdHours
  };

  // Exact revenue empty reason (step 1 requirement).
  // We use the observed chain break + snapshot state to produce a deterministic explanation.
  const exactReas = [];
  if (ordersFound > 0) {
    const paidCount = (snap.orders || []).filter((o) => String(o?.status) === "paid" || o?.paid_at).length;
    if (paidCount === 0) exactReas.push("no_paid_orders_in_payment_snapshot (orders.status != 'paid', paid_at is null)");
  } else {
    exactReas.push("no_orders_in_payment_snapshot");
  }
  if (!paymentEventsFound) {
    if (snap?.payment_events_error) exactReas.push(`payment_events_table_issue: ${snap.payment_events_error}`);
    else exactReas.push("payment_events_empty (no callback events to attribute paid revenue)");
  }
  if (exactOrderIds.length === 0) {
    exactReas.push("no_exact_attributed_orders (v180 attribution contains no attribution_confidence='exact' for paid/callback stages)");
  }
  if (unattributedOrderIds.length > 0 && unattributed.some((r) => r.tool_slug == null)) {
    exactReas.push("orders_attributed_with_tool_slug_missing => tool_slug=null => exact revenue can't be mapped to monetization tools");
  }

  const exactRevenueEmptyReason = exactReas.length ? exactReas.join("; ") : "unknown";

  const exactRevenueEmpty = exactOrders.length === 0;

  const exactOrdersMin = 2;
  const exactRatioMin = 0.2;
  const maxFreshnessAgeHours = thresholdHours;

  const attributedTotal = exact.length + inferred.length;
  const exactRatio = attributedTotal > 0 ? exact.length / attributedTotal : 0;
  const freshnessOk = !staleData && ageHours(searchPerfUpdatedAt) != null && ageHours(searchPerfUpdatedAt) <= maxFreshnessAgeHours;

  const activated =
    exactOrdersMin <= exactOrders.length &&
    freshnessOk &&
    exactRatio >= exactRatioMin &&
    chainBreak.payment_callback_success > 0;

  const activationThresholdDoc = {
    version: "183.1",
    builtAt,
    thresholds: {
      exact_orders_min: exactOrdersMin,
      data_freshness_max_age_hours: maxFreshnessAgeHours,
      attribution_confidence_exact_ratio_min: exactRatioMin
    },
    current_status: {
      activated: Boolean(activated),
      exact_orders_count: exactOrders.length,
      exact_attributed_ratio: Number.isFinite(exactRatio) ? exactRatio : 0,
      chain_break: chainBreak,
      freshness_ok: Boolean(freshnessOk),
      stale_data: staleData
    },
    blocked_by: activated
      ? []
      : [
          exactOrders.length < exactOrdersMin ? `exact_orders_count (${exactOrders.length}) < ${exactOrdersMin}` : null,
          !freshnessOk ? "freshness_ok failed (one or more freshness components stale/too old)" : null,
          exactRatio < exactRatioMin ? `exact_ratio (${exactRatio}) < ${exactRatioMin}` : null,
          chainBreak.payment_callback_success <= 0 ? "payment_callback_success == 0 => no paid revenue attributed" : null
        ].filter(Boolean)
  };

  // V183 exact revenue sample board (step 4 requirement): last N exact orders.
  const N = 20;
  const exactSample = exactOrders
    .slice()
    .sort((a, b) => new Date(b.created_at || b.attribution_key?.created_at || 0).getTime() - new Date(a.created_at || a.attribution_key?.created_at || 0).getTime())
    .slice(0, N)
    .map((r) => ({
      order_id: r.order_id,
      source_path: r.source_path,
      page_type: r.page_type,
      tool_slug: r.tool_slug,
      market: r.market,
      plan: r.plan,
      payment_stage: r.attributed_stage || r.event_type
    }));

  // Diagnosis output (step 1 + 3 + 5 + merge freshness audit).
  const diagnosis = {
    version: "183.1",
    builtAt,
    exact_revenue_empty_reason: exactRevenueEmptyReason,
    orders_found: ordersFound,
    callbacks_found: chainBreak.payment_callback_success,
    activations_found: chainBreak.membership_activated,
    exact_attributed_orders: { count: exactOrders.length, order_ids: exactOrderIds },
    inferred_only_orders: { count: inferred.length, order_ids: inferredOnlyOrders },
    unattributed_orders: { count: unattributed.length, order_ids: unattributedOrderIds },
    stale_data_reason: {
      stale_data: staleData,
      stale_reasons: staleReaso,
      threshold_hours: thresholdHours
    },
    chain_breakdown: chainBreak,
    payment_snapshot_status: paymentSnapshotStatus,
    freshness_audit: freshnessAudit,
    v182_activation_threshold: activationThresholdDoc
  };

  fs.mkdirSync(path.dirname(PATHS.outDiagnosis), { recursive: true });
  fs.writeFileSync(PATHS.outDiagnosis, JSON.stringify(diagnosis, null, 2), "utf8");
  fs.writeFileSync(PATHS.outFreshnessAudit, JSON.stringify(freshnessAudit, null, 2), "utf8");
  fs.writeFileSync(PATHS.outExactSample, JSON.stringify(exactSample, null, 2), "utf8");
  fs.writeFileSync(PATHS.outActivationThreshold, JSON.stringify(activationThresholdDoc, null, 2), "utf8");

  console.log(
    `[run-v183-revenue-signal-diagnosis] wrote diagnosis + freshness + exact-sample + threshold — orders=${ordersFound} callbacks=${chainBreak.payment_callback_success} activated=${activationThresholdDoc.current_status.activated}`
  );
}

main();

