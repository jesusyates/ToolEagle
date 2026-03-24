# ToolEagle — 项目进度总报告（给 ChatGPT / 外部协作者）

> **ChatGPT 必读**：本文件为 **与仓库同步的当前主报告**（能力、约束、阶段判断）。  
> 另有一份 **`docs/CHATGPT-PROJECT-REPORT.md`** 仅作 **索引 + 下一步清单 + 历史里程碑速查**，避免与旧版「仅 V76–V78」长文混淆。  
> **规则正文**始终只有 **`docs/MEMORY.md`**。

> **生成说明**：基于仓库 **`docs/MEMORY.md`（唯一产品/架构规则正文）** 与代码结构整理；用于同步「我们现在做到哪、约束是什么、下一步怎么走」。  
> **技术栈概览**：Next.js（App Router）、TypeScript、Supabase、多市场 AI Router（OpenAI + 可选 DeepSeek CN）、全站 Content Safety Engine（CSE）。

---

## 1. 产品定位与战略优先级

### 1.1 双轨结构

| 层级 | 角色 |
|------|------|
| **英文全球站 `/`** | **主**：全球流量与品牌默认叙事中心、SEO/增长主引擎 |
| **中国站 `/zh`** | **副**：首个深度本土化市场 + **国家站模板**；不是「翻译站」，而是 **平台级创作者系统** |
| **其他 locale**（如 `/es/how-to`） | **副**：按需扩展，不稀释全球站优先级 |

**硬性原则**：英文站永远是主；国家/市场站永远是副。**禁止**用国家站替代全球 SEO 共识；**禁止** CN-only 架构绕开全球主系统（中国只能是扩展）。

### 1.2 中国站本土平台执行顺序（锁死）

**顺序**：**抖音 → 小红书 → 快手**（不得在同一版本内 **并行全量上线** 多个本土平台栈）。

| 阶段 | 平台 | 状态（规则层） |
|------|------|------------------|
| 1 | **抖音** | **当前唯一允许全量上线的本土平台栈**；工具 + 示例 + 教程/方法论 + 场景化叙事需齐备 |
| 2 | **小红书** | 第二阶段；**未就绪前仅配置/占位**，不上线空壳整站 |
| 3 | **快手** | 第三阶段；同上 |

代码里平台元数据见 `src/lib/zh-site/cn-platforms/config.ts`：`douyin.launched === true`，`xiaohongshu` / `kuaishou` 为 **`launched: false`**（占位）。

### 1.3 工程结构基线（零点五）

记忆本要求：**模块化分层**（`src/app` 路由与页面、`src/lib` 域逻辑、`src/config`、`src/components`）、**稳定可观测**、**壳层复用**（例如 `/zh` 由 `layout` 统一头尾）、**可排查**（入口路由/API/关键组件可追溯）。这与「可维护、可观测、可演进」一致。

---

## 2. 中国站（`/zh`）— 当前落地情况

### 2.1 布局与导航（近期工程）

- **`src/app/zh/layout.tsx`**：统一挂载 `ZhCnPerfBeacon` + **`ZhSiteHeader`** + **`ZhSiteFooter`**；子页面各自保留 `<main>` 与页面级背景（避免重复顶栏/底栏、改善客户端导航时壳层一致性）。
- 大量原先在每个 `page.tsx` 内重复的头尾已移除；工作台类组件在 `variant="zh"` 时不再重复渲染中文头尾（由 layout 提供）。
- **程序化 SEO 中文页**：`ProgrammaticPageTemplate` 在 `locale === "zh"` 时不渲染英文 `SiteHeader`/`SiteFooter`（避免与 `/zh` layout 叠双份）。

### 2.2 信息与首页

- **`/zh`**：中文首页组件 **`ZhWrittenForCreatorsHome`**（品牌首屏 +「我们坚持的四件事」等）。
- **`/zh/about`**：**永久重定向到 `/zh`**（见 `next.config.mjs`）。

### 2.3 抖音栈（主战场）

记忆本描述与代码对齐要点：

- **抖音工具首页 `/zh/douyin`**：**抖音创作操作系统** 入口；与场景数据（如 `douyin-scenes.ts`）、`ZhDouyinToolsLanding` 等配合。
- **抖音专属生成器**：路径形态 **`/zh/douyin-*-generator`**（多工具；记忆本称「六件套」等，以仓库路由为准）。
- **教程与索引**：`/zh/douyin-guide/`、`/zh/douyin/tools`、`/zh/douyin/tutorials` 等；**原 `/zh/tools` 301 至 `/zh/douyin`**。
- **工具内页 UI**：与全球站工具同构思路（如 `PostPackageToolClient` + `ToolPageShell` + 中文侧栏/关联块等）。
- **顶栏**：「抖音」直链 `/zh/douyin`（记忆本：无下拉菜单）；导航上还包含 **小红书·快手（soon）**、工具、定价等（见 `ZhSiteHeader`）。

### 2.4 小红书 / 快手

- **规则**：第二阶段/第三阶段；**禁止空壳整站抢 SEO**。
- **代码**：`/zh/xiaohongshu`、`/zh/kuaishou` 等页面可存在占位或轻量说明，但 **`cn-platforms/config.ts` 中 `launched: false`** 表示 **未作为「已上线平台栈」** 正式铺开。

### 2.5 定价、Pro、算力（CN）

- **`/zh/pricing`**：套餐与 CTA（记忆本 V108）。
- **`/zh/pro`**：价值说明与转化相关叙事（与 pricing 分工）。
- **V107 计费**：`user_credits` + `credit_usage_logs`；`/api/generate-package` 在 `market=cn` 且有余额时走扣次（完整发布包等消耗规则见记忆本）。
- **支付**：`POST /api/payment/create-order`、回调 `POST /api/payment/callback`；`order_type` 区分 **pro / donation / credits** 等（见记忆本 V101–V107 与 migrations）。

### 2.6 支持者、打赏、反馈、人工支持

- **支持者/打赏**：`/zh/support`；`POST/GET /api/donation/*`；匿名 `te_supporter_id`（httpOnly）；**写入需 service role**（见 `docs/V100-*`、`V101-CN-PAYMENT.md` 等）。
- **反馈**：`POST /api/feedback/create`；管理读列表需 `FEEDBACK_ADMIN_SECRET`。
- **人工支持**：弹窗与页脚触发，环境变量 `NEXT_PUBLIC_SUPPORT_*` 等（见记忆本 V100.4）。

---

## 3. 全球英文站 — 能力概览

- **工具矩阵**：`/tools/*` 等多工具；hook、caption、title、post-package 等；与 `src/config/tools.ts` 等配置联动。
- **程序化 SEO（pSEO）**：`/pseo/*`；关键词与质量分、内链、模板见记忆本 V93/V104.1；**pSEO 信任文案策略与 CSE 区分**。
- **创作者/博客**：博客与创作者相关路由与 API（如 `/api/blog`）。
- **分发与增长**：工作台侧有 distribution、growth-mission、traffic-injection 等相关 API 与页面（运营向能力，细节以代码为准）。
- **收入/联盟运营**：`/dashboard/revenue` 等；**仅运营者**（`OPERATOR_USER_IDS` / `OPERATOR_EMAILS` 等）可访问；未配置则不可进。

---

## 4. 技术与合规核心

### 4.1 Content Safety Engine（CSE）

- **所有面向用户的 AI 输出**必须经过 CSE（prompt 层 + 输出层 + 平台规则层）。
- **主路径**：`POST /api/generate-package`、`POST /api/generate`、`POST /api/improve` 等已在记忆本标注接入点。
- **市场解析唯一入口**：`resolveSafetyMarket`（禁止各路由复制一套 cookie/locale 判断）。

### 4.2 AI Router（V98）

- **post-package**：`routerGeneratePostPackage`（`src/lib/ai/router.ts`）。
- **CN**：可选 DeepSeek 链 + 回退；环境变量见 `.env.example`。
- **遥测**：`[ai_telemetry]`、中文 `[cn_page_perf]` 等（见 `docs/COUNTRY-DELIVERY-STANDARDS.md`）。

### 4.3 API 规模（粗粒度）

- `src/app/api/**/route.ts` 约 **110+** 个路由文件量级（含 SEO sitemap、支付、分发、反馈、revenue、zh analytics 等），**具体以仓库为准**。

### 4.4 地理与语言

- **Middleware**：根路径 `/` 可按 IP + `Accept-Language` + `geo_debug` 等决定落地 `/` 或 `/zh`；**优先尊重** `te_preferred_locale`（zh/en），避免与调试/geo 打架（见 `src/config/geo-redirect.ts`、`src/middleware.ts`、记忆本）。
- **中文站 → 英文首页**：客户端需走 **`/?te_locale=en`**（或由 `navigateToEnglishHome` / `EnglishHomeLink` 触发），由 middleware **Set-Cookie** 后再回到 `/`；勿依赖裸 `<Link href="/">` 从 `/zh` 进全球站（否则仍可能因 `zh` cookie 被重定向回 `/zh`）。

---

## 5. 文档与协作约定

- **唯一规则正文**：`docs/MEMORY.md`（Cursor 规则只引用流程，不重复全文）。
- **专题文档**：仓库内另有 `docs/V*.md`、`docs/COUNTRY-DELIVERY-STANDARDS.md` 等，用于专题；**战略级约束以 MEMORY 为准**。
- **AGENTS.md**：指向 `docs/MEMORY.md`。

---

## 6. 仓库脚本（npm scripts 节选）

见根目录 `package.json`：Next `dev/build/start/lint`、Supabase `db:migrate`、中文 SEO 生成 `zh:*`、英文 `en:auto`、自动化分发 `auto-distribute` / `daily-pipeline`、`revenue:*` 等——用于内容管线与运营辅助，**非全部必跑**。

---

## 7. 当前阶段判断（给决策用）

**已成熟推进**：全球站 + **中国站抖音栈**（工具/教程/IA/支付与算力/CSE/布局壳层等）在记忆本与代码中已形成闭环主轴。

**尚未按规则「全量开栈」**：**小红书**、**快手**（配置占位 vs 平台级「工具+示例+教程+场景」全量上线）。

**若问「能不能开始做小红书」**：  
- **做产品调研、架构设计、配置与分支、局部 POC** → 与规则不冲突。  
- **对外作为第二本土平台全量上线、与抖音并行抢 SEO/转化** → **与当前记忆本锁死的顺序与「禁止并行全量」冲突**，需先走 **记忆本修订 + 负责人拍板** 或等抖音栈进入可并行扩平台的阶段。

---

## 8. 免责声明

本报告是 **进度与约束的摘要**，不替代：线上环境变量实际配置、数据库迁移状态、支付/第三方密钥、以及未提交的本地改动。部署与合规以实际运行环境与法务为准。

---

*文件路径：`docs/PROJECT-STATUS-REPORT-FOR-CHATGPT.md`*  
*正文更新：2026-03-22（增加与 `CHATGPT-PROJECT-REPORT.md` 分工说明、middleware/跨站跳转要点）*
