import Link from "next/link";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";
import { getDouyinTutorialIndex } from "@/lib/zh-site/cn-platforms/douyin-tutorial-index";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin/tutorials",
  title: zhSeoTitle("抖音 · 教程与长文"),
  description:
    "抖音专栏内全部教程、范例与 SEO 长文索引：按场景归类，工具入口见「工具」页。"
});

export default function ZhDouyinTutorialsPage() {
  const rows = getDouyinTutorialIndex();
  const byScene = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byScene.get(r.sceneTitle) ?? [];
    list.push(r);
    byScene.set(r.sceneTitle, list);
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">

      <div className="flex-1">
        <section className="border-b border-slate-100 bg-gradient-to-b from-red-50/40 to-white">
          <div className="container max-w-4xl px-4 py-10 md:py-12">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-800">抖音 · 教程</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">教程与长文</h1>
            <p className="mt-3 max-w-2xl text-slate-600 leading-relaxed">
              以下为抖音语境下的<strong>可执行教程</strong>、范例与可读长文；需要一键生成请回{" "}
              <Link href={ZH.douyin} className="font-semibold text-red-800 hover:underline">
                抖音工具首页
              </Link>
              或查看{" "}
              <Link href={ZH.douyinGuide} className="font-semibold text-red-800 hover:underline">
                教程目录
              </Link>
              。
            </p>
          </div>
        </section>

        <div className="container max-w-4xl px-4 py-10 space-y-10 pb-16">
          {[...byScene.entries()].map(([sceneTitle, items]) => (
            <section key={sceneTitle}>
              <h2 className="text-lg font-bold text-slate-900 border-l-4 border-red-600 pl-3">{sceneTitle}</h2>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition hover:border-red-200 hover:bg-red-50/40"
                    >
                      <span className="font-medium text-slate-900 group-hover:text-red-900">{item.label}</span>
                      <span className="text-xs text-slate-500">
                        {item.kind === "guide" ? "教程 →" : "阅读 →"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

    </main>
  );
}
