"use client";

const COPY = {
  caption: {
    title: "Why creators use this",
    bullets: [
      "You leave with a **full post package** — not one random sentence.",
      "Hooks + talking points + caption + CTA + hashtags + why it works = faster filming.",
      "Built for **short-form growth**: TikTok, Reels, Shorts — same workflow."
    ],
    mistakes: [
      "Starting with a bland opener — the first line is the ad for the rest.",
      "Writing long captions nobody reads on the FYP — structure beats length.",
      "Forgetting a CTA — even “comment your niche” trains the algorithm."
    ]
  },
  hook: {
    title: "What strong hooks achieve",
    bullets: [
      "**Stop the scroll** in the first 1–2 seconds — everything else depends on it.",
      "Pattern interrupts (POV, contrarian, “you’re doing X wrong”) create tension.",
      "ToolEagle packages the hook **with** caption + script beats so you can ship."
    ],
    mistakes: [
      "Explaining before teasing — tease first, explain after retention.",
      "Being clever but vague — specificity beats generic inspiration.",
      "Same hook for every video — rotate patterns from the library."
    ]
  },
  ai_caption: {
    title: "What this helps you achieve",
    bullets: [
      "**Outcome-first captions** for any niche — not generic AI filler.",
      "Each run returns structured blocks you can paste or riff on.",
      "Pro unlocks **full strategy depth** + more variants per generation."
    ],
    mistakes: [
      "Posting AI text raw — add your voice and one personal detail.",
      "Skipping the CTA — always give the viewer a next step.",
      "Ignoring platform context — Shorts vs TikTok vs Reels: same bones, different tone."
    ]
  },
  home: {
    title: "Built for growth, not toy outputs",
    bullets: [
      "ToolEagle turns ideas into **publish-ready packages** — hooks, scripts, captions, CTAs, tags.",
      "Pattern library + AI = you learn **why** lines work while you generate.",
      "Free tier gives compact packages; **Pro** adds full depth and more variants."
    ],
    mistakes: [
      "Treating AI as a one-line vending machine — structure beats single captions.",
      "Ignoring hooks — the first line is your thumbnail for sound-on feeds.",
      "No workflow — use the growth kit page to chain tools."
    ]
  },
  growth_kit: {
    title: "Solve the real problem: distribution + speed",
    bullets: [
      "Views need **hooks + packaging**; speed needs **talking points + captions**.",
      "Chain tools in order: hook clarity → caption → hashtags where needed.",
      "Save templates locally and reuse winning structures."
    ],
    mistakes: [
      "Posting without a CTA — you’re leaving reach on the table.",
      "Changing everything every video — iterate one variable at a time.",
      "Skipping “why it works” — that’s how you build intuition."
    ]
  }
} as const;

type ProofCopy = {
  title: string;
  bullets: string[];
  mistakes: string[];
};

const COPY_ZH: Record<ValueProofVariant, ProofCopy> = {
  caption: {
    title: "为什么短视频创作者会用「文案包」而不是一句话",
    bullets: [
      "你带走的是**一整套可拍结构**：钩子、口播要点、正文、引导、标签、爆款逻辑，不是一句空泛金句。",
      "把「想拍什么」落成**分镜级提示**，口播日更也能稳定产出。",
      "面向**抖音 / 视频号 / Reels** 同一套流程：改语气就能多平台分发。"
    ],
    mistakes: [
      "开头太平——前 1 秒没有信息密度，后面再精彩也难救。",
      "文案写成小作文——信息流里结构比字数重要。",
      "只顾讲内容不做引导——少一个 CTA，就少一次互动训练。"
    ]
  },
  hook: {
    title: "好钩子解决的是「停滑」",
    bullets: [
      "**1–2 秒内**让人停下来，后面的完播、互动才有空间。",
      "反差、POV、「大多数人都错了」——都是在制造**信息缺口**。",
      "ToolEagle 把钩子放进完整文案包里，你可以**直接开拍**。"
    ],
    mistakes: [
      "先解释背景再抛观点——短视频要先给「为什么我要听」。",
      "太抽象不落地——越具体，越容易让人对号入座。",
      "每条视频同一个套路——要轮换模式，避免审美疲劳。"
    ]
  },
  ai_caption: {
    title: "这套工具帮你省掉「从 0 写脚本」的时间",
    bullets: [
      "按**结果导向**组织文案块，而不是堆 AI 废话。",
      "每次生成都带结构：你可以复制、微调、再拍。",
      "**Pro** 解锁更深度的策略说明与更多变体，适合日更账号。"
    ],
    mistakes: [
      "把 AI 原文直接发——少了你的口吻和真实细节。",
      "不写引导句——每条视频都该给观众「下一步」。",
      "忽略平台语境——同一主题，抖音狠一点，视频号稳一点。"
    ]
  },
  home: {
    title: "为涨粉和变现服务，而不是玩具输出",
    bullets: [
      "把创意落成**可发布的完整包**：钩子、口播、文案、引导、标签。",
      "模式库 + AI：一边出稿一边理解**为什么这句有效**。",
      "免费档先看结构；**Pro** 给你完整深度与更多变体。"
    ],
    mistakes: [
      "把 AI 当「一句话生成器」——结构才是短视频效率的来源。",
      "忽视开头——有声画信息流里，开头就是封面。",
      "没有固定工作流——用增长指南把工具串成闭环。"
    ]
  },
  growth_kit: {
    title: "真正卡你的往往是分发节奏，而不是「缺灵感」",
    bullets: [
      "播放量靠**钩子 + 包装**；更新频率靠**口播要点 + 成稿速度**。",
      "推荐顺序：先把开头说清 → 再生成完整文案包 → 需要时再补标签。",
      "本地保存模板，反复套**验证过的结构**。"
    ],
    mistakes: [
      "发片不带引导——互动低了，系统也不知道该推给谁。",
      "每条视频大改方向——一次只改一个变量，才好复盘。",
      "不看「为什么能爆」——那是你建立手感最快的方式。"
    ]
  }
};

export type ValueProofVariant = keyof typeof COPY;

type Props = { variant: ValueProofVariant; locale?: "en" | "zh" };

export function ValueProofBlock({ variant, locale = "en" }: Props) {
  const c = locale === "zh" ? COPY_ZH[variant] : COPY[variant];
  const mistakesLabel = locale === "zh" ? "常见踩坑" : "Common mistakes";
  return (
    <section className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-emerald-950">{c.title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-800">
        {c.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-emerald-600 font-bold shrink-0">✓</span>
            <span dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs font-semibold text-slate-700 uppercase tracking-wide">{mistakesLabel}</p>
      <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
        {c.mistakes.map((m, j) => (
          <li key={j} className="flex gap-2">
            <span className="text-amber-600 shrink-0">!</span>
            <span>{m}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
