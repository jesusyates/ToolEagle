/**
 * V91: Aggressive distribution pack — 10 Reddit / 10 X / 10 Quora per top money page.
 * Tagged "Injection Priority" for dashboard + API consumers.
 */

import { BASE_URL } from "@/config/site";
import { getShareContentForPage } from "@/lib/revenue-share-content";
import { getEnHowToContent } from "@/lib/en-how-to-content";
import type { InjectionMoneyPage } from "@/lib/traffic-injection-data";

const REDDIT_HOOKS = [
  "实测有效：",
  "副业向｜",
  "新手友好：",
  "复盘：",
  "一周数据：",
  "别踩坑：",
  "可复制流程：",
  "Ask Me Anything 补充：",
  "长文干货：",
  "工具+方法："
];

const X_HOOKS = [
  "🧵 ",
  "🔥 ",
  "Tip: ",
  "Thread — ",
  "Save this: ",
  "Creator hack: ",
  "Monetization: ",
  "Step-by-step: ",
  "Free guide: ",
  "Bookmark — "
];

const QUORA_HOOKS_ZH = [
  "从我的实践来看，",
  "简单说下结论：",
  "这个问题我拆成三步：",
  "如果你刚开始做内容，",
  "变现角度回答：",
  "结合工具和经验：",
  "补充一个被忽略的点：",
  "可执行的清单：",
  "我会这样落地：",
  "参考这篇完整指南："
];

const QUORA_HOOKS_EN = [
  "In my experience, ",
  "Short answer: ",
  "I break this into three steps: ",
  "If you're just starting, ",
  "From a monetization angle: ",
  "Combining tools and workflow: ",
  "One overlooked point: ",
  "Actionable checklist: ",
  "How I'd execute this: ",
  "Full write-up here: "
];

function buildZhPack(slug: string, keyword: string) {
  const base = getShareContentForPage(slug, keyword);
  const reddit = REDDIT_HOOKS.map((h, i) => ({
    id: `r-${i + 1}`,
    label: "Injection Priority",
    body: `${h}\n\n${base.reddit}`
  }));
  const x = X_HOOKS.map((h, i) => ({
    id: `x-${i + 1}`,
    label: "Injection Priority",
    body: `${h}${base.xThread}`
  }));
  const quora = QUORA_HOOKS_ZH.map((h, i) => ({
    id: `q-${i + 1}`,
    label: "Injection Priority",
    body: `${h}\n\n${base.quora}`
  }));
  return { reddit, x: x, quora };
}

function buildEnPack(slug: string) {
  const c = getEnHowToContent(slug);
  const title = c?.title ?? slug;
  const one = c?.directAnswer?.slice(0, 200) || c?.description?.slice(0, 200) || title;
  const url = `${BASE_URL}/en/how-to/${slug}`;
  const redditBody = `Sharing what worked for me (ToolEagle):\n\n${one}\n\nFull guide: ${url}`;
  const reddit = REDDIT_HOOKS.map((h, i) => ({
    id: `r-${i + 1}`,
    label: "Injection Priority",
    body: `${h} ${title}\n\n${redditBody}`
  }));
  const thread = `${title}\n\n${one}\n\n→ ${url}`;
  const x = X_HOOKS.map((h, i) => ({
    id: `x-${i + 1}`,
    label: "Injection Priority",
    body: `${h}${thread}`
  }));
  const quora = QUORA_HOOKS_EN.map((h, i) => ({
    id: `q-${i + 1}`,
    label: "Injection Priority",
    body: `${h}${one}\n\nRead the full guide: ${url}`
  }));
  return { reddit, x, quora };
}

export type InjectionPackPage = {
  slug: string;
  pageType: "zh-search" | "en-how-to";
  title: string;
  pageUrl: string;
  tag: "Injection Priority";
  reddit: { id: string; label: string; body: string }[];
  x: { id: string; label: string; body: string }[];
  quora: { id: string; label: string; body: string }[];
};

export function buildInjectionDistributionPack(pages: InjectionMoneyPage[]): InjectionPackPage[] {
  const top5 = pages.slice(0, 5);
  return top5.map((p) => {
    const packs =
      p.pageType === "en-how-to"
        ? buildEnPack(p.slug)
        : buildZhPack(p.slug, p.keyword);
    return {
      slug: p.slug,
      pageType: p.pageType,
      title: p.title,
      pageUrl: p.href,
      tag: "Injection Priority",
      ...packs
    };
  });
}
