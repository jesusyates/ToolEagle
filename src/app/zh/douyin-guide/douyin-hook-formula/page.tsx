import Link from "next/link";
import { DouyinGuideArticleShell } from "@/components/zh/cn-platforms/DouyinGuideArticleShell";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-guide/douyin-hook-formula",
  title: zhSeoTitle("抖音爆款钩子公式 — 停滑前两秒 · 可套用"),
  description:
    "抖音钩子怎么写？身份锚定、结果前置、悬念与对号入座；附示例与钩子、结构、文案生成器内链。"
});

export default function Page() {
  return (
    <DouyinGuideArticleShell
      currentHref={ZH.douyinGuideHookFormula}
      eyebrow="钩子 · 教程"
      title="爆款钩子公式：让前两秒像「说给观众听的」"
      intro="钩子不是文采，是「观众为什么要在这一刻停下滑」。下面四条可混用，全部按抖音口语来写。"
    >
      <section>
        <h2 className="text-xl font-bold text-slate-900">一、身份 + 可验证结果 + 悬念</h2>
        <p className="mt-3 text-slate-700">
          适合同城、带货、门店类：先让人知道「你是谁」，再给「可验证结果」，最后留一句没说完的悬念。
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          「我在三线城市做美甲店——上周同城预约翻了一倍，不是靠投流，是靠我把第二句改成了「你最怕踩的坑」。」
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">二、痛点归因 + 反常识</h2>
        <p className="mt-3 text-slate-700">
          适合知识口播：把「为什么你做了还没结果」说清楚，再给反常识结论。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">三、替观众说心里话</h2>
        <p className="mt-3 text-slate-700">
          适合情绪、关系类：先命名情绪，再给一个轻量行动，而不是只卖惨。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">四、一键多版 + 模板库</h2>
        <p className="mt-3 text-slate-700">
          用{" "}
          <Link href={ZH.douyinHook} className="font-bold text-red-800 hover:underline">
            抖音钩子生成器
          </Link>{" "}
          一次拿多版开场；需要更多句式可看{" "}
          <Link href={ZH.douyinHooksSeo} className="font-bold text-red-800 hover:underline">
            钩子模板库
          </Link>
          。把开头接成整段结构，用{" "}
          <Link href={ZH.douyinStructure} className="font-bold text-red-800 hover:underline">
            内容结构生成器
          </Link>{" "}
          与{" "}
          <Link href={ZH.douyinScript} className="font-bold text-red-800 hover:underline">
            口播脚本生成器
          </Link>
          。
        </p>
      </section>
    </DouyinGuideArticleShell>
  );
}
