#!/usr/bin/env node
/**
 * V184 — Payment closure diagnostics (callback URLs, payment_events rollup, manual test placeholder).
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SNAP = path.join(ROOT, "generated", "v180-payment-db-snapshot.json");
const OUT_DIAG = path.join(ROOT, "generated", "v184-payment-callback-diagnosis.json");
const OUT_TEST = path.join(ROOT, "generated", "v184-payment-test-result.json");

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function maxIso(dates) {
  let best = null;
  for (const d of dates) {
    if (!d) continue;
    const t = new Date(d).getTime();
    if (!Number.isFinite(t)) continue;
    if (!best || t > new Date(best).getTime()) best = d;
  }
  return best;
}

function main() {
  const builtAt = new Date().toISOString();
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.tooleagle.com").replace(/\/$/, "");

  const snap = readJson(SNAP) || {};
  const events = Array.isArray(snap.payment_events) ? snap.payment_events : [];

  let callbackReceived = 0;
  let callbackSuccess = 0;
  let callbackFailed = 0;
  const successDates = [];

  for (const ev of events) {
    const t = String(ev.event_type || "");
    if (/callback|webhook|lemon_webhook|aggregator|paid_callback/i.test(t)) callbackReceived++;
    if (t === "payment_callback_success" || t === "payment_paid_callback") {
      callbackSuccess++;
      successDates.push(ev.created_at);
    }
    if (/failed|error|invalid/i.test(t)) callbackFailed++;
  }

  const lastCallbackAt = maxIso(events.map((e) => e.created_at).filter(Boolean));

  const diagnosis = {
    version: "184.1",
    builtAt,
    callback_received_count: callbackReceived,
    callback_success_count: callbackSuccess,
    callback_failed_count: callbackFailed,
    last_callback_at: lastCallbackAt,
    callback_url: `${base}/api/payment/callback`,
    lemon_webhook_url: `${base}/api/payment/lemon-webhook`,
    aggregator_notify_url_hint: (process.env.AGGREGATOR_NOTIFY_URL || "").trim() || null,
    provider_status: {
      payment_events_error: snap.payment_events_error || null,
      snapshot_ok: Boolean(snap.ok),
      orders_row_count: Array.isArray(snap.orders) ? snap.orders.length : 0,
      payment_events_row_count: events.length
    },
    deployment_checks: {
      cloudflare_or_vercel: "If callbacks never hit the server, verify DNS / WAF rules allow POST to /api/payment/callback and /api/payment/lemon-webhook.",
      lemon: "Lemon: set webhook URL to lemon_webhook_url; set LEMON_SQUEEZY_SIGNING_SECRET; checkout links must include checkout[custom][merchant_order_id] (create-order appends automatically).",
      cn_aggregator: "CN: set AGGREGATOR_NOTIFY_URL in production to callback_url (server-to-server)."
    }
  };

  const pendingOrders = (snap.orders || []).filter((o) => String(o.status) === "pending").length;
  const paidOrders = (snap.orders || []).filter((o) => String(o.status) === "paid" || o.paid_at).length;

  const testResult = {
    version: "184.1",
    builtAt,
    status: "manual_required",
    checklist: [
      "Apply Supabase migration 0037_v184_payment_events_closure.sql (or full chain including 0036).",
      "Set LEMON_SQUEEZY_SIGNING_SECRET and register webhook URL in Lemon dashboard.",
      "For CN: ensure aggregator notify reaches /api/payment/callback with valid signature.",
      "Create a credits order (global), complete payment, confirm orders.status=paid and payment_events rows exist."
    ],
    last_snapshot_summary: {
      pending_orders: pendingOrders,
      paid_orders: paidOrders,
      payment_events_rows: events.length
    },
    note: "Automated browser payment is environment-specific; mark status: passed manually after verification."
  };

  fs.mkdirSync(path.dirname(OUT_DIAG), { recursive: true });
  fs.writeFileSync(OUT_DIAG, JSON.stringify(diagnosis, null, 2), "utf8");
  fs.writeFileSync(OUT_TEST, JSON.stringify(testResult, null, 2), "utf8");
  console.log("[run-v184-payment-diagnostics] wrote", OUT_DIAG, OUT_TEST);
}

main();
