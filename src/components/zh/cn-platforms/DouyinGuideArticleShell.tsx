import type { ReactNode } from "react";
import Link from "next/link";
import { ZH } from "@/lib/zh-site/paths";
import { DouyinSeoToolLinksStrip } from "./DouyinSeoToolLinksStrip";

const MORE_GUIDES = [
  { href: ZH.douyinGuideHowToGetViews, label: "怎么拿播放" },
  { href: ZH.douyinGuideHookFormula, label: "钩子公式" },
  { href: ZH.douyinGuideScriptTemplate, label: "口播脚本模板" },
  { href: ZH.douyinGuideCaptionTemplate, label: "描述区模板" },
  { href: ZH.douyinGuideGrowthStrategy, label: "账号增长策略" }
] as const;

type Props = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  /** 当前页 href，用于交叉链接去重 */
  currentHref: string;
};

export function DouyinGuideArticleShell({ eyebrow, title, intro, children, currentHref }: Props) {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <article className="flex-1 container max-w-3xl px-4 pt-10 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-red-800">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">{intro}</p>

        <div className="mt-10 space-y-8 text-slate-800 leading-relaxed">{children}</div>

        <DouyinSeoToolLinksStrip />

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm">
          <p className="font-bold text-slate-900">更多教程</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {MORE_GUIDES.filter((g) => g.href !== currentHref).map((g) => (
              <li key={g.href}>
                <Link
                  href={g.href}
                  className="inline-flex rounded-lg border border-white bg-white px-3 py-1.5 font-medium text-red-900 hover:border-red-200"
                >
                  {g.label} →
                </Link>
              </li>
            ))}
          </ul>
          <Link href={ZH.douyin} className="mt-4 inline-block text-sm font-semibold text-red-800 hover:underline">
            ← 返回抖音创作入口
          </Link>
        </section>
      </article>
    </main>
  );
}
