import Link from "next/link";
import { ZhPlatformSubNav } from "@/components/zh/ZhPlatformSubNav";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { ZH } from "@/lib/zh-site/paths";

const XHS_SUB = [
  { href: ZH.xiaohongshu, label: "概览" },
  { href: ZH.xiaohongshu, label: "工具", disabled: true },
  { href: ZH.xiaohongshu, label: "教程", disabled: true }
] as const;

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/xiaohongshu",
  title: zhSeoTitle("小红书专栏（即将上线）"),
  description: "小红书平台栈规划中，当前优先抖音分区。上线后与抖音相同：工具 / 教程 / 工作台分层。"
});

export default function ZhXhsPlaceholderPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <ZhPlatformSubNav platformLabel="小红书" items={[...XHS_SUB]} />

      <div className="flex-1 container max-w-2xl px-4 py-16 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Coming soon</p>
        <h1 className="text-3xl font-bold mt-2">小红书专栏 · 即将上线</h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          按国家站策略，当前全量能力优先投入 <strong>抖音</strong> 分区。小红书将复用同一套信息架构：平台内二级导航（工具 / 教程 / 工作台），避免单页堆叠。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={ZH.douyin} className="inline-flex rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800">
            进入抖音分区 →
          </Link>
          <Link href={ZH.home} className="inline-flex rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            中文首页
          </Link>
        </div>
      </div>
    </main>
  );
}
