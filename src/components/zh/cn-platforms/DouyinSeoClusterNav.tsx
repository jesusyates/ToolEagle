import Link from "next/link";
import { ZH } from "@/lib/zh-site/paths";

const SEO = {
  hooks: { href: ZH.douyinHooksSeo, label: "钩子模板库" },
  captions: { href: ZH.douyinCaptionExamplesSeo, label: "文案范例库" },
  scripts: { href: ZH.douyinScriptTemplatesSeo, label: "口播脚本库" },
  /** V105.2 */
  topicIdeas: { href: ZH.douyinTopicIdeasSeo, label: "选题灵感库" },
  /** V106.2 */
  contentIdeas: { href: ZH.douyinContentIdeasSeo, label: "内容选题灵感" },
  viralHooksLong: { href: ZH.douyinViralHooksLongTail, label: "爆款钩子灵感" }
} as const;

type Current = keyof typeof SEO | "hub";

type Props = { current: Current };

/** V102.2 — Internal cluster: hub ↔ tools ↔ SEO content pages */
export function DouyinSeoClusterNav({ current }: Props) {
  const items: { href: string; label: string; active: boolean }[] = [
    { href: ZH.douyinHub, label: "抖音增长中心", active: current === "hub" },
    { href: ZH.douyinHook, label: "钩子生成器", active: false },
    { href: ZH.douyinCaption, label: "文案包生成", active: false },
    { href: ZH.douyinScript, label: "口播脚本生成", active: false },
    { href: ZH.douyinTopic, label: "选题生成", active: false },
    { href: ZH.douyinCommentCta, label: "评论引导", active: false },
    { href: ZH.douyinStructure, label: "内容结构", active: false },
    { href: SEO.hooks.href, label: SEO.hooks.label, active: current === "hooks" },
    { href: SEO.captions.href, label: SEO.captions.label, active: current === "captions" },
    { href: SEO.scripts.href, label: SEO.scripts.label, active: current === "scripts" },
    { href: SEO.topicIdeas.href, label: SEO.topicIdeas.label, active: current === "topicIdeas" },
    { href: SEO.contentIdeas.href, label: SEO.contentIdeas.label, active: current === "contentIdeas" },
    { href: SEO.viralHooksLong.href, label: SEO.viralHooksLong.label, active: current === "viralHooksLong" },
    { href: `${ZH.pricing}#cn-pro-checkout`, label: "Pro 定价", active: false }
  ];

  return (
    <nav
      aria-label="抖音专栏内链"
      className="rounded-2xl border border-red-100 bg-red-50/40 p-4"
    >
      <p className="text-xs font-bold text-red-950 mb-3">站内导航 · 抖音增长集群</p>
      <ul className="flex flex-wrap gap-2 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={
                item.active
                  ? "inline-flex rounded-full bg-red-700 text-white px-3 py-1 font-semibold"
                  : "inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-800 hover:border-red-300 hover:bg-red-50"
              }
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
