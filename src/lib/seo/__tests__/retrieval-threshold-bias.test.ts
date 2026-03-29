/**
 * @jest-environment node
 */

import path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bias = require(path.join(process.cwd(), "scripts/lib/retrieval-threshold-bias.cjs")) as {
  applyBoundedBiasToThresholds: (
    t1: number,
    t2a: number,
    t2b: number,
    ctx: { datasetReady: boolean; strongWorkflow: boolean }
  ) => { t1: number; t2a: number; t2b: number; biasApplied: boolean; biasFactor: number };
  BIAS_MULT: number;
  MIN_BIAS_MULT: number;
};

describe("retrieval-threshold-bias.cjs", () => {
  it("does not apply bias when dataset not ready context false", () => {
    const o = bias.applyBoundedBiasToThresholds(0.35, 0.12, 0.08, {
      datasetReady: false,
      strongWorkflow: true
    });
    expect(o.biasApplied).toBe(false);
    expect(o.t1).toBe(0.35);
  });

  it("does not apply bias when workflow not strong", () => {
    const o = bias.applyBoundedBiasToThresholds(0.35, 0.12, 0.08, {
      datasetReady: true,
      strongWorkflow: false
    });
    expect(o.biasApplied).toBe(false);
  });

  it("applies bounded multiplier when dataset ready and strong workflow", () => {
    const o = bias.applyBoundedBiasToThresholds(0.35, 0.12, 0.08, {
      datasetReady: true,
      strongWorkflow: true
    });
    expect(o.biasApplied).toBe(true);
    expect(o.biasFactor).toBe(bias.BIAS_MULT);
    expect(o.t1).toBeCloseTo(0.35 * bias.BIAS_MULT, 8);
    expect(o.t1).toBeGreaterThanOrEqual(0.35 * bias.MIN_BIAS_MULT - 1e-9);
  });
});
