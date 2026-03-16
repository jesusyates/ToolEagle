# Project Roadmap Summary（转发 ChatGPT 用）

**Project**: ToolEagle

**Current scale**
- ~67,000 SEO pages
- Next.js + Supabase
- Redis cache
- Creator system (basic)
- AI tools directory

**Main modules**
- /examples
- /topics
- /captions
- /hooks
- /ideas
- /ai-tools
- /creators
- /library

**Roadmap**

| Version | Focus |
|---------|-------|
| v40 | Traffic Capture Engine — SEO guides and how-to pages |
| v41 | Prompt Library — Large prompt database |
| v42 | AI Tool Marketplace Expansion — 23 → 1000 AI tools |
| v43 | Tool Comparison Engine — Programmatic compare pages |
| v44 | Creator Publishing Platform — User generated content |
| v45 | Monetization — Stripe subscriptions |

---

# v40 Spec — Traffic Capture Engine

**目标**: 抢 AI 搜索流量、Google 长尾、Creator 搜索需求

## 新增页面类型

| 路径 | 示例 | 内容模块 |
|------|------|----------|
| `/how-to/[topic]` | `/how-to/grow-on-tiktok` | guide, examples, AI prompts, tools, CTA |
| `/ai-prompts-for/[topic]` | `/ai-prompts-for/youtube` | 同上（与现有 /ai-prompts/[category] 区分） |
| `/content-strategy/[topic]` | `/content-strategy/startup` | 同上 |
| `/viral-examples/[topic]` | `/viral-examples/fitness` | 同上 |

## 内容结构（每页 1200–2000 字）

- Guide
- Examples
- AI Prompts
- Tools
- CTA

## 技术要点

- 程序化生成（类似现有 `/ideas/[slug]/[topic]`）
- Topic 数据源：`caption-hook-topics` + 扩展
- 需新增 config：`how-to-topics`, `content-strategy-topics`, `viral-examples-topics`
