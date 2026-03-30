/**
 * @jest-environment node
 */

import fs from "fs";
import os from "os";
import path from "path";
import {
  v173ConsumeRelaxedOnceIfEligible,
  v173DegradationKey,
  v173RecordStrictFailure,
  v173RecordSuccess,
  v173RelaxStreakThreshold,
  v173LoadDegradationState
} from "@/lib/seo/v173-degradation-runtime";

describe("v173-degradation-runtime", () => {
  let tmp: string;
  let prev: string | undefined;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "v173-deg-"));
    fs.mkdirSync(path.join(tmp, "generated"), { recursive: true });
    prev = process.env.V173_RELAX_STREAK_THRESHOLD;
    process.env.V173_RELAX_STREAK_THRESHOLD = "3";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.V173_RELAX_STREAK_THRESHOLD;
    else process.env.V173_RELAX_STREAK_THRESHOLD = prev;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("v173RelaxStreakThreshold defaults sanely", () => {
    delete process.env.V173_RELAX_STREAK_THRESHOLD;
    expect(v173RelaxStreakThreshold()).toBe(3);
  });

  it("grants relaxed once after streak threshold", () => {
    const key = v173DegradationKey("/tools/tiktok-caption-generator", "coffee shop");
    v173RecordStrictFailure(key, tmp);
    v173RecordStrictFailure(key, tmp);
    expect(v173ConsumeRelaxedOnceIfEligible(key, tmp)).toBe(false);
    v173RecordStrictFailure(key, tmp);
    expect(v173ConsumeRelaxedOnceIfEligible(key, tmp)).toBe(true);
    const st = v173LoadDegradationState(tmp);
    expect(st.strict_fail_streak[key] ?? 0).toBe(0);
  });

  it("success clears streak", () => {
    const key = v173DegradationKey("/tools/x", "topic");
    v173RecordStrictFailure(key, tmp);
    v173RecordStrictFailure(key, tmp);
    v173RecordSuccess(key, tmp);
    expect(v173ConsumeRelaxedOnceIfEligible(key, tmp)).toBe(false);
  });
});
