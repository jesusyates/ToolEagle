import Link from "next/link";
import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";
import { DouyinSeoClusterNav } from "@/components/zh/cn-platforms/DouyinSeoClusterNav";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";
import { DOUYIN_HOOK_EXAMPLES } from "@/lib/zh-site/douyin-example-library";
import { DouyinSeoToolLinksStrip } from "@/components/zh/cn-platforms/DouyinSeoToolLinksStrip";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-hooks",
  title: zhSeoTitle("抖音钩子开头模板 & 爆款开头句式 — 停滑前两秒 · 涨粉转化"),
  description:
    "抖音钩子怎么写？按带货、情绪、干货、个人IP、娱乐五类整理可套用开头模板；附「为什么这个开头能爆」与涨粉案例向说明，并链接站内钩子生成器。"
});

export default function ZhDouyinHooksSeoPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <article className="flex-1 container pt-10 pb-16 max-w-3xl">
        <div className="mb-6">
          <ZhDouyinTrafficInjectionBanner />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-800">抖音 SEO · 钩子</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
          抖音钩子开头模板：让前两秒停滑、后面才谈涨粉与转化
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          抖音不是「写得好」就行，是<strong>前两秒对不对</strong>决定有没有人看完。下面模板按常见赛道拆分，可直接改词进生成器；想一键出多版，用{" "}
          <Link href={ZH.douyinHook} className="text-red-800 font-bold hover:underline">
            抖音钩子生成器
          </Link>
          。
        </p>

        <section className="mt-10 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">一、钩子常见结构（可混用）</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700 text-sm leading-relaxed">
            <li>
              <strong>身份 + 可验证结果 + 悬念</strong>：适合同城门店、带货测评。
            </li>
            <li>
              <strong>痛点归因 + 反常识</strong>：适合知识口播、运营教学。
            </li>
            <li>
              <strong>替观众说心里话</strong>：适合情绪、关系、成长类。
            </li>
            <li>
              <strong>挑战 / 游戏化</strong>：适合娱乐、剧情、合拍引流。
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">二、分赛道可直接改的钩子示例</h2>
          <p className="text-sm text-slate-600 mb-4">
            每条都回答两件事：<span className="font-semibold text-red-900">为什么这个开头能爆</span>、
            <span className="font-semibold text-red-900">用这个文案涨粉案例</span>（同类账号常见反馈，非承诺数据）。
          </p>
          <ul className="space-y-5">
            {DOUYIN_HOOK_EXAMPLES.map((h, i) => (
              <li key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                <p className="text-xs font-bold text-red-800">{h.niche}</p>
                <p className="mt-2 font-medium text-slate-900">{h.text}</p>
                <p className="mt-2 text-slate-700">
                  <span className="font-semibold">为什么能爆：</span>
                  {h.whyExplodes}
                </p>
                <p className="mt-1 text-slate-600">
                  <span className="font-semibold">案例向参考：</span>
                  {h.growthCase}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-sm text-amber-950">
          <h2 className="text-lg font-bold">三、从模板到成片：推荐路径</h2>
          <ol className="mt-3 list-decimal list-inside space-y-2">
            <li>在本页挑 2–3 条最接近你赛道的句式，改成人话。</li>
            <li>
              打开<strong className="text-amber-950">抖音钩子生成器</strong>
              （见上文入口），输入你的选题，一次拿多版开场 + 配套文案块。
            </li>
            <li>
              需要描述区对齐时，继续用{" "}
              <Link href={ZH.douyinCaption} className="font-bold underline">
                抖音文案包
              </Link>{" "}
              或查看{" "}
              <Link href={ZH.douyinCaptionExamplesSeo} className="font-bold underline">
                文案范例库
              </Link>
              。
            </li>
          </ol>
        </section>

        <DouyinSeoToolLinksStrip />

        <div className="mt-12">
          <DouyinSeoClusterNav current="hooks" />
        </div>

        <p className="mt-8 text-sm text-slate-500">
          回到{" "}
          <Link href={ZH.douyinHub} className="text-red-800 font-medium hover:underline">
            抖音创作者增长中心
          </Link>
          查看完整工作流与 Pro 权益。
        </p>
      </article>
    </main>
  );
}
