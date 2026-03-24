"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ZH } from "@/lib/zh-site/paths";

const STEPS: Record<string, { title: string; desc: string; href: string; cta: string }> = {
  "douyin-topic-generator": {
    title: "下一步：把选题落成「能停滑的开头」",
    desc: "选好 1–2 条选题后，去钩子页写前两秒怎么说。",
    href: ZH.douyinHook,
    cta: "去抖音钩子生成器"
  },
  "douyin-hook-generator": {
    title: "下一步：对齐整条结构再写正文",
    desc: "开头定了之后，用结构生成器把中段与结尾排好。",
    href: ZH.douyinStructure,
    cta: "去内容结构生成器"
  },
  "douyin-structure-generator": {
    title: "下一步：生成可贴描述区的文案包",
    desc: "结构清楚后，一次性出正文、话题与引导。",
    href: ZH.douyinCaption,
    cta: "去抖音文案包"
  },
  "douyin-caption-generator": {
    title: "下一步：写评论引导与互动话术",
    desc: "正文有了之后，补置顶评论与互动指令更完整。",
    href: ZH.douyinCommentCta,
    cta: "去评论引导生成器"
  },
  "douyin-script-generator": {
    title: "下一步：对齐描述区与话题",
    desc: "口播要点有了，可生成描述区与标签再发布。",
    href: ZH.douyinCaption,
    cta: "去抖音文案包"
  },
  "douyin-comment-cta-generator": {
    title: "下一步：回到文案包检查口吻一致",
    desc: "评论引导与正文口径对齐，发布更顺。",
    href: ZH.douyinCaption,
    cta: "去抖音文案包"
  }
};

type Props = {
  toolSlug: string;
};

/** V109.2 — 抖音工具统一「下一步」建议（轻量、可点） */
export function ZhDouyinWorkflowNextStep({ toolSlug }: Props) {
  const step = STEPS[toolSlug];
  if (!step) return null;

  return (
    <div className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-950/40 to-slate-900/80 px-4 py-3 text-slate-100 shadow-inner">
      <p className="text-[11px] font-bold uppercase tracking-widest text-red-300/90">工作流 · 下一步</p>
      <p className="mt-1 text-sm font-semibold text-white">{step.title}</p>
      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{step.desc}</p>
      <Link
        href={step.href}
        className="mt-3 inline-flex min-h-[2.75rem] w-full items-center justify-center gap-1 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-500 sm:w-auto"
      >
        {step.cta}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
