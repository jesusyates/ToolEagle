/**
 * V102.1 — China platform stack: one platform at a time (Douyin first).
 *
 * Route convention (tool pages):
 *   /zh/{platformId}-{tool-kind}-generator
 *   e.g. /zh/douyin-caption-generator
 *
 * 平台首页（说明 + 按场景聚合工具与长文）:
 *   /zh/{platformId}  e.g. /zh/douyin
 *
 * Future: add Xiaohongshu / Kuaishou hubs + tools by copying Douyin patterns;
 * keep `CnPlatformMeta` entries and extend `isPlatformLaunched`.
 */

export type CnPlatformId = "douyin" | "xiaohongshu" | "kuaishou";

export type CnPlatformMeta = {
  id: CnPlatformId;
  /** URL segment and prefix for tool routes */
  routePrefix: string;
  labelZh: string;
  labelEn: string;
  /** Primary entry under /zh (landing or hub; Douyin uses /zh/douyin + /zh/douyin/hub) */
  hubPath: string;
  /** When false, hub/tools are scaffold-only (optional placeholder pages). */
  launched: boolean;
};

export const CN_PLATFORMS: Record<CnPlatformId, CnPlatformMeta> = {
  douyin: {
    id: "douyin",
    routePrefix: "douyin",
    labelZh: "抖音",
    labelEn: "Douyin",
    hubPath: "/zh/douyin",
    launched: true
  },
  xiaohongshu: {
    id: "xiaohongshu",
    routePrefix: "xiaohongshu",
    labelZh: "小红书",
    labelEn: "Xiaohongshu",
    hubPath: "/zh/xiaohongshu",
    launched: false
  },
  kuaishou: {
    id: "kuaishou",
    routePrefix: "kuaishou",
    labelZh: "快手",
    labelEn: "Kuaishou",
    hubPath: "/zh/kuaishou",
    launched: false
  }
};

export function isPlatformLaunched(id: CnPlatformId): boolean {
  return CN_PLATFORMS[id].launched;
}

/** Example tool slug pattern for a launched platform */
export function cnPlatformToolPath(platform: CnPlatformId, toolKind: "caption" | "hook" | "script"): string {
  const p = CN_PLATFORMS[platform].routePrefix;
  return `/zh/${p}-${toolKind}-generator`;
}
