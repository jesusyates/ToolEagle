import Link from "next/link";
import { DouyinGuideArticleShell } from "@/components/zh/cn-platforms/DouyinGuideArticleShell";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-guide/douyin-growth-strategy",
  title: zhSeoTitle("抖音账号增长策略 — 日更 · 测试 · 复盘"),
  description:
    "抖音账号怎么长期增长？日更节奏、单变量测试、复盘指标；附工作台、定价与方法论内链。"
});

export default function Page() {
  return (
    <DouyinGuideArticleShell
      currentHref={ZH.douyinGuideGrowthStrategy}
      eyebrow="运营 · 教程"
      title="账号增长：把随机爆款变成流程"
      intro="增长不是「多拍」，是「知道哪条有效、为什么有效、下周怎么复用」。下面按清单执行即可。"
    >
      <section>
        <h2 className="text-xl font-bold text-slate-900">一、日更节奏（能跑比完美重要）</h2>
        <ul className="mt-3 list-disc list-inside space-y-2 text-slate-700">
          <li>同一天线只测一个变量：开头、结尾、或选题，三选一。</li>
          <li>高评论选题存成「可复拍清单」，换钩子再拍一版。</li>
          <li>别同时追「播放、涨粉、带货」三个指标，先定一个主目标。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">二、复盘看三件事</h2>
        <ol className="mt-3 list-decimal list-inside space-y-2 text-slate-700">
          <li>完播：中段是否信息过载，气口够不够。</li>
          <li>评论关键词：观众在问什么，下一条直接答。</li>
          <li>私信话术：线索在评论与私信里，不在点赞里。</li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">三、工作台与算力</h2>
        <p className="mt-3 text-slate-700">
          用{" "}
          <Link href={ZH.douyinHub} className="font-bold text-red-800 hover:underline">
            抖音增长工作台
          </Link>{" "}
          串任务；需要 Pro 与算力时看{" "}
          <Link href={ZH.pricing} className="font-bold text-red-800 hover:underline">
            定价
          </Link>
          与{" "}
          <Link href={ZH.pro} className="font-bold text-red-800 hover:underline">
            Pro 说明
          </Link>
          。方法论与短视频通用增长可参考{" "}
          <Link href={ZH.growthKit} className="font-bold text-red-800 hover:underline">
            短视频增长指南
          </Link>
          。
        </p>
      </section>
    </DouyinGuideArticleShell>
  );
}
