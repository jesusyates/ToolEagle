import Link from "next/link";
import { DouyinGuideArticleShell } from "@/components/zh/cn-platforms/DouyinGuideArticleShell";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-guide/douyin-caption-template",
  title: zhSeoTitle("抖音描述区文案模板 — 话题标签 · 转化导向"),
  description:
    "抖音描述区怎么写？人群对位、可执行下一步、与开头一致；附公式示例与文案包、评论引导生成器内链。"
});

export default function Page() {
  return (
    <DouyinGuideArticleShell
      currentHref={ZH.douyinGuideCaptionTemplate}
      eyebrow="文案 · 教程"
      title="描述区模板：补正片没说完的那半步"
      intro="描述区不是复述，而是「谁适合、下一步做什么、评论留什么关键词」。第一句尽量与口播钩子同向，减少跳失。"
    >
      <section>
        <h2 className="text-xl font-bold text-slate-900">一、三句话结构（可扩展）</h2>
        <ul className="mt-3 list-disc list-inside space-y-2 text-slate-700">
          <li>
            <strong>第一句</strong>：对齐人群或痛点，让人觉得「在说给我听」。
          </li>
          <li>
            <strong>第二句</strong>：可执行下一步（收藏 / 评论关键词 / 私信领什么）。
          </li>
          <li>
            <strong>第三句</strong>：标签与话题——3 个精准词 + 1 个同城或行业词，别堆满。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">二、示例（带货 / 同城）</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800">
            「油皮别乱买｜我两周只换洁面｜闭口少了但不一定适合你｜评论「油皮」我发对照表。#油皮护肤 #护肤干货 #同城」
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800">
            「同城餐饮老板｜别只拍菜品｜先拍「为什么排队」｜评论城市名，我按同城流量给你改一版开头。#同城餐饮 #抖音运营」
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">三、配套工具</h2>
        <p className="mt-3 text-slate-700">
          一键出钩子 + 口播 + 描述区 + 评论引导：{" "}
          <Link href={ZH.douyinCaption} className="font-bold text-red-800 hover:underline">
            抖音文案包生成器
          </Link>
          。
          单独拉评论互动：{" "}
          <Link href={ZH.douyinCommentCta} className="font-bold text-red-800 hover:underline">
            评论引导生成器
          </Link>
          。更多公式见{" "}
          <Link href={ZH.douyinCaptionExamplesSeo} className="font-bold text-red-800 hover:underline">
            文案范例库
          </Link>
          。
        </p>
      </section>
    </DouyinGuideArticleShell>
  );
}
