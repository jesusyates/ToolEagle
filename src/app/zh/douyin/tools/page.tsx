import Link from "next/link";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";
import { DOUYIN_MULTI_PLATFORM_TOOL_PAGES } from "@/lib/zh-site/cn-platforms/douyin-scenes";

const DOUYIN_NATIVE = [
  { href: ZH.douyinTopic, label: "抖音选题生成器", sub: "赛道 + 角度，一次多方向" },
  { href: ZH.douyinHook, label: "抖音钩子生成器", sub: "完播率开头 · 强钩子" },
  { href: ZH.douyinScript, label: "抖音口播脚本生成器", sub: "分段 + 气口 + 可念全文" },
  { href: ZH.douyinCaption, label: "抖音文案包生成器", sub: "描述区 + 话题标签" },
  { href: ZH.douyinCommentCta, label: "抖音评论引导生成器", sub: "互动设计 · 促评话术" },
  { href: ZH.douyinStructure, label: "抖音内容结构生成器", sub: "开头—中段—结尾" }
] as const;

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin/tools",
  title: zhSeoTitle("抖音工具索引 — 专属生成器 · 创作操作系统"),
  description:
    "抖音专属六件套：选题、钩子、口播脚本、文案包、评论引导、内容结构；另附历史多平台通用工具入口。与 /zh/douyin 场景矩阵一致。"
});

export default function ZhDouyinToolsIndexPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">

      <div className="flex-1 container max-w-3xl px-4 py-10 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-800">抖音 · 工具索引</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">抖音专属生成器</h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          命名统一为 <code className="rounded bg-slate-100 px-1 text-sm">/zh/douyin-*-generator</code>
          ，输出按抖音完播、评论与带货语境来写。建议先回{" "}
          <Link href={ZH.douyin} className="font-semibold text-red-800 hover:underline">
            抖音工具首页
          </Link>{" "}
          按场景选能力。
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">六件套（首批）</h2>
          <ul className="space-y-3">
            {DOUYIN_NATIVE.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="block rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4 transition hover:border-red-200 hover:bg-red-50/40"
                >
                  <span className="font-semibold text-red-950">{t.label}</span>
                  <span className="mt-1 block text-sm text-slate-600">{t.sub}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold text-slate-900">多平台通用（历史入口）</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            以下仍为英文站工具子路径，可与抖音脚本互拷或分发时用；主战场建议优先六件套。
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {DOUYIN_MULTI_PLATFORM_TOOL_PAGES.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 hover:border-slate-300"
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-12 text-sm text-slate-500">
          <Link href={ZH.douyinGuide} className="font-medium text-red-800 hover:underline">
            教程目录
          </Link>
          {" · "}
          <Link href={ZH.douyinTutorials} className="font-medium text-red-800 hover:underline">
            长尾索引
          </Link>
        </p>
      </div>

    </main>
  );
}
