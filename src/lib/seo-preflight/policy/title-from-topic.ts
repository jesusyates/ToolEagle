import type { SeoPreflightContentType } from "../types/preflight";
import {
  buildSeoTitleFromSkeleton,
  cleanTopicPhrase,
  pickEnglishSkeletonKindForPreflight
} from "@/lib/seo/seo-title-skeleton";

const YEAR = 2026;
const TITLE_MIN = 16;
const TITLE_MAX = 88;

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Avoid slicing mid-word when capping title length. */
export function trimTitleAtWordBoundary(title: string, max: number): string {
  const t = title.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace >= TITLE_MIN) return cut.slice(0, lastSpace).trim();
  return cut.trim();
}

/** `patternRetryOffset` shifts the pattern when retrying after an in-job structural duplicate (0 = first pick). */
function pickPatternIndex(variationIndex: number, seed: string, len: number, patternRetryOffset = 0): number {
  return (variationIndex * 7 + stableHash(seed) + patternRetryOffset * 23) % len;
}

function enGuidePatterns(b: string): string[] {
  return [
    `How to ${b} in ${YEAR} (Step-by-Step Guide)`,
    `${b} Strategy: What Actually Works in ${YEAR}`,
    `Beginner's Guide to ${b} (With Real Examples)`,
    `${b} Explained: Tips, Mistakes, and Best Practices`,
    `How Creators Use ${b} to Grow Faster`,
    `${YEAR} ${b} Roadmap: Goals, Systems, and Weekly Rhythm`,
    `The ${b} Playbook I Wish I Had on Day One`,
    `${b} for Creators: What to Prioritize First`,
    `Stop Guessing: A Clear ${b} Plan That Scales`,
    `From Messy to Manageable: ${b} Without Overwhelm`,
    `Real Talk on ${b}: What Works, What Doesn’t, What’s Next`,
    `Build a Sustainable ${b} Habit (Even When You’re Busy)`
  ];
}

function enHowToPatterns(b: string): string[] {
  return [
    `How to ${b} in ${YEAR} (Step-by-Step Guide)`,
    `${YEAR} Playbook: How to Master ${b} Without Burnout`,
    `How to ${b} the Smart Way: Steps, Tools, and Checks`,
    `From Zero to Consistent: How to ${b} as a Creator`,
    `How to ${b} Faster: What Works for Creators in ${YEAR}`,
    `How to ${b} When You’re Short on Time`,
    `How to ${b}: A Simple Sequence You Can Repeat Weekly`,
    `How to Debug Your ${b} Workflow (and Fix the Bottleneck)`,
    `How to ${b} Without Breaking Your Posting Cadence`,
    `How to Learn ${b} by Shipping Small Wins`,
    `How to ${b} With Better Defaults and Fewer Decisions`,
    `How to ${b}: Checklists, Scripts, and Quality Gates`
  ];
}

function enComparisonPatterns(b: string): string[] {
  return [
    `${b} Compared: Pick the Right Option in ${YEAR}`,
    `${b} vs Alternatives: Honest Tradeoffs for Creators`,
    `Choosing ${b}: What Actually Moves the Needle`,
    `${b} Options Side-by-Side: Strengths, Weaknesses, Best Fit`,
    `Which ${b} Approach Wins in ${YEAR}? A Clear Framework`,
    `${b} Face-Off: Speed vs Quality vs Cost`,
    `If You’re Stuck Between ${b} Paths, Read This First`,
    `${b} Decision Guide: Criteria, Risks, and “Good Enough”`,
    `The ${b} Landscape in ${YEAR}: What Changed, What Didn’t`,
    `Pick ${b} Like a Product Manager: Requirements, Tests, Rollout`,
    `When ${b} Is Worth It—and When It Isn’t`,
    `${b} Tradeoffs Explained Without the Hype`
  ];
}

function enListiclePatterns(b: string): string[] {
  return [
    `${b}: Five Creator Moves That Still Work in ${YEAR}`,
    `Five ${b} Lessons Most Creators Learn the Hard Way`,
    `High-Signal ${b} Ideas You Can Ship This Week`,
    `${b} Checklist: Priorities, Pitfalls, and Quick Wins`,
    `What Top Creators Do Differently With ${b}`,
    `Seven ${b} Tweaks That Compound Over Time`,
    `${b} Ideas Ranked: Impact, Effort, and Fit`,
    `Small ${b} Wins You Can Stack in One Afternoon`,
    `The ${b} Shortlist: Cut the Noise, Keep the Leverage`,
    `Non-Obvious ${b} Tips From Real Publishing Cycles`,
    `${b} Patterns That Survived Algorithm Shifts`,
    `If You Only Do Three Things for ${b}, Do These`
  ];
}

function enProblemSolutionPatterns(b: string): string[] {
  return [
    `Why Your ${b} Still Isn't Getting Traction`,
    `The Real Reason ${b} Falls Flat for Most Creators`,
    `${b}: What's Actually Broken—and the First Fix`,
    `Stuck on ${b}? Start With This Diagnosis`,
    `Why ${b} Looks Fine on Paper But Flops in the Feed`,
    `${b} Troubleshooting: Friction, Fixes, and a Simple Next Test`,
    `If ${b} Isn't Moving Numbers, Read This Before You Tweak Again`,
    `The ${b} Problem Most Tutorials Skip`,
    `${b} When You're Doing "Everything Right" But It Still Stalls`,
    `Stop Patching ${b} Randomly—Use This Sequence`,
    `${b}: Find the Bottleneck Before You Rewrite`,
    `Why Small ${b} Changes Fail (And What to Change Instead)`
  ];
}

function enMistakesPatterns(b: string): string[] {
  return [
    `The Biggest ${b} Mistakes Creators Keep Repeating`,
    `${b} Mistakes That Quietly Cap Your Reach`,
    `Stop Making These ${b} Errors (They're Common for a Reason)`,
    `${b}: The "Looks Smart" Mistakes That Hurt Performance`,
    `Seven ${b} Slip-Ups I See on Every Audit`,
    `${b} Anti-Patterns You Can Fix This Week`,
    `The Subtle ${b} Mistakes That Look Harmless`,
    `Rookie ${b} Errors Even Experienced Creators Repeat`,
    `${b} Habits That Feel Productive—but Aren't`,
    `If ${b} Feels "Fine," Check These Failure Modes`,
    `${b}: The Fixes That Actually Move Watch Time and Clicks`,
    `How to Spot Bad ${b} Advice Before You Ship It`
  ];
}

function enComparisonFromExperiencePatterns(b: string): string[] {
  return [
    `I Compared 10 ${b} Patterns—Here's What Actually Gets Clicks`,
    `I Tested ${b} Styles Side-by-Side: Surprising Winners`,
    `${b}: What I Learned After Publishing Dozens of Variants`,
    `A Creator's Field Test of ${b} (Not Theory—Results)`,
    `I Ranked ${b} Approaches by What Moved the Needle`,
    `${b} Experiments: What I'd Repeat vs. What I'd Ditch`,
    `Same Niche, Different ${b}: What Split Tests Showed`,
    `Hands-On ${b}: Patterns That Beat Generic Advice`,
    `${b} From the Trenches—What Worked on My Channel`,
    `I Tried the Popular ${b} Playbooks: Here's the Honest Scorecard`,
    `${b}: What I'd Tell Myself After 100 Posts`,
    `Real-World ${b}—Less Hype, More Signal`
  ];
}

function enMythBustingPatterns(b: string): string[] {
  return [
    `What Most "${b}" Advice Gets Wrong`,
    `${b} Myths That Sound Smart—But Hurt Results`,
    `The Viral ${b} Tips That Don't Hold Up`,
    `Stop Copying This ${b} "Best Practice"`,
    `${b}: The Popular Line vs. What Actually Works`,
    `Debunking Trendy ${b} Advice (With a Cleaner Playbook)`,
    `Why "Just Post More" Is the Wrong Answer for ${b}`,
    `${b} Hot Takes That Pass the Reality Check`,
    `The ${b} "Hack" Everyone Shares—And Why It Fails`,
    `What ${b} Gurus Get Wrong About Algorithms and Attention`,
    `${b}: Replace Hype With a Boring-But-True Workflow`,
    `If Your ${b} Feels Forced, Read This First`
  ];
}

function enPatternBreakdownPatterns(b: string): string[] {
  return [
    `${b} Patterns That Work Better for Faceless Creators`,
    `Breaking Down ${b} Structures That Survive Algorithm Shifts`,
    `${b} Templates—When to Use Them (and When to Break Them)`,
    `The Anatomy of Strong ${b} (Copy This Skeleton)`,
    `${b} Formulas: The Few That Still Feel Human`,
    `Pattern Library: ${b} Variants Ranked by Effort vs. Payoff`,
    `${b}: Reverse-Engineering What Actually Hooks`,
    `From Weak to Strong ${b}: Pattern Upgrades That Stick`,
    `Title and Hook Patterns for ${b} That Still Convert`,
    `${b} Blueprints: Steal the Shape, Not the Clichés`,
    `Why Your ${b} Blends In—And How to Break the Pattern Safely`,
    `${b} Structures Readers Skim Less and Click More`
  ];
}

function enScenarioSpecificPatterns(b: string): string[] {
  return [
    `${b} When You're Posting on a Tight Schedule`,
    `${b} for New Accounts Without Social Proof`,
    `${b} When You're Pivoting Niches Mid-Year`,
    `${b} for One-Person Teams (No Crew, No Budget)`,
    `${b} During a Slow Growth Phase—What to Change`,
    `${b} When Your Audience Is Mostly Mobile`,
    `${b} If You've Already Tried "Trend Chasing"`,
    `${b} for Creators Who Hate "Hype" Language`,
    `${b} When You Can't Film Every Day`,
    `${b} for Side-Hustle Hours Only`,
    `${b} After a Post Flops—What to Try Next`,
    `${b} When You're Rebuilding From Zero`
  ];
}

function zhPatterns(contentType: SeoPreflightContentType, base: string): string[] {
  const b = base;
  const guide = [
    `${YEAR}年「${b}」完整指南：从入门到落地`,
    `如何做好「${b}」：系统化步骤与常见误区`,
    `创作者必读：「${b}」实战要点与案例提示`,
    `「${b}」怎么做得更稳：策略、工具与检查清单`,
    `「${b}」入门与进阶：可复制的增长方法`,
    `「${b}」长期打法：节奏、复盘与迭代`,
    `写给忙碌创作者的「${b}」简化版路线图`,
    `「${b}」从0到1：最小闭环与放大路径`,
    `「${b}」常见翻车点与更可执行的替代方案`,
    `把「${b}」做成系统：模板、指标与周节奏`,
    `「${b}」实战笔记：我如何拆分任务与验收`,
    `「${b}」升级指南：从中等稳定到持续增长`
  ];
  const howTo = [
    `如何一步步做好「${b}」：${YEAR}实操清单`,
    `「${b}」新手到进阶：分步拆解与检查点`,
    `${YEAR}年「${b}」怎么做：流程、坑点与复盘`,
    `把「${b}」做出结果：可执行步骤与模板`,
    `「${b}」高效落地指南：准备、执行、优化`,
    `时间不够时如何推进「${b}」：最小可行步骤`,
    `「${b}」怎么做才对：顺序、工具与验收标准`,
    `「${b}」排错手册：卡点定位与修复清单`,
    `「${b}」一周节奏：日任务、周复盘怎么定`,
    `「${b}」从试错到稳定：迭代记录与指标`,
    `「${b}」怎么做更省力：默认设置与批量处理`,
    `「${b}」手把手：照着做就能跑通的第一版`
  ];
  const comp = [
    `「${b}」方案对比与选型：${YEAR}更新版`,
    `「${b}」怎么选：场景、成本与效果权衡`,
    `不同「${b}」路径横评：适合谁、不适合谁`,
    `「${b}」选型决策框架：从目标到落地`,
    `「${b}」对比指南：优势、风险与建议`,
    `「${b}」路线A/B：投入产出与适用人群`,
    `「${b}」选型前先答这五个问题`,
    `「${b}」性价比视角：什么时候值得加码`,
    `「${b}」组合策略：主路径+备选方案`,
    `「${b}」对比表：功能、门槛、维护成本`,
    `「${b}」什么时候别换方案：沉没成本与窗口期`,
    `「${b}」决策复盘：如何验证你选对了`
  ];
  const list = [
    `关于「${b}」的五个关键要点（${YEAR}）`,
    `「${b}」最值得做的五件事：创作者向`,
    `五个「${b}」实战技巧：从认知到执行`,
    `「${b}」要点清单：优先级与常见错误`,
    `把「${b}」做对：五个高信号动作`,
    `「${b}」七个微改进：叠加后很明显`,
    `「${b}」优先级排序：先做哪件最划算`,
    `「${b}」误区合集：踩过坑的人才懂`,
    `「${b}」灵感库：可直接改写的句式与结构`,
    `「${b}」周更素材：一次准备多次复用`,
    `「${b}」高转化动作 vs 低回报忙碌`,
    `「${b}」复盘模板：数据、结论、下周实验`
  ];
  switch (contentType) {
    case "how_to":
      return howTo;
    case "comparison":
    case "comparison_from_experience":
      return comp;
    case "listicle":
    case "mistakes":
      return list;
    case "problem_solution":
    case "myth_busting":
    case "pattern_breakdown":
    case "scenario_specific":
      return guide;
    default:
      return guide;
  }
}

function jaPatterns(contentType: SeoPreflightContentType, base: string): string[] {
  const b = base;
  const guide = [
    `${YEAR}年版：${b}の実践ガイド（初級から運用まで）`,
    `${b}を伸ばすための戦略：クリエイター向け要点整理`,
    `${b}入門：手順・失敗例・チェックリスト`,
    `クリエイター向け：${b}の進め方とコツ`,
    `${b}を成果につなげる：\u57fa\u672c\u539f\u5247\u3068\u6b21\u306e\u4e00\u624b`,
    `${b}の長期設計：リズム・改善・スケールの考え方`,
    `忙しい制作者のための${b}：最小構成で回す`,
    `${b}の全体像：短期成果と積み上げの両立`,
    `${b}でつまずきやすい点と先回り対策`,
    `${b}を仕組み化する：テンプレ・指標・週次レビュー`,
    `${b}の実例ベース：試行錯誤から学ぶ手順`,
    `${b}の上達ロードマップ：安定運用から次の伸びしろへ`
  ];
  const howTo = [
    `${b}のやり方（${YEAR}）：手順とチェックポイント`,
    `${b}を最短で整える：ステップと注意点`,
    `初心者でも迷わない：${b}の進め方`,
    `${b}の実装手順：準備から改善まで`,
    `${YEAR}年の${b}：再現しやすい手順集`,
    `時間がない日の${b}：優先順位つきミニ手順`,
    `${b}の品質を上げる：チェック項目と改善ループ`,
    `${b}の詰まり解消：原因切り分けと修正パターン`,
    `${b}の週次サイクル：日タスクと振り返り設計`,
    `${b}の試行錯誤ログ：うまくいった打ち手の残し方`,
    `${b}を省力化：初期設定とまとめ作業のコツ`,
    `${b}のはじめの一歩：そのまま真似できる初版`
  ];
  const comp = [
    `${b}\u306e\u6bd4\u8f03\u3068\u9078\u3073\u65b9\uff08${YEAR}\uff09`,
    `${b}\uff1a\u9078\u629e\u80a2\u306e\u9055\u3044\u3068\u5411\u304d\u4e0d\u5411\u304d`,
    `${b}をどう選ぶか：トレードオフと判断基準`,
    `${b}\u306e\u6bd4\u8f03\u30d5\u30ec\u30fc\u30e0\uff1a\u76ee\u7684\u5225\u306e\u304a\u3059\u3059\u3081`,
    `${b}の意思決定ガイド：強み・弱み・適用場面`,
    `${b}のA/B：コスト・速度・品質の読み解き方`,
    `${b}を選ぶ前に決めるべき5つの前提`,
    `${b}のROI視点：いつ本気で投資するか`,
    `${b}の組み合わせ戦略：主路線とサブ路線`,
    `${b}比較の観点表：機能・制約・運用負荷`,
    `${b}は乗り換え時期か：判断のためのシグナル`,
    `${b}の意思決定の振り返り：仮説と検証の残し方`
  ];
  const list = [
    `${b}で押さえるべき5つのポイント（${YEAR}）`,
    `${b}のコツ5選：すぐ試せるアクション`,
    `クリエイター向け：${b}の重要ポイントまとめ`,
    `${b}のチェックリスト：優先順位と落とし穴`,
    `${b}\u3067\u5dee\u304c\u3064\u304f5\u3064\u306e\u30a2\u30af\u30b7\u30e7\u30f3`,
    `${b}の改善アイデア7つ：積み重ね型`,
    `${b}の優先度付け：まずやるべき一歩`,
    `${b}でよくある誤解と修正のヒント`,
    `${b}の再利用ネタ：型と言い回しのストック`,
    `${b}の週次ネタ出し：一回作って回す`,
    `${b}の高ROI行動と低ROIな忙しさ`,
    `${b}の振り返りシート：数値・学び・次の実験`
  ];
  switch (contentType) {
    case "how_to":
      return howTo;
    case "comparison":
    case "comparison_from_experience":
      return comp;
    case "listicle":
    case "mistakes":
      return list;
    case "problem_solution":
    case "myth_busting":
    case "pattern_breakdown":
    case "scenario_specific":
      return guide;
    default:
      return guide;
  }
}

/**
 * Deterministic title from seed (no LLM). `variationIndex` rotates patterns so batch outputs do not share one template.
 */
export function proposeTitleFromTopic(
  topicSeed: string,
  contentType: SeoPreflightContentType,
  contentLanguage: string,
  variationIndex: number,
  patternRetryOffset = 0
): string {
  const lang = (contentLanguage || "en").toLowerCase();
  const t = topicSeed.replace(/\s+/g, " ").trim();
  const base = t.length > 0 ? t : "content topic";

  if (lang.startsWith("zh")) {
    const patterns = zhPatterns(contentType, base);
    const raw = patterns[pickPatternIndex(variationIndex, topicSeed, patterns.length, patternRetryOffset)]!;
    return trimTitleAtWordBoundary(raw, TITLE_MAX);
  }

  if (lang.startsWith("ja")) {
    const patterns = jaPatterns(contentType, base);
    const raw = patterns[pickPatternIndex(variationIndex, topicSeed, patterns.length, patternRetryOffset)]!;
    return trimTitleAtWordBoundary(raw, TITLE_MAX);
  }

  const vsSplit = base.split(/\s+vs\s+/i).map((s) => s.trim()).filter(Boolean);
  if (vsSplit.length >= 2) {
    const raw = buildSeoTitleFromSkeleton({
      topic: vsSplit[0]!,
      type: "vs",
      altTopic: vsSplit.slice(1).join(" vs ")
    });
    return trimTitleAtWordBoundary(raw, TITLE_MAX);
  }

  const topic = cleanTopicPhrase(base);
  const kind = pickEnglishSkeletonKindForPreflight(
    contentType,
    variationIndex,
    patternRetryOffset,
    topicSeed
  );
  const raw = buildSeoTitleFromSkeleton({ topic: topic || base, type: kind });
  return trimTitleAtWordBoundary(raw, TITLE_MAX);
}
