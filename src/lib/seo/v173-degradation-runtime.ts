/**
 * V173 — Adaptive degradation: after N consecutive strict failures, one relaxed salvage attempt.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export type V173DegradationStateFile = {
  version: string;
  updatedAt: string;
  /** Consecutive strict 503 / router-fail streak per degradation key */
  strict_fail_streak: Record<string, number>;
};

const FNAME = "v173-degradation-state.json";

export function v173DegradationStatePath(cwd: string = process.cwd()): string {
  return path.join(cwd, "generated", FNAME);
}

export function v173TopicFingerprint(userInput: string): string {
  const t = userInput.trim().toLowerCase().slice(0, 200);
  return crypto.createHash("sha256").update(t).digest("hex").slice(0, 16);
}

export function v173DegradationKey(clientRoute: string | undefined, userInput: string): string {
  const r = (clientRoute && clientRoute.trim()) || "/unknown-tool";
  return `${r}|${v173TopicFingerprint(userInput)}`;
}

function defaultState(): V173DegradationStateFile {
  return {
    version: "173",
    updatedAt: new Date().toISOString(),
    strict_fail_streak: {}
  };
}

export function v173LoadDegradationState(cwd: string = process.cwd()): V173DegradationStateFile {
  const p = v173DegradationStatePath(cwd);
  try {
    if (!fs.existsSync(p)) return defaultState();
    const raw = JSON.parse(fs.readFileSync(p, "utf8")) as V173DegradationStateFile;
    if (!raw || typeof raw.strict_fail_streak !== "object") return defaultState();
    return {
      version: "173",
      updatedAt: new Date().toISOString(),
      strict_fail_streak: raw.strict_fail_streak || {}
    };
  } catch {
    return defaultState();
  }
}

export function v173SaveDegradationState(state: V173DegradationStateFile, cwd: string = process.cwd()): void {
  try {
    const p = v173DegradationStatePath(cwd);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(p, JSON.stringify(state, null, 2), "utf8");
  } catch {
    /* ignore */
  }
}

export function v173RelaxStreakThreshold(): number {
  const n = parseInt(process.env.V173_RELAX_STREAK_THRESHOLD ?? "3", 10);
  return Number.isFinite(n) && n >= 1 ? n : 3;
}

/**
 * If streak >= threshold, consume (reset) streak and return true for this request.
 */
export function v173ConsumeRelaxedOnceIfEligible(key: string, cwd: string = process.cwd()): boolean {
  const th = v173RelaxStreakThreshold();
  const state = v173LoadDegradationState(cwd);
  const streak = state.strict_fail_streak[key] ?? 0;
  if (streak < th) return false;
  state.strict_fail_streak[key] = 0;
  v173SaveDegradationState(state, cwd);
  return true;
}

export function v173RecordStrictFailure(key: string, cwd: string = process.cwd()): void {
  const state = v173LoadDegradationState(cwd);
  state.strict_fail_streak[key] = (state.strict_fail_streak[key] ?? 0) + 1;
  v173SaveDegradationState(state, cwd);
}

export function v173RecordSuccess(key: string, cwd: string = process.cwd()): void {
  const state = v173LoadDegradationState(cwd);
  if (state.strict_fail_streak[key]) {
    state.strict_fail_streak[key] = 0;
    v173SaveDegradationState(state, cwd);
  }
}

/**
 * After relaxed salvage still failed — do not grant infinite relax; bump streak so user must earn next relax.
 */
export function v173RecordRelaxedSalvageFailed(key: string, cwd: string = process.cwd()): void {
  const state = v173LoadDegradationState(cwd);
  state.strict_fail_streak[key] = Math.max(state.strict_fail_streak[key] ?? 0, 1);
  v173SaveDegradationState(state, cwd);
}
