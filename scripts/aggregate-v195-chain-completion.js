#!/usr/bin/env node
/**
 * V195 / V195.1 / V195.2 / V195.3 — One command, full chain:
 *   generated/v195-chain-completion.json
 *   generated/v195-chain-dropoff-diagnosis.json
 *   generated/v195-chain-optimization-rules.json (build-v195-chain-optimization-rules.js)
 *   generated/v195-chain-fix-applied.json + src/config/v195-chain-top1-fix.json (apply-v195-chain-top1-fix.js)
 * Usage: npm run v195   (alias: npm run v195:chain-completion)
 */

const fs = require("fs");
const path = require("path");
const { resolveRepoRoot } = require("./lib/repo-root");

const REPO = resolveRepoRoot(__dirname);
const IN_PATH = path.join(REPO, "generated", "tiktok-chain-events.jsonl");
const OUT_PATH = path.join(REPO, "generated", "v195-chain-completion.json");
const DIAG_PATH = path.join(REPO, "generated", "v195-chain-dropoff-diagnosis.json");

const ORDER = ["hook_generated", "caption_generated", "hashtag_generated", "title_generated", "upload_redirect"];

function readLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/** Returns true if there exist increasing timestamps for each milestone in ORDER. */
function isStrictChainComplete(steps) {
  const byEvent = new Map();
  for (const s of steps) {
    const ev = s.event;
    const ts = typeof s.timestamp === "number" ? s.timestamp : new Date(s.timestamp || 0).getTime();
    if (!byEvent.has(ev)) byEvent.set(ev, []);
    byEvent.get(ev).push(ts);
  }
  let last = -Infinity;
  for (const ev of ORDER) {
    const arr = (byEvent.get(ev) || []).filter((t) => t > last).sort((a, b) => a - b);
    if (arr.length === 0) return false;
    last = arr[0];
  }
  return true;
}

/** Longest strict ordered prefix of ORDER satisfied by session steps (chronological chain). */
function maxStrictPrefixSteps(steps) {
  const sorted = [...steps].sort((a, b) => a.timestamp - b.timestamp);
  let last = -Infinity;
  const prefix = [];
  for (const ev of ORDER) {
    const hit = sorted.find((x) => x.event === ev && x.timestamp > last);
    if (!hit) break;
    prefix.push(ev);
    last = hit.timestamp;
  }
  return prefix;
}

function main() {
  const events = readLines(IN_PATH);
  const sessions = new Map();
  const sessionIdsWithExplicitStart = new Set();

  for (const e of events) {
    const id = typeof e.chain_session_id === "string" ? e.chain_session_id.trim() : "";
    if (!id) continue;

    if (!sessions.has(id)) {
      sessions.set(id, {
        chain_session_id: id,
        start_tool: null,
        start_timestamp: null,
        steps: []
      });
    }
    const row = sessions.get(id);

    if (e.type === "session_start") {
      sessionIdsWithExplicitStart.add(id);
      row.start_tool = e.start_tool ?? row.start_tool;
      row.start_timestamp = e.start_timestamp ?? e.timestamp ?? row.start_timestamp;
    }
    if (e.type === "step" && e.event) {
      const ts = typeof e.timestamp === "number" ? e.timestamp : Date.now();
      row.steps.push({
        event: e.event,
        tool_slug: e.tool_slug,
        timestamp: ts
      });
    }
  }

  const sessionList = [...sessions.values()];
  const total_sessions = sessions.size;
  const started_sessions = sessionIdsWithExplicitStart.size;

  const startedList = sessionList.filter((s) => sessionIdsWithExplicitStart.has(s.chain_session_id));

  let completed_sessions = 0;
  for (const s of startedList) {
    if (isStrictChainComplete(s.steps)) completed_sessions += 1;
  }

  const completion_rate = started_sessions > 0 ? completed_sessions / started_sessions : 0;

  /** Funnel: reached milestone i = strict prefix of ORDER satisfied by step timestamps. */
  function countReached(orderIndex) {
    const need = ORDER.slice(0, orderIndex + 1);
    let n = 0;
    for (const s of startedList) {
      const steps = [...s.steps].sort((a, b) => a.timestamp - b.timestamp);
      let last = -Infinity;
      let ok = true;
      for (const ev of need) {
        const hit = steps.find((x) => x.event === ev && x.timestamp > last);
        if (!hit) {
          ok = false;
          break;
        }
        last = hit.timestamp;
      }
      if (ok) n += 1;
    }
    return n;
  }

  const reached = ORDER.map((_, i) => countReached(i));

  const sessions_reaching_hook = reached[0] ?? 0;
  const sessions_reaching_caption = reached[1] ?? 0;
  const sessions_reaching_hashtag = reached[2] ?? 0;
  const sessions_reaching_title = reached[3] ?? 0;
  const sessions_reaching_upload = reached[4] ?? 0;

  /** Step-to-step conversion among sessions that started (explicit session_start). */
  const step_to_step_conversion = [];

  function pushConv(fromLabel, toLabel, numerator, denominator) {
    const rate = denominator > 0 ? numerator / denominator : 0;
    step_to_step_conversion.push({
      from: fromLabel,
      to: toLabel,
      numerator,
      denominator,
      rate,
      rate_pct: Math.round(rate * 10000) / 100
    });
  }

  pushConv("session_start", "hook_generated", sessions_reaching_hook, started_sessions);
  pushConv("hook_generated", "caption_generated", sessions_reaching_caption, sessions_reaching_hook);
  pushConv("caption_generated", "hashtag_generated", sessions_reaching_hashtag, sessions_reaching_caption);
  pushConv("hashtag_generated", "title_generated", sessions_reaching_title, sessions_reaching_hashtag);
  pushConv("title_generated", "upload_redirect", sessions_reaching_upload, sessions_reaching_title);

  /** Biggest absolute drop between consecutive funnel levels. */
  const transitions = [
    { from: "session_start", to: "hook", fromCount: started_sessions, toCount: sessions_reaching_hook },
    { from: "hook", to: "caption", fromCount: sessions_reaching_hook, toCount: sessions_reaching_caption },
    { from: "caption", to: "hashtag", fromCount: sessions_reaching_caption, toCount: sessions_reaching_hashtag },
    { from: "hashtag", to: "title", fromCount: sessions_reaching_hashtag, toCount: sessions_reaching_title },
    { from: "title", to: "upload", fromCount: sessions_reaching_title, toCount: sessions_reaching_upload }
  ];

  let biggest_drop_step = null;
  let maxLost = -1;
  for (const t of transitions) {
    const lost = Math.max(0, t.fromCount - t.toCount);
    const rel = t.fromCount > 0 ? lost / t.fromCount : 0;
    if (lost > maxLost) {
      maxLost = lost;
      biggest_drop_step = {
        transition: `${t.from} → ${t.to}`,
        from_step: t.from,
        to_step: t.to,
        lost_sessions: lost,
        from_count: t.fromCount,
        to_count: t.toCount,
        relative_drop_rate: Math.round(rel * 10000) / 100
      };
    }
  }

  if (started_sessions === 0) {
    biggest_drop_step = {
      transition: null,
      from_step: null,
      to_step: null,
      lost_sessions: 0,
      from_count: 0,
      to_count: 0,
      relative_drop_rate: 0,
      note: "no started sessions in source file"
    };
  }

  /** Partial path frequency among incomplete started sessions. */
  const pathFreq = new Map();
  for (const s of startedList) {
    if (isStrictChainComplete(s.steps)) continue;
    const prefix = maxStrictPrefixSteps(s.steps);
    const key = prefix.length === 0 ? "(no_chain_milestone_yet)" : prefix.map((e) => e.replace(/_generated$/, "").replace(/^upload_redirect$/, "upload")).join(" → ");
    pathFreq.set(key, (pathFreq.get(key) || 0) + 1);
  }

  const common_partial_paths = [...pathFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([path_signature, session_count]) => ({ path_signature, session_count }));

  let copy_events_total = 0;
  for (const s of sessionList) {
    for (const st of s.steps) {
      if (st.event === "copy_event") copy_events_total += 1;
    }
  }

  const stepNames = ["hook", "caption", "hashtag", "title", "upload_redirect"];
  const drop_off_by_step = [];

  drop_off_by_step.push({
    step: "session_start",
    next_milestone: "hook_generated",
    reached_with_session_start: started_sessions,
    reached_next_milestone: reached[0] ?? 0,
    lost_to_next: Math.max(0, started_sessions - (reached[0] ?? 0)),
    note: "Among sessions that emitted session_start, how many reached hook_generated (first chain step)"
  });

  for (let i = 0; i < ORDER.length; i++) {
    const cur = reached[i] ?? 0;
    const next = i + 1 < ORDER.length ? reached[i + 1] ?? 0 : null;
    drop_off_by_step.push({
      step: stepNames[i] ?? ORDER[i],
      milestone: ORDER[i],
      next_milestone: i + 1 < ORDER.length ? ORDER[i + 1] : null,
      reached_count: cur,
      lost_to_next: next !== null ? Math.max(0, cur - next) : 0
    });
  }

  const sessions_stuck_at_hook_only = Math.max(0, sessions_reaching_hook - sessions_reaching_caption);
  const sessions_stuck_before_caption = Math.max(0, started_sessions - sessions_reaching_caption);
  const sessions_stuck_before_hashtag = Math.max(0, started_sessions - sessions_reaching_hashtag);
  const sessions_stuck_before_title = Math.max(0, started_sessions - sessions_reaching_title);
  const sessions_stuck_before_upload = Math.max(0, started_sessions - sessions_reaching_upload);

  const likely_reason_candidates = buildLikelyReasonCandidates({
    biggest_drop_step,
    sessions_stuck_at_hook_only,
    started_sessions,
    sessions_reaching_hook,
    step_to_step_conversion,
    common_partial_paths
  });

  const payload = {
    version: "1.1",
    updated_at: new Date().toISOString(),
    source_file: IN_PATH,
    chain_definition: {
      completion_requires_ordered: ORDER,
      notes:
        "completion = strict chronological order of first occurrence of each milestone; copy_event tracked separately and not required for completion"
    },
    total_sessions,
    started_sessions,
    completed_sessions,
    completion_rate,
    copy_events_total,
    sessions_reaching_hook,
    sessions_reaching_caption,
    sessions_reaching_hashtag,
    sessions_reaching_title,
    sessions_reaching_upload,
    step_to_step_conversion,
    biggest_drop_step,
    common_partial_paths,
    reached_milestone_counts: ORDER.reduce((acc, ev, i) => {
      acc[ev] = reached[i] ?? 0;
      return acc;
    }, {}),
    drop_off_by_step
  };

  const diagnosis = {
    version: "1",
    updated_at: new Date().toISOString(),
    source_file: IN_PATH,
    derived_from: "v195-chain-completion aggregate (started sessions, strict ordered milestones)",
    biggest_drop_step: biggest_drop_step?.transition
      ? {
          ...biggest_drop_step,
          interpretation: `Largest absolute loss between consecutive funnel steps (${biggest_drop_step.transition}).`
        }
      : biggest_drop_step,
    likely_reason_candidates,
    sessions_stuck_at_hook_only,
    sessions_stuck_before_caption,
    sessions_stuck_before_hashtag,
    sessions_stuck_before_title,
    sessions_stuck_before_upload,
    definitions: {
      stuck_at_hook_only:
        "Reached hook_generated in strict order but not caption_generated (reaching_hook − reaching_caption).",
      stuck_before_caption: "Started session but did not reach caption_generated in strict order (started − reaching_caption).",
      stuck_before_hashtag: "Started session but did not reach hashtag_generated in strict order.",
      stuck_before_title: "Started session but did not reach title_generated in strict order.",
      stuck_before_upload: "Started session but did not reach upload_redirect in strict order (includes all non-completers)."
    }
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  fs.writeFileSync(DIAG_PATH, JSON.stringify(diagnosis, null, 2), "utf8");

  console.log("[v195.1] wrote", OUT_PATH, "and", DIAG_PATH, {
    total_sessions,
    started_sessions,
    completed_sessions,
    completion_rate: completion_rate.toFixed(4),
    biggest_transition: biggest_drop_step?.transition ?? "n/a"
  });

  try {
    const { main: buildV195OptimizationRules } = require("./build-v195-chain-optimization-rules.js");
    buildV195OptimizationRules();
  } catch (e) {
    console.error("[v195.2] optimization rules build failed", e);
    process.exit(1);
  }

  try {
    const { main: applyV195Top1Fix } = require("./apply-v195-chain-top1-fix.js");
    applyV195Top1Fix();
  } catch (e) {
    console.error("[v195.3] apply-top1 failed", e);
    process.exit(1);
  }
}

/**
 * @param {object} ctx
 * @returns {string[]}
 */
function buildLikelyReasonCandidates(ctx) {
  const out = [];
  const { biggest_drop_step, sessions_stuck_at_hook_only, started_sessions, sessions_reaching_hook, step_to_step_conversion, common_partial_paths } = ctx;

  if (started_sessions === 0) {
    return ["No session_start rows in tiktok-chain-events.jsonl yet; collect production events before diagnosing."];
  }

  const t = biggest_drop_step?.transition;
  if (t === "session_start → hook") {
    out.push("Many sessions never generate a hook after landing on a chain tool: weak first-step intent, bounce, or session_start not paired with generate (verify client wiring).");
  }
  if (t === "hook → caption") {
    out.push("Drop after hook → caption: users may not follow the next-step workflow to the caption tool, or stop after one generation.");
  }
  if (t === "caption → hashtag") {
    out.push("Drop after caption → hashtags: friction moving to hashtag tool or perceived redundancy.");
  }
  if (t === "hashtag → title") {
    out.push("Drop after hashtags → title: users may feel done after hashtags or skip title/cover line step.");
  }
  if (t === "title → upload") {
    out.push("Drop after title → upload: users copy but do not open the upload redirect (modal dismissed, or upload intent low).");
  }

  const hookConv = step_to_step_conversion.find((x) => x.from === "session_start");
  if (hookConv && hookConv.denominator > 0 && hookConv.rate < 0.35) {
    out.push(`Low session_start→hook conversion (${hookConv.rate_pct}%): prioritize first-generation success and visible chain entry on hook/caption landing.`);
  }

  if (sessions_stuck_at_hook_only > 0 && sessions_reaching_hook > 0) {
    const r = sessions_stuck_at_hook_only / sessions_reaching_hook;
    if (r > 0.4) {
      out.push(`Large share of hook reachers never reach caption (${Math.round(r * 100)}% of hook reachers): strengthen next-step CTA and continuity from hook to caption.`);
    }
  }

  const topPartial = common_partial_paths[0]?.path_signature;
  if (topPartial && topPartial !== "(no_chain_milestone_yet)") {
    out.push(`Most common incomplete path signature: "${topPartial}" — optimize the first missing transition after this prefix.`);
  } else if (topPartial === "(no_chain_milestone_yet)" && common_partial_paths[0]?.session_count > 0) {
    out.push('Many started sessions show no chain milestone yet: users leave before first successful generation.');
  }

  if (out.length === 0) {
    out.push("Insufficient contrast between steps to infer a dominant cause; continue collecting sessions or inspect raw tiktok-chain-events.jsonl.");
  }

  return [...new Set(out)];
}

main();
