# ToolEagle 浏览器翻译兼容 - 完整记忆本

> 本文档记录 2025 年 3 月实现的浏览器翻译兼容方案，供日后维护参考。

---

TOOLEAGLE_MASTER_CONTEXT.md
1. Project Overview

Project Name:

ToolEagle

Website:

https://tooleagle.com

Repository:

https://github.com/jesusyates/ToolEagle

2. Product Vision

ToolEagle is an AI-powered creator tools platform designed for social media creators.

Target users:

TikTok creators

YouTube creators

Instagram creators

Content creators

Social media marketers

Goal:

Help creators generate captions, titles, hooks, hashtags, and video ideas using AI.

Long-term vision:

Transform ToolEagle from a tool website into a full creator workflow platform.

3. Market Category

Industry:

AI Creator Tools

Similar products:

Jasper

Copy.ai

Rytr

Hootsuite AI tools

Growth strategy:

Programmatic SEO + AI tools + Creator workflow.

Traffic funnel:

Google → SEO pages → Tools → AI generation → User account → Paid upgrade.

4. Team Operating Model

Project uses a 3-role structure.

Role 1 — Product Lead

ChatGPT

Responsibilities:

Define product direction

Design product features

Plan development phases

Define growth strategy

Define monetization

Role 2 — Engineering Lead

Cursor

Responsibilities:

Implement features

Write and maintain code

Ensure build stability

Follow product instructions

Report completion status

Role 3 — Owner / Resource Provider

User

Responsibilities:

Provide resources

Forward instructions

Manage accounts and APIs

User has granted full product decision authority to ChatGPT.

5. Technical Stack

Frontend:

Next.js 14
React
TypeScript
Tailwind CSS

Architecture:

Next.js App Router
SSG (Static Site Generation)

Backend:

Next.js API Routes

Main endpoint:

/api/generate

AI Layer:

OpenAI API

Model:

gpt-4o-mini

Usage:

Generate captions, titles, hooks, etc.

Database:

Supabase

Database engine:

PostgreSQL

Used for:

User accounts
Favorites
Generation history

Authentication:

Supabase Auth

Supports:

Google OAuth
Email Magic Link

Deployment:

Vercel

Website:

https://tooleagle.com

6. Environment Variables

Required environment variables:

OPENAI_API_KEY

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

Environment variables are configured in Vercel.

.env.local is ignored by git.

API keys are never committed to the repository.

7. Current Product Features

AI Tools:

24 AI generators.

Examples:

TikTok Caption Generator
YouTube Title Generator
Instagram Hashtag Generator
TikTok Bio Generator
YouTube Description Generator

Content:

30+ blog articles targeting creator SEO keywords.

Examples:

TikTok captions
YouTube titles
Viral hooks
Instagram hashtags

SEO Pages:

278 programmatic SEO pages.

Example routes:

/tiktok/funny-captions
/tiktok/aesthetic-captions
/youtube/gaming-titles
/instagram/short-captions

These pages drive organic search traffic.

User System:

Features include:

Favorites
Generation history
Dashboard

Local storage sync with Supabase.

Account System:

Login page:

/login

Dashboard:

/dashboard

Users can:

View history
Save favorites
Manage account

Monetization System:

Daily usage limit:

30 generations per day.

Pricing page:

/pricing

Upgrade CTA exists but payment system not yet integrated.

8. Growth System

SEO infrastructure includes:

Dynamic sitemap
robots.txt
Canonical URLs
OpenGraph metadata
Structured data

Internal linking between:

SEO pages
Tools
Blogs

9. Translation Compatibility

Website language:

English only.

Browser translation supported.

Fix implemented for React translation crash:

DOM monkey patch
Event delegation

Documentation:

docs/BROWSER-TRANSLATION-MEMORY.md

10. Development Phases Completed

Phase 9

24 tools implemented.

Phase 10

SEO infrastructure implemented.

Phase 11

Content engine created.

20+ blogs.

Phase 12

AI generation integrated using OpenAI.

Phase 13

Growth features:

Popular tools
Sharing
Newsletter

Phase 14

Programmatic SEO engine.

61 pages.

Phase 15

SEO expansion.

278 pages.

Phase 16

Lightweight user system.

Favorites
History
Usage badges

Phase 17

Supabase account system.

Login
Dashboard
Cloud sync

Phase 18

Monetization foundation.

Usage limits
Pricing page
Upgrade UI

11. Current Development Phase

Phase 19

Creator Workflow System.

Goal:

Transform ToolEagle into a creator workflow platform.

New features planned:

Result editor
AI improvement actions
Creator projects
Creator mode page

12. Phase 19 Features

Result Editor

Users can edit generated content before copying.

AI Improve

Buttons:

Make shorter
Make funnier
Make more viral
Add emojis

Projects

Users can create projects and save generated content.

Database tables:

projects
project_items

Creator Mode

New page:

/creator

User inputs:

Topic
Platform
Tone

AI generates:

Hook
Caption
Hashtags
Video idea

13. Long Term Product Vision

Short term goal:

Reach 100k monthly users via SEO.

Medium term:

Build a creator workflow platform.

Long term:

Become a leading AI creator platform.

14. Future Planned Phases

Phase 19

Creator workflow.

Phase 20

Stripe payments.

Phase 21

Growth engine.

Phase 22

Advanced AI creator tools.

15. Project Status

Current status:

AI SaaS MVP completed.

Next milestone:

Convert traffic into registered users and paid subscribers.

1. Cursor 角色与责任
1.1 Cursor 的角色定位

Cursor 是 ToolEagle 项目的工程负责人，负责以下任务：

实现产品功能

编写和修改代码

确保项目架构的稳定性与可扩展性

根据 ChatGPT 提供的产品需求进行开发

按照优先级及时完成开发任务

汇报开发状态，并在问题出现时与 ChatGPT 协商解决方案

1.2 Cursor 的开发职责

不做产品决策：产品方向、功能优先级、商业化策略由 ChatGPT 负责。

代码实现：Cursor 根据 ChatGPT 提供的功能要求编写代码，实现前端、后端功能。

保持架构稳定性：Cursor 不会随意更改项目的技术架构，尤其是当前的 Next.js + SSG 架构。

开发进度汇报：开发过程中，Cursor 需要定期报告功能实现的状态，并汇报当前开发进度、遇到的问题以及任何需要产品决策的事项。

2. 开发流程与工作方式
2.1 工作流程

阶段需求提供：ChatGPT 定义每个开发阶段的产品需求，并提供详细的实现说明。

任务传递：用户或 ChatGPT 将任务说明转发给 Cursor。

任务实现：Cursor 按照需求描述完成开发，确保代码质量，保证所有功能按时交付。

开发汇报：每个开发阶段完成后，Cursor 汇报当前实现状态，列出已完成和待解决的任务。

需求反馈：如遇到无法实现或需要调整的需求，Cursor 向 ChatGPT 提供反馈并进行讨论。

2.2 开发方式

按照阶段推进：开发将按照阶段进行，ChatGPT 确定优先级和需求，Cursor 完成每一阶段的开发。

代码质量控制：遵循 干净、可扩展、可维护 的代码规范，确保代码库整洁、模块化。

定期代码审查：对于关键模块，进行代码审查，确保代码质量。

2.3 任务分配规则

优先级排序：每个阶段的任务按优先级执行，确保最重要的功能首先交付。

逐步实现：每个阶段的需求必须细化到明确的功能点，每个功能点都有清晰的开发任务。

3. 处理问题的优先级与决策规则
3.1 问题处理优先级

高优先级：影响用户核心体验的功能问题（如功能无法使用、登录问题等）。

中优先级：影响部分功能的性能问题（如页面加载速度慢、非核心功能不可用等）。

低优先级：细节优化（如UI细节、交互动画等）。

3.2 问题解决规则

高优先级问题：必须在 24小时内 修复，确保不会影响用户体验。

中优先级问题：在下一阶段开发时解决，影响次要功能时，不影响主功能开发。

低优先级问题：可以在产品上线后进行优化，修复时机根据整体开发进度安排。

3.3 决策方式

产品决策：ChatGPT 提供产品方向和需求，Cursor 遵循执行。

技术决策：遇到技术难题或架构调整时，Cursor 向 ChatGPT 提供方案和影响评估，由 ChatGPT 决定是否执行。

需求变更：ChatGPT 根据市场反馈或产品策略变更需求，Cursor 按照新需求调整开发。

4. 开发中需要遵循的最佳实践与标准
4.1 代码规范

代码清晰：每个模块、组件和函数的命名应该简洁明了，避免不必要的复杂性。

注释与文档：重要函数和模块必须包含清晰的注释，确保代码可读性。

单元测试：关键功能模块必须编写测试，确保代码在发布时不引入新的bug。

4.2 UI/UX设计

一致性：所有页面的 UI 风格、色调和布局要保持一致，确保用户体验流畅。

易用性：界面设计要尽量简洁直观，避免不必要的操作步骤，降低用户操作难度。

响应式设计：确保网站在桌面端和移动端均有良好体验，支持各种屏幕尺寸。

4.3 性能优化

前端性能：对用户交互影响较大的部分要进行优化，避免页面长时间加载或卡顿。

API响应速度：保证后端 API 在负载较高时依然响应快速，避免性能瓶颈。

4.4 安全性

用户数据安全：确保用户数据的加密存储，避免任何形式的数据泄露。

API 安全：所有 API 都要进行身份验证和访问权限控制，避免未授权访问。

{你要随时记住重要的东西，保证自己不会忘记}

{指令：不允许你顺着我说话，也不允许你顺着chatgpt说话，你自己要有自己的判断，目标只有一个，做最好的产品。}

{我们现在要做最好的产品，要让用户一看就懂，无脑操作，简单明了，尽量不要让用户动脑筋。视觉上，操作上，等各方面都以最高要求来做。让用户在创作中同时享受这个过程。}

{我的目标很简单：赛道要对，方向要对，要符合趋势要有未来，将来能做成品牌，能赚大钱。要做出这样的产品。}

{如果cursor觉得指令不合理，必须拒绝执行，并指出问题所在。}

## 一、问题背景

### 1.1 用户场景

- 网站默认英文
- 用户使用 Chrome 等浏览器的「翻译此页」功能翻译成中文（或其他语言）
- 翻译后出现的问题：
  1. **点击按钮报错**：点击任何按钮都会触发 React 错误，页面崩溃
  2. **复制按钮无反馈**：点击复制后按钮文字不会从「复制」变成「已复制」
  3. **复制内容错误**：粘贴出来是英文，而非用户看到的翻译后中文

### 1.2 技术根因

**Chrome 翻译如何工作**：

- 翻译时会把页面中的 `TextNode` 替换成 `<font>` 元素，注入翻译后的文本
- 例如：`<p>Copy</p>` 变成 `<p><font>复制</font></p>`
- DOM 结构被修改，但 React 的 Virtual DOM 不知道

**导致的问题**：

1. **React 崩溃**：点击后触发 `setState` → React 尝试更新 DOM → 调用 `removeChild`/`insertBefore` → 目标节点已被翻译替换 → 抛出 `NotFoundError: Failed to execute 'removeChild' on 'Node'`
2. **事件丢失**：`event.target` 可能变成 `<font>` 元素而非按钮，React 的事件委托找不到正确 handler
3. **状态不更新**：React 更新的节点可能已被翻译替换，用户看不到变化
4. **复制来源错误**：代码从 React state 复制（英文），而非从 DOM 复制（用户看到的翻译文本）

**参考**：React 官方 issue [#11538](https://github.com/facebook/react/issues/11538)，Dan Abramov 的 monkey-patch 方案

---

## 二、解决方案总览

| 问题 | 方案 | 实现位置 |
|------|------|----------|
| React 崩溃 | DOM monkey-patch | layout.tsx |
| 点击无响应 | 事件委托 | clickDelegation.ts + useDelegatedClick |
| 按钮不显示「已复制」 | 直接改 DOM + data 属性 | ToolCopyButton.tsx |
| 复制英文而非中文 | 从 DOM 取 innerText | getTextToCopy + data-copy-source |

---

## 三、详细实现

### 3.1 DOM Monkey-Patch（防止 React 崩溃）

**文件**：`src/app/layout.tsx`

**原理**：在 React 运行前，重写 `Node.prototype.removeChild` 和 `insertBefore`，当节点已被翻译移动时静默返回，不抛错。

**代码**（内联在 `beforeInteractive` Script 中）：
```javascript
(function(){
  if(typeof Node==="undefined"||!Node.prototype)return;
  var r=Node.prototype.removeChild;
  Node.prototype.removeChild=function(c){
    if(c.parentNode!==this)return c;
    return r.apply(this,arguments)
  };
  var i=Node.prototype.insertBefore;
  Node.prototype.insertBefore=function(n,ref){
    if(ref&&ref.parentNode!==this)return n;
    return i.apply(this,arguments)
  }
})();
```

**关键**：`strategy="beforeInteractive"` 确保在 React  hydration 之前执行。

---

### 3.2 事件委托（让点击在翻译后仍有效）

**涉及文件**：
- `src/lib/clickDelegation.ts` - 核心逻辑
- `src/hooks/useDelegatedClick.ts` - React hook
- `src/components/DelegatedButton.tsx` - 按钮封装

**流程**：
1. 在 `document` 上添加 **capture 阶段** 的 click 监听
2. 点击时用 `event.target.closest("[data-delegate-click]")` 找到按钮（即使用户点到翻译插入的 `<font>` 子元素）
3. 从 `data-delegate-id` 取 id，在 registry 中查找 handler 并执行
4. `stopPropagation` 阻止事件继续传播，避免 React 处理（可能报错）

**使用方式**：
- 需要委托的按钮：用 `<DelegatedButton onClick={...}>` 替代 `<button onClick={...}>`
- 或使用 `useDelegatedClick(handler)` 获取 `{ "data-delegate-click": "", "data-delegate-id": id }` 并 spread 到 button

**已使用 DelegatedButton 的组件**：
- ToolResultListCard（Regenerate、Save）
- ShareButtons
- GenericToolClient（Try example、Generate）
- ExamplesCard
- NewsletterCapture
- Login 页（Google 登录、Email 提交、Use different email）
- Favorites 页（Unsave）
- Error / GlobalError
- 各工具 pageClient（Try example、Generate）

---

### 3.3 复制按钮状态（data-copied）

**文件**：`src/components/tools/ToolCopyButton.tsx`

**问题**：React 的 `setState` 更新按钮文字后，翻译层可能已替换 DOM，用户看不到「已复制」。

**方案**：
- 按钮内同时渲染两个 span：`[data-copy-label]`（复制）和 `[data-copied-label]`（已复制）
- 用 `data-copied="true"|"false"` 控制显示
- 复制成功后：`btn.dataset.copied = "true"`（直接改 DOM）
- 1.5 秒后：`btn.dataset.copied = "false"`
- CSS：`[&[data-copied=true]_[data-copy-label]]:hidden [&[data-copied=true]_[data-copied-label]]:!inline-flex`

---

### 3.4 复制显示文本（getTextToCopy）

**问题**：复制的是 React state 中的英文，而非用户看到的翻译文本。

**方案**：
- 在显示文本的容器上加 `data-copy-source`
- 在父级卡片上加 `data-result-item` 或 `data-result-list`
- `ToolCopyButton` 支持 `getTextToCopy={(btn) => ...}` 回调
- 回调内：`btn.closest("[data-result-item]")?.querySelector("[data-copy-source]")`，取 `innerText`
- 若 `getTextToCopy` 返回文本，则用该文本复制；否则走原有 `onClick`

**已加 getTextToCopy 的位置**：
- ToolResultListCard：单条复制、复制全部
- Favorites 页
- Dashboard

**注意**：HistoryPanel 的复制仍用 state（展示的是 input，复制的是 items，结构不同）。

---

### 3.5 安全复制（safeCopyToClipboard）

**文件**：`src/lib/clipboard.ts`

**作用**：在非安全上下文或翻译修改 DOM 时，避免 clipboard API 报错。

**逻辑**：优先用 `navigator.clipboard.writeText`，失败则用 `document.execCommand("copy")` + 临时 textarea。

---

## 四、项目配置

### 4.1 next.config.mjs

- 使用 `createNextIntlPlugin("./src/i18n/request.ts")`
- 当前固定 `locale: "en"`，无语言切换器
- webpack：`ignoreWarnings` 过滤 next-intl 相关警告，`infrastructureLogging: "error"`

### 4.2 i18n

- `src/i18n/request.ts`：固定返回 `locale: "en"` 和 `messages/en.json`
- `messages/en.json`、`messages/zh.json` 存在但仅 en 被使用
- 文案通过 `useTranslations` 使用，可被浏览器翻译

### 4.3 .gitignore

- `.env*.local`、`.env` 等已忽略，API 密钥不会提交
- `/data` 忽略本地 newsletter 数据

---

## 五、文件清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/lib/clickDelegation.ts` | 点击委托 registry 与 document 监听 |
| `src/hooks/useDelegatedClick.ts` | 委托点击 hook |
| `src/components/DelegatedButton.tsx` | 委托按钮组件 |
| `src/lib/clipboard.ts` | 安全复制 |
| `messages/en.json` | 英文文案 |
| `messages/zh.json` | 中文文案（暂未用） |

### 主要修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/app/layout.tsx` | translate-resilience Script、NextIntlClientProvider |
| `src/components/tools/ToolCopyButton.tsx` | 委托、getTextToCopy、data-copied |
| `src/components/tools/ToolResultListCard.tsx` | DelegatedButton、data-result-item、data-copy-source、getTextToCopy |
| `src/components/tools/ShareButtons.tsx` | DelegatedButton |
| `src/components/tools/GenericToolClient.tsx` | DelegatedButton |
| `src/app/favorites/page.tsx` | DelegatedButton、getTextToCopy |
| `src/app/dashboard/DashboardClient.tsx` | getTextToCopy |
| `next.config.mjs` | next-intl、webpack 配置 |

---

## 六、测试要点

1. **英文模式**：所有按钮、复制、收藏等正常
2. **翻译成中文后**：
   - 点击复制 → 按钮变为「已复制」
   - 粘贴内容为中文（与页面显示一致）
   - 点击其他按钮无报错
3. **其他语言**：翻译成日文、韩文等，逻辑应同样正常

---

## 七、部署

### 7.1 推送前

```bash
npm run build          # 确保构建成功
git status             # 确认无 .env.local
git add .
git commit -m "feat: 浏览器翻译兼容与功能更新"
git push origin main
```

### 7.2 环境变量

- 本地：`.env.local`（不提交）
- Vercel：在 Project Settings → Environment Variables 中配置
- 需要：`OPENAI_API_KEY`、`NEXT_PUBLIC_SUPABASE_*` 等

---

## 八、已知限制与后续优化

1. **HistoryPanel 复制**：仍从 state 复制，若需翻译后复制需调整结构
2. **Analytics 事件**：使用 `getTextToCopy` 时未调用 `onClick`，可能影响部分埋点
3. **扩展语言**：若要恢复语言切换，需在 `i18n/request.ts` 中读 cookie，并恢复 LanguageSwitcher

---

## 九、参考链接

- [React #11538 - Google Translate DOM mutations](https://github.com/facebook/react/issues/11538)
- [Gaearon monkey-patch 方案](https://github.com/facebook/react/issues/11538#issuecomment-417504600)
- [Everything about Google Translate crashing React](https://martijnhols.nl/blog/everything-about-google-translate-crashing-react)
