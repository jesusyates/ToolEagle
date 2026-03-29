/**
 * @jest-environment node
 */

import {
  getBuildStaticPageCap,
  limitBuildStaticParams,
  shouldLimitStaticParamBuild
} from "@/lib/build-static-params-limit";

const ORIG = { ...process.env };

function resetEnv() {
  process.env = { ...ORIG };
}

describe("build-static-params-limit", () => {
  afterEach(() => {
    resetEnv();
  });

  it("shouldLimitStaticParamBuild is true when VERCEL=1", () => {
    delete process.env.NEXT_LIMIT_STATIC_PARAMS;
    process.env.VERCEL = "1";
    expect(shouldLimitStaticParamBuild()).toBe(true);
  });

  it("shouldLimitStaticParamBuild is true when NEXT_LIMIT_STATIC_PARAMS=1", () => {
    delete process.env.VERCEL;
    process.env.NEXT_LIMIT_STATIC_PARAMS = "1";
    expect(shouldLimitStaticParamBuild()).toBe(true);
  });

  it("getBuildStaticPageCap is Infinity when not limiting", () => {
    delete process.env.VERCEL;
    delete process.env.NEXT_LIMIT_STATIC_PARAMS;
    expect(getBuildStaticPageCap()).toBe(Number.POSITIVE_INFINITY);
  });

  it("getBuildStaticPageCap respects NEXT_STATIC_PAGE_CAP", () => {
    process.env.VERCEL = "1";
    process.env.NEXT_STATIC_PAGE_CAP = "12";
    expect(getBuildStaticPageCap()).toBe(12);
  });

  it("limitBuildStaticParams returns full list when not limiting", () => {
    delete process.env.VERCEL;
    delete process.env.NEXT_LIMIT_STATIC_PARAMS;
    const xs = Array.from({ length: 100 }, (_, i) => ({ n: i }));
    expect(limitBuildStaticParams(xs)).toHaveLength(100);
  });

  it("limitBuildStaticParams slices when limiting", () => {
    process.env.VERCEL = "1";
    process.env.NEXT_STATIC_PAGE_CAP = "5";
    const xs = Array.from({ length: 20 }, (_, i) => ({ n: i }));
    expect(limitBuildStaticParams(xs)).toEqual([
      { n: 0 },
      { n: 1 },
      { n: 2 },
      { n: 3 },
      { n: 4 }
    ]);
  });
});
