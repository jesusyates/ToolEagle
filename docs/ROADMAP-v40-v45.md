# ToolEagle Roadmap v40–v45

**目标**: 从 ~67,000 页扩展到 ~100,000 页，抢占 AI 搜索、Google 长尾、Creator 搜索流量。

---

## Executive Summary（可转发 ChatGPT）

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

## v40 — Traffic Capture Engine

**目标**: 抢 AI 搜索流量、Google 长尾、Creator 搜索需求

### 新增页面类型

| 路径 | 示例 | 内容模块 |
|------|------|----------|
| `/how-to/[topic]` | `/how-to/grow-on-tiktok` | guide, examples, AI prompts, tools, CTA |
| `/ai-prompts-for/[topic]` | `/ai-prompts-for/youtube` | 同上（与 /ai-prompts/[category] 区分） |
| `/content-strategy/[topic]` | `/content-strategy/startup` | 同上 |
| `/viral-examples/[topic]` | `/viral-examples/fitness` | 同上 |

### 内容结构（每页 1200–2000 字）

- Guide
- Examples
- AI Prompts
- Tools
- CTA

### 技术要点

- 程序化生成（类似现有 `/ideas/[slug]/[topic]`）
- Topic 数据源：`caption-hook-topics` + 扩展
- 需新增 config：`how-to-topics`, `content-strategy-topics`, `viral-examples-topics`

---

## v41 — AI Prompt Library

**目标**: 抢占 "AI prompts for TikTok" 等关键词

### 新增页面

| 路径 | 示例 |
|------|------|
| `/prompts` | 目录页 |
| `/prompts/[topic]` | `/prompts/tiktok`, `/prompts/youtube`, `/prompts/instagram`, `/prompts/startup` |

### 每页内容

- 50–100 prompts
- Copy button
- Example output

### SEO 关键词

- AI prompts for TikTok
- ChatGPT prompts for content creators
- viral content prompts

### 预计规模

- 5000+ 页面

---

## v42 — AI Tool Expansion

**目标**: 从 23 个工具扩展到 1000 个

### 目录结构

- `/ai-tools/[slug]`（已有，需扩展数据）

### 类别

- video-editing-ai
- image-generator-ai
- youtube-ai-tools
- tiktok-ai-tools
- caption-generator-ai
- script-generator-ai
- voice-ai
- avatar-ai

### 示例路径

- `/ai-tools/video-ai`
- `/ai-tools/tiktok-caption-generator`
- `/ai-tools/ai-video-editor`

### 每页内容

- Review
- Features
- Pros/Cons
- Alternatives
- Compare links

### 预计规模

- 3000+ 工具页

---

## v43 — Programmatic Comparison Engine

**目标**: SEO 流量杀手级页面类型

### 路径格式

`/compare/[tool-a]-vs-[tool-b]`

### 示例

- `/compare/capcut-vs-veed`
- `/compare/chatgpt-vs-claude`
- `/compare/pictory-vs-invideo`

### 自动生成内容

- Features table
- Pricing
- Best use case

### 预计规模

- 20,000+ 页面

### 技术要点

- 需工具对数据源（tool pairs）
- 程序化生成，类似 `/compare/[slug]` 扩展

---

## v44 — Creator Publishing Platform

**目标**: Creator 内容发布与展示

### 新增路径

- `/publish` — 发布入口

### Creator 可发布

- Captions
- Hooks
- Scripts
- Content ideas

### 存储

- `public_examples` 表，`source = 'creator'`

### Creator 页面展示

- Latest posts
- Top posts
- Followers

---

## v45 — Monetization Engine

**目标**: 付费订阅与变现

### 新增路径

- `/pricing` — 计划对比（已有，需增强）
- `/upgrade` — 升级入口

### 三种计划

| 计划 | 功能 |
|------|------|
| **Free** | daily generations, save limit, basic tools |
| **Pro** | unlimited AI generation, advanced tools, analytics |
| **Creator** | profile promotion, content ranking, creator analytics |

### 支付集成

- **推荐**: Stripe

---

## 关键流量系统

### Newsletter

- **路径**: `/newsletter`
- **用途**: 邮件增长、内容分发、流量回流
- **邮件服务**: Resend

---

## 规模预估

| 版本 | 新增页面 | 累计 |
|------|----------|------|
| 当前 | — | ~67,000 |
| v40 | ~3,000 guides | ~70,000 |
| v41 | ~5,000 prompts | ~75,000 |
| v42 | ~3,000 AI tools | ~78,000 |
| v43 | ~20,000 comparisons | ~98,000 |
| v44/v45 | 功能页 | ~100,000 |

---

## 实施优先级建议

1. **v40** — 高 ROI，复用现有程序化页面架构
2. **Newsletter** — 低依赖，快速获客
3. **v41** — 与 v40 内容模块重叠，可合并设计
4. **v43** — 高流量潜力，需工具对数据
5. **v42** — 需大量工具数据采集
6. **v44** — 依赖 Creator 生态
7. **v45** — 依赖 Stripe 与计费逻辑

---

## 下一步

选择要启动的版本，我将输出详细技术方案与文件结构。
