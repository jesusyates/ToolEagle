# ToolEagle 项目状态报告（供 ChatGPT 参考）

> 本文档供 ChatGPT 或其他 AI 助手了解项目当前状态，便于后续协作。

---

## 一、项目概览

**ToolEagle**：面向创作者（TikTok、YouTube、Instagram）的免费 AI 工具站，提供文案生成、钩子生成、标题生成、标签生成等。

**技术栈：** Next.js 14、React、TypeScript、Supabase、Plausible Analytics

**路由结构：**
- `/`：英文首页
- `/zh/*`：中文 SEO 页面
- `/en/how-to/*`：英文 how-to 指南（V77/V78 新增）
- `/tools/*`：英文工具页
- `/zh/tools/*`：中文工具页
- `/examples/*`：案例展示

---

## 二、近期版本（V76–V78）

### V76 / V76.5
- **国家层基础架构**：`countries.ts`、`country.ts`、`useCountry`，支持 US/CN 及未来扩展
- **Analytics**：`tool_usage_events` 表新增 `country` 列（迁移 0018 已执行）
- **zh 工具路由**：12 个 zh 工具页，复用共享 Client
- **Affiliate**：按国家返回不同联盟链接

### V77 AI Citation Domination
- **DirectAnswerBlock**：H1 下方直接回答块，面向 AI 搜索（ChatGPT、Perplexity、Google SGE）
- **问题扩展**：5 个新关键词模式（怎么做？需要多久？靠谱吗？能赚钱吗？新手怎么开始？）
- **结构化数据**：FAQ schema 将直接回答作为首条 mainEntity
- **工具嵌入**：`ZhToolEmbeddingSentence`，正文中自然插入工具链接
- **EN 页面**：`/en/how-to` 及首批 3 个主题页

### V78 AI Answer Optimization
- **DirectAnswerBlock 升级**：结构化格式（开篇句 + 编号列表 2–4 条 + 时间/结果预期）
- **DataSignalBlock**：每页 1–2 条数据型句子（如「约70%的爆款视频都使用了前3秒钩子」）
- **EN 页面扩展**：50 个 EN how-to 页面（TikTok、YouTube、Instagram、内容创作）
- **回答密度**：每页覆盖 what / how / how long / is it worth it

---

## 三、关键路径与组件

| 路径 | 说明 |
|------|------|
| `src/components/seo/DirectAnswerBlock.tsx` | 直接回答块，支持结构化解析 |
| `src/components/seo/DataSignalBlock.tsx` | 数据信号块 |
| `src/components/seo/ZhToolEmbeddingSentence.tsx` | 工具嵌入句子 |
| `src/lib/direct-answer-format.ts` | 解析 `1. Point` 格式 |
| `src/lib/data-signals.ts` | 数据信号库，按 topic 返回 |
| `src/lib/en-how-to-content.ts` | 50 个 EN how-to 页面内容 |
| `src/lib/keyword-patterns.ts` | 关键词模式（含 V77 新增 5 个） |
| `src/lib/zh-ctr.ts` | CTR 优化、FAQ/HowTo schema |
| `src/config/countries.ts` | 国家配置 |
| `src/hooks/useCountry.ts` | 国家 hook |

---

## 四、SEO 页面模板

| 模板 | 用途 | 关键结构 |
|------|------|----------|
| **ZhGuidePageTemplate** | zh/how-to, zh/ai-prompts-for, zh/content-strategy, zh/viral-examples | H1 → DirectAnswerBlock → DataSignalBlock → Intro → 工具嵌入 → 分步 → 案例 → FAQ → 工具推荐 |
| **ZhKeywordPageTemplate** | zh/search/* | H1 → DirectAnswerBlock → DataSignalBlock → Intro → 工具嵌入 → 分步 → FAQ → 工具推荐 |
| **ZhBlogPageTemplate** | zh/blog/* | H1 → DirectAnswerBlock → DataSignalBlock → Intro → 工具嵌入 → 分步 → FAQ |
| **ZhHubPageTemplate** | zh/how-to/[platform] 等 hub | H1 → DirectAnswerBlock（overview）→ 子链接列表 |
| **EnHowToPageTemplate** | en/how-to/* | 与 zh 结构一致，英文内容 |

---

## 五、直接回答格式（V78）

**推荐格式（便于 AI 引用）：**
```
开篇概括句

1. 第一条要点
2. 第二条要点
3. 第三条要点

可选：时间/结果预期（如「新账号通常 7–14 天可见增长」）
```

**解析规则：** 若 `directAnswer` 含 `1. Point` 且至少 2 条，则渲染为结构化块；否则按普通段落显示。

---

## 六、数据库

- **Supabase**：用户、案例、分析等
- **迁移 0018**：`tool_usage_events` 已添加 `country` 列
- **内容缓存**：`data/zh-seo.json`、`data/zh-keywords.json` 等

---

## 七、注意事项（给 ChatGPT）

1. **不要改路由**：zh/en 路由结构已固定，仅做内容与组件增强
2. **DirectAnswerBlock**：新内容建议使用「开篇句 + 编号列表 + 预期」格式
3. **DataSignalBlock**：每页 1–2 条，通过 `inferDataSignalTopic(slug, keyword)` 选 topic
4. **工具嵌入**：在 intro 后使用 `ZhToolEmbeddingSentence`，传入 `toolSlug` 和 `keyword`
5. **EN 页面**：在 `en-how-to-content.ts` 中新增条目即可，slug 自动加入路由
6. **国家**：`/zh/*` 视为 CN，其余默认 US；Analytics 会传 `country`

---

## 八、文档索引

- `docs/V76-V76.5-IMPLEMENTATION-SUMMARY.md`：V76/V76.5 实施
- `docs/V77-AI-CITATION-SUMMARY.md`：V77 AI 引用
- `docs/V78-AI-ANSWER-OPTIMIZATION-SUMMARY.md`：V78 回答优化

---

*报告生成时间：2026-03*
