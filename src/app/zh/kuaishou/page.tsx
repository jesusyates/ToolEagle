import Link from "next/link";
import { ZhPlatformSubNav } from "@/components/zh/ZhPlatformSubNav";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { ZH } from "@/lib/zh-site/paths";

const KS_SUB = [
  { href: ZH.kuaishou, label: "概览" },
  { href: ZH.kuaishou, label: "工具", disabled: true },
  { href: ZH.kuaishou, label: "教程", disabled: true }
] as const;

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/kuaishou",
  title: zhSeoTitle("快手专栏（即将上线）"),
  description: "快手平台栈规划中。上线后与抖音、小红书同一套分区模型。"
});

export default function ZhKuaishouPlaceholderPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <ZhPlatformSubNav platformLabel="快手" items={[...KS_SUB]} />

      <div className="flex-1 container max-w-2xl px-4 py-16 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Coming soon</p>
        <h1 className="text-3xl font-bold mt-2">快手专栏 · 即将上线</h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          快手与小红书同属后续本土平台栈；上线后同样采用<strong>工具 / 教程 / 工作台</strong>分层。当前请优先使用{" "}
          <strong>抖音分区</strong>。
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
