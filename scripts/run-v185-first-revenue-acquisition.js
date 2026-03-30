#!/usr/bin/env node
/**
 * V185 — First revenue acquisition: record first paid order + flip V182 to active when criteria met.
 *
 * Run after a real/test payment with callback (see MEMORY / V184). Optionally runs npm run v184:verify.
 *
 * Outputs:
 * - generated/v185-first-payment.json
 * - generated/v185-revenue-system-state.json
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = process.cwd();
const PATHS = {
  snap: path.join(ROOT, "generated", "v180-payment-db-snapshot.json"),
  precise: path.join(ROOT, "generated", "v180-precise-paths.json"),
  v183th: path.join(ROOT, "generated", "v183-v182-activation-threshold.json"),
  v184diag: path.join(ROOT, "generated", "v184-payment-callback-diagnosis.json"),
  outFirst: path.join(ROOT, "generated", "v185-first-payment.json"),
  outState: path.join(ROOT, "generated", "v185-revenue-system-state.json")
};

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function extractFromPayload(pp) {
  if (!pp || typeof pp !== "object") {
    return { source_path: null, tool_slug: null, page_type: null };
  }
  const p = pp;
  if (typeof p.source_path === "string" && p.source_path.trim()) {
    const sp = p.source_path.trim();
    let tool = typeof p.tool_slug === "string" ? p.tool_slug : null;
    if (!tool && typeof sp === "string" && /\/tools\//.test(sp)) {
      const m = sp.match(/\/tools\/([a-z0-9-]+)/);
      tool = m ? m[1] : null;
    }
    const pageType = typeof p.page_type === "string" ? p.page_type : null;
    return { source_path: sp, tool_slug: tool, page_type: pageType };
  }
  return { source_path: null, tool_slug: null, page_type: null };
}

function main() {
  const runVerify = !process.argv.includes("--skip-verify");
  let verifyOk = false;
  let verifyError = null;
  if (runVerify) {
    try {
      execSync("npm run v184:verify", { cwd: ROOT, stdio: "inherit", env: process.env });
      verifyOk = true;
    } catch (e) {
      verifyError = e instanceof Error ? e.message : String(e);
      console.warn("[run-v185-first-revenue-acquisition] v184:verify failed (continue with existing JSON):", verifyError);
    }
  }

  const builtAt = new Date().toISOString();
  const snap = readJson(PATHS.snap) || {};
  const precise = readJson(PATHS.precise) || {};
  const v183 = readJson(PATHS.v183th) || {};
  const v184 = readJson(PATHS.v184diag) || {};

  const orders = Array.isArray(snap.orders) ? snap.orders : [];
  const events = Array.isArray(snap.payment_events) ? snap.payment_events : [];

  const paid = orders
    .filter((o) => String(o.status) === "paid" || o.paid_at)
    .sort((a, b) => {
      const ta = new Date(a.paid_at || a.created_at || 0).getTime();
      const tb = new Date(b.paid_at || b.created_at || 0).getTime();
      return tb - ta;
    });

  const first = paid[0] || null;
  const pp = first?.provider_payload && typeof first.provider_payload === "object" ? first.provider_payload : {};
  const ext = extractFromPayload(pp);

  const internalId = first?.id;
  let membershipActivated = false;
  if (internalId) {
    membershipActivated = events.some(
      (ev) =>
        ev.order_id === internalId &&
        (String(ev.event_type) === "membership_activated" || String(ev.event_type).includes("membership"))
    );
  }

  const callbackSuccessCount =
    typeof v184.callback_success_count === "number"
      ? v184.callback_success_count
      : events.filter((e) => String(e.event_type) === "payment_callback_success").length;

  const exactOrdersCount =
    typeof v183?.current_status?.exact_orders_count === "number"
      ? v183.current_status.exact_orders_count
      : 0;

  const topTool = Array.isArray(precise.top_paid_tools_exact) && precise.top_paid_tools_exact[0]
    ? precise.top_paid_tools_exact[0]
    : null;
  const topPath = Array.isArray(precise.top_paid_paths_exact) && precise.top_paid_paths_exact[0]
    ? precise.top_paid_paths_exact[0]
    : null;

  const firstPaymentDoc = {
    version: "185.1",
    builtAt,
    v184_verify_ran: runVerify,
    v184_verify_ok: verifyOk,
    v184_verify_error: verifyError,
    order_id: first?.order_id ?? null,
    source_path: ext.source_path,
    tool_slug: ext.tool_slug,
    page_type: ext.page_type || (ext.source_path && ext.source_path.includes("/tools/") ? "tool" : null),
    payment_status: first ? (first.paid_at || first.status === "paid" ? "paid" : String(first.status)) : null,
    paid_at: first?.paid_at ?? null,
    membership_activated: membershipActivated,
    first_exact_revenue_from_precise_paths: {
      top_tool: topTool,
      top_path: topPath,
      tool_slug_maps: Boolean(ext.tool_slug || topTool?.tool_slug)
    },
    v183_activation: {
      activated: Boolean(v183?.current_status?.activated),
      exact_ratio: typeof v183?.current_status?.exact_attributed_ratio === "number" ? v183.current_status.exact_attributed_ratio : null
    },
    checklist: {
      payment_callback_success_gt_0: callbackSuccessCount > 0,
      membership_activated_event: membershipActivated,
      exact_orders_count: exactOrdersCount
    }
  };

  // Step 5 (V185): exact_orders_count >= 1 AND callback_success > 0; require >=1 paid row in snapshot.
  const criteriaMet =
    paid.length >= 1 &&
    callbackSuccessCount >= 1 &&
    exactOrdersCount >= 1;

  const stateDoc = {
    version: "185.1",
    builtAt,
    criteria: {
      paid_orders_in_snapshot_min: 1,
      exact_orders_count_min: 1,
      callback_success_min: 1
    },
    current: {
      exact_orders_count: exactOrdersCount,
      callback_success_count: callbackSuccessCount,
      paid_orders_in_snapshot: paid.length,
      v183_activated: Boolean(v183?.current_status?.activated)
    },
    v182_revenue_amplification: {
      state: criteriaMet ? "active" : "pending"
    },
    note: criteriaMet
      ? "First revenue criteria met — write-system-map will mark V182 active (see v185 merge)."
      : "Complete one paid order with callback + re-run v184:verify and v183; then re-run this script."
  };

  fs.mkdirSync(path.dirname(PATHS.outFirst), { recursive: true });
  fs.writeFileSync(PATHS.outFirst, JSON.stringify(firstPaymentDoc, null, 2), "utf8");
  fs.writeFileSync(PATHS.outState, JSON.stringify(stateDoc, null, 2), "utf8");

  console.log(
    `[run-v185-first-revenue-acquisition] wrote v185-first-payment + v185-revenue-system-state — paid_orders=${paid.length} v182_state=${stateDoc.v182_revenue_amplification.state} verify_ok=${verifyOk}`
  );
}

main();
