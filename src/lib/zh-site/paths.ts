/**
 * V97.1 — China-local core routes + EN↔ZH path maps for locale switcher & SEO.
 */

export const ZH = {
  home: "/zh",
  support: "/zh/support",
  pricing: "/zh/pricing",
  /** Pro 价值页（与定价拆分） */
  pro: "/zh/pro",
  /** 工具入口聚合 */
  tools: "/zh/tools",
  /** V102.1 — Douyin 宣传首页（大海报） */
  douyin: "/zh/douyin",
  /** V109 — 抖音专属工具索引（顶栏「工具」） */
  douyinTools: "/zh/douyin/tools",
  /** V109 — 抖音可执行教程（方法论） */
  douyinGuide: "/zh/douyin-guide",
  douyinGuideHowToGetViews: "/zh/douyin-guide/douyin-how-to-get-views",
  douyinGuideHookFormula: "/zh/douyin-guide/douyin-hook-formula",
  douyinGuideScriptTemplate: "/zh/douyin-guide/douyin-script-template",
  douyinGuideCaptionTemplate: "/zh/douyin-guide/douyin-caption-template",
  douyinGuideGrowthStrategy: "/zh/douyin-guide/douyin-growth-strategy",
  /** 抖音 · 教程与长文索引 */
  douyinTutorials: "/zh/douyin/tutorials",
  /** 抖音专栏 · 完整工作台（原 /zh/douyin 长内容） */
  douyinHub: "/zh/douyin/hub",
  douyinCaption: "/zh/douyin-caption-generator",
  douyinHook: "/zh/douyin-hook-generator",
  douyinScript: "/zh/douyin-script-generator",
  /** V105.1 — Douyin growth tools */
  douyinTopic: "/zh/douyin-topic-generator",
  douyinCommentCta: "/zh/douyin-comment-cta-generator",
  douyinStructure: "/zh/douyin-structure-generator",
  /** V102.2 — Douyin SEO content cluster */
  douyinHooksSeo: "/zh/douyin-hooks",
  douyinCaptionExamplesSeo: "/zh/douyin-caption-examples",
  douyinScriptTemplatesSeo: "/zh/douyin-script-templates",
  /** V105.2 — Topic ideas SEO */
  douyinTopicIdeasSeo: "/zh/douyin-topic-ideas",
  /** V106.2 — Long-tail SEO (Douyin cluster) */
  douyinContentIdeasSeo: "/zh/douyin-content-ideas",
  douyinViralHooksLongTail: "/zh/douyin-viral-hooks",
  tiktokCaption: "/zh/tiktok-caption-generator",
  hook: "/zh/hook-generator",
  aiCaption: "/zh/ai-caption-generator",
  growthKit: "/zh/tiktok-growth-kit",
  sitemap: "/zh/sitemap",
  privacy: "/zh/privacy",
  terms: "/zh/terms",
  /** 登录后工作台（中文壳） */
  dashboard: "/zh/dashboard",
  dashboardSettings: "/zh/dashboard/settings",
  dashboardDistribution: "/zh/dashboard/distribution",
  xiaohongshu: "/zh/xiaohongshu",
  kuaishou: "/zh/kuaishou"
} as const;


/** EN canonical URLs for hreflang (global site paths). */
export const ZH_TO_EN_CANONICAL: Record<string, string> = {
  "/zh": "/",
  "/zh/pricing": "/pricing",
  "/zh/pro": "/pricing",
  "/zh/tools": "/zh/douyin",
  "/zh/xiaohongshu": "/tiktok-growth-kit",
  "/zh/kuaishou": "/tiktok-growth-kit",
  "/zh/douyin": "/tiktok-growth-kit",
  "/zh/douyin/hub": "/tiktok-growth-kit",
  "/zh/douyin/tutorials": "/tiktok-growth-kit",
  "/zh/douyin/tools": "/tiktok-growth-kit",
  "/zh/douyin-guide": "/tiktok-growth-kit",
  "/zh/douyin-guide/douyin-how-to-get-views": "/tiktok-growth-kit",
  "/zh/douyin-guide/douyin-hook-formula": "/tiktok-growth-kit",
  "/zh/douyin-guide/douyin-script-template": "/tiktok-growth-kit",
  "/zh/douyin-guide/douyin-caption-template": "/tiktok-growth-kit",
  "/zh/douyin-guide/douyin-growth-strategy": "/tiktok-growth-kit",
  "/zh/douyin-caption-generator": "/tools/tiktok-caption-generator",
  "/zh/douyin-hook-generator": "/tools/hook-generator",
  "/zh/douyin-script-generator": "/tools/tiktok-caption-generator",
  "/zh/douyin-topic-generator": "/tiktok-growth-kit",
  "/zh/douyin-comment-cta-generator": "/tiktok-growth-kit",
  "/zh/douyin-structure-generator": "/tiktok-growth-kit",
  "/zh/douyin-hooks": "/tiktok-growth-kit",
  "/zh/douyin-caption-examples": "/tools/tiktok-caption-generator",
  "/zh/douyin-script-templates": "/tools/tiktok-caption-generator",
  "/zh/douyin-topic-ideas": "/tiktok-growth-kit",
  "/zh/douyin-content-ideas": "/tiktok-growth-kit",
  "/zh/douyin-viral-hooks": "/tiktok-growth-kit",
  "/zh/tiktok-caption-generator": "/tools/tiktok-caption-generator",
  "/zh/hook-generator": "/tools/hook-generator",
  "/zh/ai-caption-generator": "/ai-caption-generator",
  "/zh/tiktok-growth-kit": "/tiktok-growth-kit",
  "/zh/login": "/login",
  "/zh/dashboard": "/dashboard",
  "/zh/dashboard/settings": "/dashboard/settings",
  "/zh/dashboard/distribution": "/dashboard/distribution"
};

const EN_TO_ZH_EXACT: Record<string, string> = {
  "/": ZH.home,
  "/about": ZH.home,
  "/pricing": ZH.pricing,
  /** EN 工具索引无 `/zh/tools` 落地页 → 抖音工具工作台 */
  "/tools": ZH.douyin,
  "/tiktok-caption-generator": ZH.tiktokCaption,
  "/hook-generator": ZH.hook,
  "/ai-caption-generator": ZH.aiCaption,
  "/tools/tiktok-caption-generator": ZH.tiktokCaption,
  "/tools/hook-generator": ZH.hook,
  "/tools/ai-caption-generator": ZH.aiCaption,
  "/login": "/zh/login",
  "/dashboard": "/zh/dashboard",
  "/dashboard/settings": "/zh/dashboard/settings",
  "/dashboard/distribution": "/zh/dashboard/distribution",
  /** 与 `app/en/how-to` 对齐：勿生成 `/zh/en/how-to`（无效路由） */
  "/en/how-to": "/zh/how-to/tiktok"
};

/**
 * EN 站路径若直接镜像到 /zh 会落到 SEO 聚合页（如 /tiktok → /zh/tiktok「创作者指南」），
 * 与用户在导航点「中文」时期望进入中文主站不符 → 统一进 /zh。
 */
const EN_PATH_LOCALE_SWITCH_TO_ZH_HOME: ReadonlySet<string> = new Set([
  "/tiktok",
  "/tiktok-tools",
  "/youtube",
  "/instagram",
  "/tiktok-growth-kit"
]);

/** Prefer localized short paths when user switches EN → 中文 from a known page. */
export function enPathToZh(pathname: string): string {
  const p = pathname.replace(/\/$/, "") || "/";
  if (EN_TO_ZH_EXACT[p]) return EN_TO_ZH_EXACT[p];
  if (EN_PATH_LOCALE_SWITCH_TO_ZH_HOME.has(p)) return "/zh";

  /** `/en/how-to/[slug]` → `/zh/how-to/[slug]`（与 `app/zh/how-to/[topic]` 对齐） */
  if (p.startsWith("/en/how-to/")) {
    const rest = p.slice("/en/how-to/".length);
    const slug = rest.split("/").filter(Boolean)[0];
    if (slug) return `/zh/how-to/${encodeURIComponent(slug)}`;
  }

  const mirrored = `/zh${p === "/" ? "" : p}`;
  /**
   * 禁止把 `/en/...`、`/es/...` 直接前缀到 `/zh`（会得到 `/zh/en/...` 等无效路径）。
   * 未知 EN 路径统一回中文首页，避免空白/404。
   */
  if (mirrored.startsWith("/zh/en") || mirrored.startsWith("/zh/es")) {
    return "/zh";
  }

  return mirrored;
}

/** Map /zh/* back to a sensible EN URL when user switches 中文 → EN. */
export function zhPathToEn(pathname: string): string {
  const p = pathname.replace(/\/$/, "") || "/zh";
  const hit = ZH_TO_EN_CANONICAL[p];
  if (hit) return hit;
  if (p.startsWith("/zh")) {
    const rest = p.slice(3) || "/";
    return rest === "/" ? "/" : rest;
  }
  return "/";
}
