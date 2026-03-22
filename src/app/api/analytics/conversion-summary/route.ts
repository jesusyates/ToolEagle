import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type FunnelEvent = {
  event: string;
  session_id?: string | null;
  created_at: string;
  meta: Record<string, unknown>;
};

const DOUBYIN_VIEW = "douyin_tool_view";
const DOUBYIN_GENERATE = "douyin_generate";
const DOUBYIN_LOCKED_VIEW = "douyin_locked_content_view";
const DOUBYIN_UPGRADE = "douyin_upgrade_click";
const DOUBYIN_PAYMENT = "douyin_payment_success";

const CN_VIEW = "cn_tool_view";
const CN_GENERATE = "cn_generate";
const CN_LOCKED_VIEW = "cn_locked_content_view";
const CN_UPGRADE = "cn_upgrade_click";
const CN_PAYMENT = "cn_payment_success";

function bucketForAmount(amount: number | null | undefined): number | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const a = Number(amount);
  // Buckets requested by spec: ¥9 / ¥29 / ¥59 / ¥99
  const buckets = [9, 29, 59, 99];
  for (const b of buckets) {
    if (Math.abs(a - b) < 0.01 || Math.abs(a - b) / b < 0.02) return b;
  }
  return null;
}

function safeNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function computeRates(sessions: Record<string, FunnelEvent[]>, seg: { view: string; generate: string; upgrade: string; payment: string }) {
  type SessionState = {
    viewTime?: string;
    generateTime?: string;
    upgradeTime?: string;
    paymentTime?: string;
  };
  const state: Record<string, SessionState> = {};

  const segEvents = new Set([seg.view, seg.generate, seg.upgrade, seg.payment]);

  for (const [sessionId, evts] of Object.entries(sessions)) {
    const sorted = [...evts].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const relevant = sorted.filter((e) => segEvents.has(e.event));
    if (relevant.length === 0) continue;

    const s: SessionState = {};
    const viewEvt = relevant.find((e) => e.event === seg.view);
    if (viewEvt) s.viewTime = viewEvt.created_at;
    if (!s.viewTime) continue;

    const viewTime = s.viewTime;
    const generateEvt = relevant.find((e) => e.event === seg.generate && e.created_at >= viewTime);
    if (generateEvt) s.generateTime = generateEvt.created_at;

    if (s.generateTime) {
      const generateTime = s.generateTime;
      const upgradeEvt = relevant.find((e) => e.event === seg.upgrade && e.created_at >= generateTime);
      if (upgradeEvt) s.upgradeTime = upgradeEvt.created_at;
    }

    if (s.upgradeTime) {
      const upgradeTime = s.upgradeTime;
      const paymentEvt = relevant.find((e) => e.event === seg.payment && e.created_at >= upgradeTime);
      if (paymentEvt) s.paymentTime = paymentEvt.created_at;
    }

    state[sessionId] = s;
  }

  const viewSessions = Object.entries(state).filter(([, s]) => Boolean(s.viewTime)).length;
  const generateSessions = Object.entries(state).filter(([, s]) => Boolean(s.generateTime)).length;
  const upgradeSessions = Object.entries(state).filter(([, s]) => Boolean(s.upgradeTime)).length;
  const paymentSessions = Object.entries(state).filter(([, s]) => Boolean(s.paymentTime)).length;

  const view_to_generate_rate = viewSessions > 0 ? generateSessions / viewSessions : 0;
  const generate_to_upgrade_rate = generateSessions > 0 ? upgradeSessions / generateSessions : 0;
  const upgrade_to_payment_rate = upgradeSessions > 0 ? paymentSessions / upgradeSessions : 0;

  // Drop-off insight
  const minRate = Math.min(view_to_generate_rate, generate_to_upgrade_rate, upgrade_to_payment_rate);
  const dropStep =
    minRate === view_to_generate_rate
      ? "view→generate"
      : minRate === generate_to_upgrade_rate
        ? "generate→upgrade"
        : "upgrade→payment";

  return {
    sessions: {
      view: viewSessions,
      generate: generateSessions,
      upgrade: upgradeSessions,
      payment: paymentSessions
    },
    rates: {
      view_to_generate_rate,
      generate_to_upgrade_rate,
      upgrade_to_payment_rate
    },
    dropoff_step: dropStep
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const windowDaysRaw = url.searchParams.get("windowDays");
  const windowDays = Math.max(1, Math.min(90, Number(windowDaysRaw ?? 30)));
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("traffic_events")
    .select("page, meta, created_at")
    .eq("source", "conversion_funnel")
    .gte("created_at", since)
    .limit(20000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events: FunnelEvent[] =
    (data ?? []).map((r) => {
      const meta = (r.meta ?? {}) as Record<string, unknown>;
      const session_id = typeof meta.session_id === "string" ? meta.session_id : null;
      return {
        event: String(r.page ?? ""),
        session_id,
        created_at: String(r.created_at),
        meta
      };
    }) ?? [];

  const bySessionDouyin: Record<string, FunnelEvent[]> = {};
  const bySessionCn: Record<string, FunnelEvent[]> = {};

  for (const e of events) {
    if (!e.session_id) continue;
    if (e.event.startsWith("douyin_")) {
      (bySessionDouyin[e.session_id] ??= []).push(e);
    }
    if (e.event.startsWith("cn_")) {
      (bySessionCn[e.session_id] ??= []).push(e);
    }
  }

  const douyinRates = computeRates(bySessionDouyin, {
    view: DOUBYIN_VIEW,
    generate: DOUBYIN_GENERATE,
    upgrade: DOUBYIN_UPGRADE,
    payment: DOUBYIN_PAYMENT
  });

  const cnRates = computeRates(bySessionCn, {
    view: CN_VIEW,
    generate: CN_GENERATE,
    upgrade: CN_UPGRADE,
    payment: CN_PAYMENT
  });

  function computeGenerationsBeforeUpgrade(bySession: Record<string, FunnelEvent[]>, generateEvent: string, upgradeEvent: string) {
    const depths: number[] = [];
    for (const evts of Object.values(bySession)) {
      const sorted = [...evts].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const upgradeEvt = sorted.find((x) => x.event === upgradeEvent);
      if (!upgradeEvt) continue;
      const genBefore = sorted.filter((x) => x.event === generateEvent && x.created_at < upgradeEvt.created_at).length;
      depths.push(genBefore);
    }
    depths.sort((a, b) => a - b);
    const avg = depths.length ? depths.reduce((s, n) => s + n, 0) / depths.length : 0;
    const median = depths.length ? depths[Math.floor(depths.length / 2)] : 0;
    const buckets = [0, 1, 2, 3, 4];
    const bucketCounts: Record<string, number> = { "0": 0, "1": 0, "2": 0, "3": 0, "4+": 0 };
    for (const d of depths) {
      if (d <= 0) bucketCounts["0"]++;
      else if (d === 1) bucketCounts["1"]++;
      else if (d === 2) bucketCounts["2"]++;
      else if (d === 3) bucketCounts["3"]++;
      else bucketCounts["4+"]++;
    }
    return { avgGenerationsBeforeUpgrade: avg, medianGenerationsBeforeUpgrade: median, bucketCounts, sampleCount: depths.length };
  }

  function computePlanPerformance(bySession: Record<string, FunnelEvent[]>) {
    type UpgradeState = { upgradeAmount: number | null; upgradeCurrency: string | null; upgradedAt?: string; paymentAt?: string };
    const byPlan: Record<string, UpgradeState[]> = {};
    const bucketList = [9, 29, 59, 99];

    for (const evts of Object.values(bySession)) {
      const sorted = [...evts].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const up = sorted.find((x) => x.event === CN_UPGRADE || x.event === DOUBYIN_UPGRADE);
      if (!up) continue;
      const pay = sorted.find((x) => x.event === CN_PAYMENT || x.event === DOUBYIN_PAYMENT);
      const amount = safeNumber((up.meta.plan_amount ?? up.meta.amount) as unknown);
      const bucket = bucketForAmount(amount);
      const planKey = bucket != null ? String(bucket) : "other";
      if (!byPlan[planKey]) byPlan[planKey] = [];
      byPlan[planKey].push({
        upgradeAmount: amount,
        upgradeCurrency: typeof up.meta.plan_currency === "string" ? (up.meta.plan_currency as string) : null,
        upgradedAt: up.created_at,
        paymentAt: pay?.created_at
      });
    }

    const out: Record<string, { upgradeSessions: number; paymentSessions: number; upgrade_to_payment_rate: number }> = {};
    for (const key of [...bucketList.map(String), "other"]) {
      const arr = byPlan[key] ?? [];
      const upgradeSessions = arr.length;
      const paymentSessions = arr.filter((x) => Boolean(x.paymentAt)).length;
      out[key] = {
        upgradeSessions,
        paymentSessions,
        upgrade_to_payment_rate: upgradeSessions > 0 ? paymentSessions / upgradeSessions : 0
      };
    }
    return out;
  }

  // Plan performance needs to respect segment-specific event names; compute separately.
  function computePlanPerformanceSegment(
    bySession: Record<string, FunnelEvent[]>,
    upgradeEvent: string,
    paymentEvent: string
  ) {
    const byBucket: Record<string, { upgradeSessions: number; paymentSessions: number }> = {};

    for (const evts of Object.values(bySession)) {
      const sorted = [...evts].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const up = sorted.find((x) => x.event === upgradeEvent);
      if (!up) continue;
      const pay = sorted.find((x) => x.event === paymentEvent && (x.created_at >= up.created_at));

      const amount = safeNumber((up.meta.plan_amount ?? up.meta.amount) as unknown);
      const bucket = bucketForAmount(amount);
      const planKey = bucket != null ? String(bucket) : "other";
      if (!byBucket[planKey]) byBucket[planKey] = { upgradeSessions: 0, paymentSessions: 0 };
      byBucket[planKey].upgradeSessions++;
      if (pay) byBucket[planKey].paymentSessions++;
    }

    const bucketKeys = ["9", "29", "59", "99", "other"];
    const out: Record<string, { upgradeSessions: number; paymentSessions: number; upgrade_to_payment_rate: number }> = {};
    for (const k of bucketKeys) {
      const v = byBucket[k] ?? { upgradeSessions: 0, paymentSessions: 0 };
      out[k] = {
        upgradeSessions: v.upgradeSessions,
        paymentSessions: v.paymentSessions,
        upgrade_to_payment_rate: v.upgradeSessions > 0 ? v.paymentSessions / v.upgradeSessions : 0
      };
    }
    return out;
  }

  const douyinDepth = computeGenerationsBeforeUpgrade(bySessionDouyin, DOUBYIN_GENERATE, DOUBYIN_UPGRADE);
  const cnDepth = computeGenerationsBeforeUpgrade(bySessionCn, CN_GENERATE, CN_UPGRADE);

  const douyinPlanPerformance = computePlanPerformanceSegment(bySessionDouyin, DOUBYIN_UPGRADE, DOUBYIN_PAYMENT);
  const cnPlanPerformance = computePlanPerformanceSegment(bySessionCn, CN_UPGRADE, CN_PAYMENT);

  return NextResponse.json({
    ok: true,
    windowDays,
    segments: {
      douyin: {
        funnel: douyinRates,
        free_usage_depth: douyinDepth,
        plan_performance: douyinPlanPerformance
      },
      global: {
        funnel: cnRates,
        free_usage_depth: cnDepth,
        plan_performance: cnPlanPerformance
      }
    }
  });
}

