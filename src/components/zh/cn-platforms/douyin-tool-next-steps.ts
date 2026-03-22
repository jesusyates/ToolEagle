import { ZH } from "@/lib/zh-site/paths";

/** 与英文站工具页「Related tools」并列：抖音栈内「推荐下一步」链接 */
export type DouyinToolPageVariant =
  | "caption"
  | "hook"
  | "script"
  | "topic"
  | "comment_cta"
  | "structure";

export const DOUYIN_TOOL_NEXT_STEPS: Record<
  DouyinToolPageVariant,
  { href: string; label: string; sub: string }[]
> = {
  caption: [
    { href: ZH.douyinHook, label: "抖音钩子生成器", sub: "先磨停滑前两秒" },
    { href: ZH.douyinScript, label: "口播脚本生成器", sub: "五段气口进提词器" },
    { href: ZH.douyinHooksSeo, label: "钩子模板库", sub: "更多开头句式" }
  ],
  hook: [
    { href: ZH.douyinCaption, label: "抖音文案包", sub: "描述区与话题一体" },
    { href: ZH.douyinScript, label: "口播脚本生成器", sub: "把开头接成整段" },
    { href: ZH.douyinCaptionExamplesSeo, label: "文案范例库", sub: "可复制结构" }
  ],
  script: [
    { href: ZH.douyinHook, label: "抖音钩子生成器", sub: "对齐开场节奏" },
    { href: ZH.douyinCaption, label: "抖音文案包", sub: "口播+描述区同步" },
    { href: ZH.douyinScriptTemplatesSeo, label: "口播脚本模板库", sub: "更多骨架" }
  ],
  topic: [
    { href: ZH.douyinHook, label: "抖音钩子生成器", sub: "选题 → 开头" },
    { href: ZH.douyinScript, label: "口播脚本生成器", sub: "把选题拍成结构" },
    { href: ZH.douyinCaption, label: "抖音文案包", sub: "描述区与话题" }
  ],
  comment_cta: [
    { href: ZH.douyinCaption, label: "抖音文案包", sub: "对齐描述区" },
    { href: ZH.douyinHook, label: "钩子生成器", sub: "先拉停滑" },
    { href: ZH.douyin, label: "抖音创作入口", sub: "场景与教程" }
  ],
  structure: [
    { href: ZH.douyinHook, label: "钩子生成器", sub: "对齐开场" },
    { href: ZH.douyinScript, label: "口播脚本", sub: "五段气口" },
    { href: ZH.douyinCaption, label: "文案包", sub: "描述区收口" }
  ]
};
