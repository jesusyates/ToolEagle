/**
 * V102.1 — Reusable Douyin creator education (hooks, openings, retention).
 */

type Props = {
  /** Shorter blocks on tool pages */
  compact?: boolean;
};

export function DouyinEducationBlocks({ compact = false }: Props) {
  if (compact) {
    return (
      <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 text-sm text-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">抖音侧小抄：先把开头做对</h2>
        <ul className="space-y-2 list-disc list-inside text-slate-700">
          <li>
            <strong>前 1 秒</strong>要让人知道「这条视频跟我有什么关系」——同城、同款焦虑、同款身份最好点名。
          </li>
          <li>
            <strong>中间别散</strong>：口播只推进一个结论，画面变化服务于这句话，别堆三个观点。
          </li>
          <li>
            <strong>常见翻车</strong>：铺垫太长、术语太多、结尾 CTA 含糊（「关注一下」不如「评论你的行业我回模板」）。
          </li>
        </ul>
        <p className="text-xs text-slate-600 leading-relaxed">
          完播与互动往往来自<strong>开头承诺是否兑现</strong>：你开头说了什么，后面 15 秒内就要给到证据或步骤。
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">钩子怎么改才像「抖音原生」</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li>
            <strong>身份锚定</strong>：「带娃宝妈」「实体店老板」「刚做号的素人」——比「大家好」更容易让算法找到人群。
          </li>
          <li>
            <strong>结果前置</strong>：先丢结果或反常识，再解释过程；避免「今天我们来聊一聊」式开场。
          </li>
          <li>
            <strong>口语气口</strong>：适合直接念出来；书面语在抖音里容易显得「像广告」。
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
        <h2 className="text-lg font-bold text-slate-900">短视频开头结构（15 秒内）</h2>
        <ol className="mt-4 space-y-2 list-decimal list-inside text-sm text-slate-700">
          <li>0–2 秒：冲突 / 结果 / 提问，让观众停滑。</li>
          <li>3–8 秒：一句话说明「我为什么要看完」——省时间、避坑、可复制。</li>
          <li>9–15 秒：给出第一个可感知的信息点（数字、对比、步骤 1）。</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
        <h2 className="text-lg font-bold text-slate-900">容易踩的坑</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-800 list-disc list-inside">
          <li>信息密度过低：前 5 秒还在自我介绍，观众已经划走。</li>
          <li>一条视频想讲透三个主题——算法难打标签，用户也难记住。</li>
          <li>引导语太虚：没有给出「评论什么 / 点哪里 / 下一步做什么」。</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
        <h2 className="text-lg font-bold text-slate-900">完播与互动：可以刻意设计什么</h2>
        <p className="mt-3 text-sm text-slate-700 leading-relaxed">
          在口播里<strong>预埋一个「后半段才揭晓」的答案</strong>（价格区间、对比结果、清单第 3 条），能拉高中段留存；结尾用
          <strong>选择题式互动</strong>（「你更站 A 还是 B？评论 1/2」）比泛泛的「点赞支持」更可执行。
        </p>
      </section>
    </div>
  );
}
