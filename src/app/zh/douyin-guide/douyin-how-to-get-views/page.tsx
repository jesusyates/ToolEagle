import Link from "next/link";
import { DouyinGuideArticleShell } from "@/components/zh/cn-platforms/DouyinGuideArticleShell";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-guide/douyin-how-to-get-views",
  title: zhSeoTitle("抖音怎么拿播放 — 进池与测试 · 可执行教程"),
  description:
    "抖音播放量低？先搞清人群与可拍选题，再测开头与描述区；附示例与选题、钩子生成器内链。"
});

export default function Page() {
  return (
    <DouyinGuideArticleShell
      currentHref={ZH.douyinGuideHowToGetViews}
      eyebrow="流量 · 教程"
      title="抖音怎么拿播放：先进池，再谈爆款"
      intro="播放不是「运气」，是「这条视频有没有让人停下来的理由 + 看完的理由」。下面按抖音真实节奏拆：选题、开头、测试，不讲空话。"
    >
      <section>
        <h2 className="text-xl font-bold text-slate-900">一、先回答三个问题</h2>
        <ul className="mt-3 list-disc list-inside space-y-2 text-slate-700">
          <li>
            <strong>谁在看</strong>：同城、宝妈、同行老板——越具体，越能写进前两秒。
          </li>
          <li>
            <strong>凭什么信你</strong>：身份、结果、踩坑经历，任选其一落地，别堆形容词。
          </li>
          <li>
            <strong>看完做什么</strong>：评论填空、二选一、私信关键词——给一条最容易执行的动作。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">二、选题：先「能拍完」，再「想爆」</h2>
        <p className="mt-3 text-slate-700">
          15–45 秒内能讲清一个点，比「大而全」更容易进池。用{" "}
          <Link href={ZH.douyinTopic} className="font-bold text-red-800 hover:underline">
            抖音选题生成器
          </Link>{" "}
          一次多方向，挑最像你能真人讲出来的那条。
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-900">示例（口语）</p>
          <p className="mt-2 text-slate-800">
            「同城餐饮老板：别只拍菜品，先拍「为什么这条街就你家排队」——我帮 3 家店改过开头，私信问最多的不是菜，是排队逻辑。」
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">三、开头：前两秒决定划走还是停留</h2>
        <p className="mt-3 text-slate-700">
          公式很多，核心是<strong>对号入座 + 信息差</strong>。用{" "}
          <Link href={ZH.douyinHook} className="font-bold text-red-800 hover:underline">
            抖音钩子生成器
          </Link>{" "}
          一次多版开场，再 A/B 测试「哪类开头在你账号上更稳」。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">四、测试节奏（每天只改一个变量）</h2>
        <ol className="mt-3 list-decimal list-inside space-y-2 text-slate-700">
          <li>同一天线只改开头，或只改结尾，别全改。</li>
          <li>高评论选题存成清单，下周换钩子再拍一版。</li>
          <li>复盘看：完播、评论关键词、私信话术——比只看播放量有用。</li>
        </ol>
      </section>
    </DouyinGuideArticleShell>
  );
}
