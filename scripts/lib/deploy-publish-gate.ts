/**
 * 部署门禁：等待站点可访问，再允许 staged → 正式目录的 move。
 */

import { SITE_URL } from "../../src/config/site";

export type GateWaitOptions = {
  /** 默认 SITE_URL */
  siteUrl?: string;
  maxWaitMs?: number;
  pollIntervalMs?: number;
};

const DEFAULT_MAX = Number(process.env.DEPLOY_GATE_MAX_WAIT_MS ?? 600_000);
const DEFAULT_POLL = Number(process.env.DEPLOY_GATE_POLL_MS ?? 5_000);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOnce(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { redirect: "follow", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** 轮询直到站点根路径 200 或超时。 */
export async function waitForSiteReachable(opts?: GateWaitOptions): Promise<boolean> {
  const base = (opts?.siteUrl ?? SITE_URL).replace(/\/$/, "");
  const maxWait = opts?.maxWaitMs ?? DEFAULT_MAX;
  const poll = opts?.pollIntervalMs ?? DEFAULT_POLL;
  const deadline = Date.now() + maxWait;
  while (Date.now() < deadline) {
    if (await fetchOnce(`${base}/`)) return true;
    await sleep(poll);
  }
  return false;
}

export type VerifyPathsResult = { ok: boolean; failures: string[] };

/**
 * 部署后冒烟：首页、guides 列表、中文列表、guides 与 zh 的 sitemap 可访问。
 * 不依赖「尚未 promote 的」单篇详情 URL（staged 未进 sent 前线上无该 slug）。
 */
export async function verifyPostDeployGuidesSurface(
  siteUrl?: string
): Promise<VerifyPathsResult> {
  const base = (siteUrl ?? SITE_URL).replace(/\/$/, "");
  const paths = [
    "/",
    "/guides",
    "/zh/guides",
    "/sitemap-guides.xml",
    "/sitemap-zh.xml"
  ];
  const failures: string[] = [];
  for (const p of paths) {
    const ok = await fetchOnce(`${base}${p}`);
    if (!ok) failures.push(`${base}${p}`);
  }
  return { ok: failures.length === 0, failures };
}
