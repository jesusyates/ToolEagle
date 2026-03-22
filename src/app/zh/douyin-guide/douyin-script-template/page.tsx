import Link from "next/link";
import { DouyinGuideArticleShell } from "@/components/zh/cn-platforms/DouyinGuideArticleShell";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-guide/douyin-script-template",
  title: zhSeoTitle("抖音口播脚本模板 — 分段气口 · 完播导向"),
  description:
    "抖音口播脚本怎么写？停滑→信任→单点方法→证据→收口；附气口示例与口播脚本、结构生成器内链。"
});

export default function Page() {
  return (
    <DouyinGuideArticleShell
      currentHref={ZH.douyinGuideScriptTemplate}
      eyebrow="口播 · 教程"
      title="口播脚本骨架：每 5–10 秒一个气口"
      intro="口播不是作文，是「观众跟得上、愿意看完」。下面按抖音常见结构拆五段，可直接套进提词器。"
    >
      <section>
        <h2 className="text-xl font-bold text-slate-900">一、底层顺序（大多数能转化的口播）</h2>
        <p className="mt-3 font-medium text-slate-900">停滑 → 建立信任/情绪 → 讲清一个方法或卖点 → 上证据 → 收口指令</p>
        <p className="mt-2 text-slate-700">带货更重证据，情绪更重命名，娱乐更重「节奏与梗」。</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">二、五段骨架（可按篇幅压缩）</h2>
        <ol className="mt-3 list-decimal list-inside space-y-2 text-slate-700">
          <li>
            <strong>0–2 秒</strong>：停滑（身份/结果/悬念，别「大家好」）。
          </li>
          <li>
            <strong>2–10 秒</strong>：一句话建立信任：你是谁、帮谁、凭什么。
          </li>
          <li>
            <strong>中段</strong>：最多三个信息点，每点一句人话，中间留气口。
          </li>
          <li>
            <strong>证据</strong>：数字、前后对比、用户原话截一句。
          </li>
          <li>
            <strong>结尾</strong>：只给一个动作：评论填空、二选一、私信关键词。
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">三、示例（节奏感）</h2>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 leading-relaxed">
          第 1 句：「你是不是也卡在第三条就划走？」——对号入座。
          <br />
          第 2 句：「我上周只改了一个开头，完播就上去了。」——结果前置。
          <br />
          第 3–5 句：只讲一个改法，别堆三个观点。
          <br />
          最后：「你更卡开头还是结尾？评出来我下期只讲一个。」——评论指令。
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">四、配套工具</h2>
        <p className="mt-3 text-slate-700">
          直接生成可念全文：{" "}
          <Link href={ZH.douyinScript} className="font-bold text-red-800 hover:underline">
            抖音口播脚本生成器
          </Link>
          ；需要整段结构骨架：{" "}
          <Link href={ZH.douyinStructure} className="font-bold text-red-800 hover:underline">
            内容结构生成器
          </Link>
          。更多分镜模板见{" "}
          <Link href={ZH.douyinScriptTemplatesSeo} className="font-bold text-red-800 hover:underline">
            口播脚本模板库
          </Link>
          。
        </p>
      </section>
    </DouyinGuideArticleShell>
  );
}
