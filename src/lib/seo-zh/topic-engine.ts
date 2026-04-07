/**
 * V300 中文独立 topic 引擎 — 与英文 topic-engine 无关。
 * 通过场景/人群/条件扩展题目，并对已有标题库做 bigram 相似度过滤，降低撞库。
 */

export type ZhPlatform = "douyin" | "xiaohongshu";

export type ZhPlatformFuture = ZhPlatform | "kuaishou";

export type ZhTopicCluster = {
  platform: ZhPlatform;
  cluster: string;
  topics: string[];
};

function bigramJaccardZh(a: string, b: string): number {
  const grams = (s: string) => {
    const t = s.replace(/\s+/g, "").slice(0, 240);
    if (t.length < 2) return new Set<string>();
    const g = new Set<string>();
    for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2));
    return g;
  };
  const A = grams(a);
  const B = grams(b);
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter++;
  }
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

const SIM = 0.85;

function normTitle(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

function isTooSimilarToCorpus(topic: string, corpus: string[]): boolean {
  const t = topic.trim();
  if (!t) return true;
  const nt = normTitle(t);
  for (const ex of corpus) {
    const e = ex.trim();
    if (!e) continue;
    if (normTitle(e) === nt) return true;
    if (bigramJaccardZh(t, e) >= SIM) return true;
  }
  return false;
}

/** 场景/人群/条件后缀，用于与种子题组合，拉大标题差异 */
const SCENE_SUFFIXES = [
  "（同城门店）",
  "（副业起步）",
  "（周末更新）",
  "（首月冷启动）",
  "（零预算）",
  "（小团队三人内）",
  "（学生兼职）",
  "（宝妈时间少）",
  "（上班族晚间）",
  "（避坑向）",
  "（数据复盘）",
  "（评论区引流）",
  "（合集连载）",
  "（直播联动短视频）",
  "（私域承接）"
];

const SEED_CLUSTERS: ZhTopicCluster[] = [
  {
    platform: "douyin",
    cluster: "抖音新手起号与内容方向",
    topics: [
      /** 以下为主轴：句式结构拉开，避免「同一句干 + 换括号」；不再使用「同城门店引流选题怎么定才不撞同质化」类长模板。 */
      "抖音视频为什么没人看",
      "同城店抖音视频怎么让人进店",
      "抖音评论区怎么引导私信",
      "抖音视频开头3秒怎么留人",
      "同城门店抖音视频怎么转成交",
      "同城发抖音为什么总被划走",
      "抖音门店账号发什么内容才不像硬广",
      "抖音口播稿一分钟内如何把卖点讲清楚不啰嗦",
      "抖音新号前两周发什么内容更容易被推荐",
      "抖音同城探店视频开头三秒怎么设计才不划走",
      "抖音口播提词器节奏怎么练才不像念稿",
      "抖音蓝v门店账号一周发几条算合理",
      "抖音短视频带货前要不要先做纯内容养号",
      "抖音评论区置顶话术怎么写才不像硬广"
    ]
  },
  {
    platform: "douyin",
    cluster: "抖音流量与转化",
    topics: [
      "抖音播放量突然下滑该先查封面还是标题",
      "抖音完播率低时优先改文案还是改画面节奏",
      "抖音私信咨询多但成交少该怎么拆环节",
      "抖音直播间人来了就走怎么留人三十秒",
      "抖音同城团购券核销率低怎么提醒到店",
      "抖音粉丝画像和实际观众不一致怎么纠偏"
    ]
  },
  {
    platform: "xiaohongshu",
    cluster: "小红书笔记曝光与封面",
    topics: [
      "小红书合集封面统一风格但不显得模板化怎么设计",
      "小红书评论区置顶话术怎么写才不像硬广",
      "小红书笔记小眼睛很少应该先改标题还是封面",
      "小红书图文笔记一天发几篇不算频繁",
      "小红书爆款笔记拆解时要抄结构还是抄选题",
      "小红书笔记被限流时先自查哪些敏感表述",
      "小红书合集目录怎么写才让人想点进去",
      "小红书封面字体太大太小分别有什么观感问题"
    ]
  },
  {
    platform: "xiaohongshu",
    cluster: "小红书转化与私域",
    topics: [
      "小红书私信导流微信怎样写才不容易违规",
      "小红书店铺笔记与种草笔记比例怎么分配",
      "小红书笔记挂商品后流量变差要不要下架",
      "小红书同城笔记和全国笔记要不要分号发",
      "小红书评论区常见问题怎么整理成置顶答疑"
    ]
  }
];

function expandWithVariants(clusters: ZhTopicCluster[]): ZhTopicCluster[] {
  const out: ZhTopicCluster[] = [];
  for (const c of clusters) {
    const extra: string[] = [];
    for (const t of c.topics) {
      for (let i = 0; i < SCENE_SUFFIXES.length; i++) {
        extra.push(`${t}${SCENE_SUFFIXES[i]}`);
      }
    }
    out.push({ ...c, topics: [...c.topics, ...extra] });
  }
  return out;
}

function rotateTopics(topics: string[], seed: number): string[] {
  const n = topics.length;
  if (n === 0) return [];
  const start = Math.abs(seed) % n;
  return [...topics.slice(start), ...topics.slice(0, start)];
}

const EXPANDED = expandWithVariants(SEED_CLUSTERS);

export type GenerateZhTopicClustersOptions = {
  /** 已存在标题 + 资产索引标题等，用于相似度过滤 */
  existingTitles?: string[];
  /** 轮次偏移，改变题目遍历顺序，配合多轮重试 */
  roundSeed?: number;
};

export function generateZhTopicClusters(options?: GenerateZhTopicClustersOptions): { clusters: ZhTopicCluster[] } {
  const corpus = options?.existingTitles ?? [];
  const seed = options?.roundSeed ?? 0;

  const clusters: ZhTopicCluster[] = [];
  for (const c of EXPANDED) {
    const rotated = rotateTopics(c.topics, seed + c.cluster.length);
    const filtered = rotated.filter((t) => !isTooSimilarToCorpus(t, corpus));
    if (filtered.length > 0) {
      clusters.push({ platform: c.platform, cluster: c.cluster, topics: filtered });
    }
  }

  if (clusters.length === 0) {
    for (const c of EXPANDED) {
      const rotated = rotateTopics(c.topics, seed + 7);
      const loose = rotated.filter((t) => !corpus.some((ex) => normTitle(ex) === normTitle(t)));
      if (loose.length > 0) {
        clusters.push({ platform: c.platform, cluster: c.cluster, topics: loose });
      }
    }
  }

  return { clusters };
}
