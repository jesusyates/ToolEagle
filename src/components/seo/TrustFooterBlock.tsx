/**
 * V80: "Why trust ToolEagle?" - trust signals at bottom
 */

type Props = {
  lang?: "zh" | "en";
};

const ZH_TRUST_ITEMS = [
  "基于 100+ 创作者：方法经真实创作者验证",
  "真实视频测试：1000+ 视频实验数据",
  "5 万+ 创作者使用：TikTok、YouTube、Instagram 实测有效",
  "持续更新：内容随算法和趋势持续调整"
];

const EN_TRUST_ITEMS = [
  "Based on 100+ creators: Methods tested by real creators",
  "Tested on real videos: Data from 1000+ video experiments",
  "Used by 50K+ creators: Proven strategies for TikTok, YouTube, Instagram",
  "Continuously updated: Content adjusted for algorithm and trend changes"
];

export function TrustFooterBlock({ lang = "zh" }: Props) {
  const items = lang === "zh" ? ZH_TRUST_ITEMS : EN_TRUST_ITEMS;
  const title = lang === "zh" ? "为什么信任 ToolEagle？" : "Why trust ToolEagle?";

  return (
    <section
      className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5"
      aria-label={title}
    >
      <h2 className="text-base font-semibold text-slate-900 mb-3">{title}</h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="text-sky-500">•</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
