import fs from "node:fs";

const API_URL = process.env.V193_HOOK_VALIDATION_API_URL ?? "http://localhost:3001/api/generate-package";

const payloadBase = {
  userInput: "organic skincare routine for acne scars",
  toolKind: "hook_focus",
  locale: "en",
  debugDisableV172Strict: true,
  v186: {
    toolSlug: "hook-generator",
    intentId: "intent_views",
    scenarioId: "sc_tutorial",
    platform: "tiktok",
    primaryGoal: "views"
  }
};

function countMarkers(text) {
  if (!text) return 0;
  const s = String(text).toLowerCase();
  const markers = [
    "quick interrupt",
    "before you post",
    "most creators miss",
    "setup",
    "proof",
    "next step",
    "save this",
    "do this instead",
    "10 seconds",
    "setup (1 line)",
    "proof (2 lines)",
    "next step (1 line)",
    "step"
  ];
  return markers.reduce((acc, m) => acc + (s.includes(m.toLowerCase()) ? 1 : 0), 0);
}

function countTikTokCues(text) {
  if (!text) return 0;
  const s = String(text).toLowerCase();
  // These cues are specific to TikTok "micro-demo / before-after / skip" patterns.
  const cues = [
    "quick interrupt",
    "do this instead",
    "in 10 seconds",
    "tested your approach",
    "day 1 vs day 7",
    "day 1",
    "day 7",
    "what you had before",
    "what changes after",
    "exact demo moment",
    "skip to 0:12",
    "skip to"
  ];
  // Weight some high-signal cues.
  const weights = {
    "day 1 vs day 7": 2,
    "exact demo moment": 2,
    "skip to 0:12": 2,
    "skip to": 1,
    "tested your approach": 2,
    "what you had before": 1,
    "what changes after": 1
  };
  return cues.reduce((acc, cue) => acc + (s.includes(cue) ? (weights[cue] ?? 1) : 0), 0);
}

function first3Hint(text) {
  if (!text) return "";
  return String(text).slice(0, 160);
}

function scoreCuriosity(text) {
  if (!text) return 0;
  const s = String(text).toLowerCase();
  let sc = 0;
  ["what", "why", "secret", "stop doing", "mistake", "don't", "before", "do this"].forEach((w) => {
    if (s.includes(w)) sc += 1;
  });
  if (s.includes("?")) sc += 2;
  return sc;
}

function scoreInterruption(text) {
  if (!text) return 0;
  const s = String(text).toLowerCase();
  let sc = 0;
  ["quick", "interrupt", "stop", "before", "mistake", "wrong", "instead", "in 10 seconds"].forEach((w) => {
    if (s.includes(w)) sc += 1;
  });
  return sc;
}

function scoreDirectCTA(text) {
  if (!text) return 0;
  const s = String(text).toLowerCase();
  let sc = 0;
  ["save this", "comment your", "follow for", "share this", "cta"].forEach((w) => {
    if (s.includes(w)) sc += 1;
  });
  return sc;
}

async function call(disableV193) {
  const body = JSON.parse(JSON.stringify(payloadBase));
  if (disableV193) body.v186.debugDisableV193 = true;
  // Avoid potential generation-cache reuse by varying clientRoute.
  body.clientRoute = disableV193 ? "/_v193_validation_hook_generator/A" : "/_v193_validation_hook_generator/B";

  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status}: ${t.slice(0, 500)}`);
  }

  const data = await r.json();
  const p = (data.packages || [])[0] || null;
  return {
    hook: p?.hook || null,
    script_talking_points: p?.script_talking_points || null,
    cta_line: p?.cta_line || null,
    caption: p?.caption || null,
    raw: data
  };
}

(async () => {
  const baseline = await call(true);
  const v193 = await call(false);

  const baselineCombined = [baseline.hook, baseline.script_talking_points, baseline.cta_line, baseline.caption]
    .filter(Boolean)
    .join("\n");
  const v193Combined = [v193.hook, v193.script_talking_points, v193.cta_line, v193.caption]
    .filter(Boolean)
    .join("\n");

  const baselineMarkers = countMarkers(baselineCombined);
  const v193Markers = countMarkers(v193Combined);

  const baselineCues = countTikTokCues(baselineCombined);
  const v193Cues = countTikTokCues(v193Combined);

  const baselineCuriosity = scoreCuriosity(baselineCombined);
  const v193Curiosity = scoreCuriosity(v193Combined);

  const baselineInterruption = scoreInterruption(baselineCombined);
  const v193Interruption = scoreInterruption(v193Combined);

  const baselineCTA = scoreDirectCTA(baselineCombined);
  const v193CTA = scoreDirectCTA(v193Combined);

  const hookFirstBaseline = first3Hint(baseline.hook);
  const hookFirstV193 = first3Hint(v193.hook);

  const markerDelta = v193Markers - baselineMarkers;
  const cuesDelta = v193Cues - baselineCues;
  const curiosityDelta = v193Curiosity - baselineCuriosity;
  const interruptionDelta = v193Interruption - baselineInterruption;
  const ctaDelta = v193CTA - baselineCTA;

  const v193BraceLeak = /[{}]/.test(v193Combined);

  const differences = [
    `Marker-based TikTok-ness: baseline=${baselineMarkers}, v193=${v193Markers}, delta=${markerDelta}`,
    `TikTok cue score: baseline=${baselineCues}, v193=${v193Cues}, delta=${cuesDelta}`,
    `Curiosity score: baseline=${baselineCuriosity}, v193=${v193Curiosity}, delta=${curiosityDelta}`,
    `Interruption score: baseline=${baselineInterruption}, v193=${v193Interruption}, delta=${interruptionDelta}`,
    `Direct CTA score: baseline=${baselineCTA}, v193=${v193CTA}, delta=${ctaDelta}`,
    `Hook head preview:\n- baseline: ${hookFirstBaseline.replace(/\s+/g, " ").slice(0, 120)}\n- v193: ${hookFirstV193.replace(/\s+/g, " ").slice(0, 120)}`
  ];

  const pass =
    !v193BraceLeak &&
    (v193Cues >= baselineCues + 2 || v193Curiosity >= baselineCuriosity + 2);
  const conclusion = pass
    ? "PASS: v193 output shows stronger TikTok cues (micro-demo/before-after/skip) than baseline, without brace placeholder leakage."
    : "FAIL: v193 output did not show enough TikTok-specific cues vs baseline (or still contains brace placeholders).";

  const out = {
    timestamp: new Date().toISOString(),
    input: payloadBase.userInput,
    baseline_output: {
      hook: baseline.hook,
      script_talking_points: baseline.script_talking_points,
      cta_line: baseline.cta_line,
      caption: baseline.caption
    },
    v193_output: {
      hook: v193.hook,
      script_talking_points: v193.script_talking_points,
      cta_line: v193.cta_line,
      caption: v193.caption
    },
    differences,
    conclusion,
    pass,
    ui_validation: {
      expected_hint_text: "Adjusted using recent TikTok content patterns.",
      hint_expected_by_code_path: true,
      note: "API validation cannot confirm UI rendering; please visually confirm the hint appears in hook-generator result area."
    }
  };

  fs.writeFileSync("generated/v193-hook-validation.json", JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote generated/v193-hook-validation.json");
  console.log("pass=", pass);
})();

