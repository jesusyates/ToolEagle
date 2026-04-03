# ToolEagle 记忆本（唯一规则文件）
**只有本文件承载全部约定。** 无其他「架构原则 / 国家站模板 / V98 说明」文档；改规则只改此处。
**AI 行为（省 token）**：**不**要求每条用户消息都 Read（避免同一会话反复注入全文、堆积 token）。助手在**本会话首次**即将产出实质性内容前 **`Read docs/MEMORY.md` 一次**；同一会话内**延续工作不必每条再读**，除非：用户要求「读记忆本」、刚改过本文件、重大决策前需对齐磁盘、或不确定是否仍最新。细则见 **`.cursor/rules/00-memory-read-policy.mdc`**。
**可见确认**：**本会话第一次**完成 Read 并对齐后的**第一条**实质性回复须含 **「已读记忆规则」**（可注明「本会话首次」）。未 Read 时不得写该句；延续本会话未再读时可省略或说明 **「延续本会话，未重复读记忆本」**。
---
## 零点零·一、Cursor 低耗执行代理（省 token · 永久）

You are a low-cost execution agent with strict token limits.

HARD TOKEN RULES:

1. Maximum output per response: 300 tokens.
2. If a task would exceed 300 tokens:
   - DO NOT execute it
   - DO NOT partially execute
   - Instead, respond with:
     "Task too large. Please split into smaller steps."

3. Maximum input to process: only focus on the minimal relevant part.
   - Ignore unrelated context
   - Do NOT expand scope

EXECUTION RULES:

4. NEVER generate long reports.
5. NEVER analyze the whole project or website.
6. NEVER summarize unless explicitly required.

7. ONLY perform ONE small task per request.

8. When modifying code:
   - Output ONLY the changed lines or minimal patch
   - DO NOT rewrite entire files

9. When checking:
   - Max 3 bullet points
   - Each point ≤ 1 short sentence

10. If multiple actions are requested:
   - Refuse and say:
     "Please provide one task at a time."

11. If task is vague or large:
   - Ask for a smaller, specific instruction

GOAL:

Minimize token usage while ensuring correct, executable results.

---
## 零点零、使命与北极星（不可忘）
**使命与最大目标**：为全球内容创作者提供**最强大的 AI 创作工具平台**。

1. **不做小打小闹**、不做**简单易复制**、不做过时产品；要做**符合未来趋势**、**用户真需要**的产品；产品必须做好，将来做成**品牌并赚大钱**。
2. **功能准入**：任何功能须至少满足其一 — **增加流量**、**增加内容**、**增加收入**；**不满足则不开发**。避免无流量功能、纯 UI 装饰、零散小工具。
3. **协作上限**：外部 AI（含 ChatGPT / Cursor 等）须**尽最大能力**推进本产品；在工程与合规前提下**规模越大越好**，直至技术能力边界。
4. **单一北极星**：做最好的产品、服务好用户、获得更多流量、赚更多的钱（表述可拆，**方向唯一**）。
5. **核心价值**：帮助创作者**更快创作**、**获得更多流量**、**赚更多钱**。
6. **终局愿景**：成为**全球最大的 Creator AI 工具平台**。
7. **规模目标（量化）**：**100,000 – 500,000** 级可索引 SEO 页面体量；**100 万+** 月访问、**持续增长**（以数据与工程可观测为准，随阶段校准口径，不降低质量红线）。

---
## 零、战略最高优先级（不可忘）
1. **全球 + 本土双结构**（规模最大化，并列设计，不单市场写死）
2. **技术 / 架构 / 模式可维护、可观测、可演进**
3. **无限可扩展**（少硬编码权宜）
4. **真实用户问题**（非工具堆砌）
5. **大规模盈利路径**（非小打小闹）
6. **🛡️ Content Safety Engine（全平台合规系统）** — **系统级核心竞争力**，见 **「二点五」**；**禁止**新增「不经安全层的 AI 用户输出」路径。
7. **📱 Mobile-First（移动优先）** — **全站用户可见体验以手机为第一优先**，见 **「零点六」**；新页面/新工具/改版须默认按该条验收。
8. **产品形态路线图（Web → PWA → 原生）** — **当前阶段必须专注 Web（移动优先）**；PWA / 原生仅在中长期、且满足前提时再投入，见 **「零点七」**。
9. **工具质量红线（🔒 永久）** — **每一个工具必须做好，做到接近完美；如果做不好就不上线**（宁缺毋滥，禁止用凑数量替代真实可用性）。
---
## 零点五、工程结构基线（模块化 · 稳定 · 可排障）
**共识**：代码量增长时，**结构须保持清晰、可维护**；线上须 **流畅、稳定**；出问题时 **易缩小范围、易排查根因**。（与「零」第 2 条「可维护、可观测、可演进」一致，本条为**落地约束**。）
- **模块化 / 分层**：按职责分目录——路由与页面 `src/app`、域逻辑 `src/lib`、配置与表驱动 `src/config`、可复用 UI `src/components`；**单文件职责收敛**，避免单页堆满业务；多市场/国家站能力优先 **共享模块 + `market` / `locale` 显式分支**，**禁止**为省事复制整套「影子分叉」。
- **稳定性**：关键路径（鉴权、支付、生成、CSE 等）**显式错误处理**；**禁止**无故 `catch` 后静默吞错；延续既有 **telemetry / 日志** 模式，必要时使用 **可检索前缀**（与现有 API 约定一致）。
- **体验流畅**：壳层与布局 **复用**（如 `/zh` 由 `layout` 统一头尾），避免无意义重复挂载与重复请求；性能与缓存见 **「二、分区性能」**。
- **可排查**：新能力应能说出 **入口路由、入口 API、关键组件**；复杂链路在 **`MEMORY` 或单一 `docs/*`** 留 **索引句**（入口在哪、数据从哪来），避免「唯一真相」长期散落多处且无记录。
- **自动处理优先**：在不与本文件及既有安全/合规/交互约束冲突的前提下，凡是助手具备充分信息与能力可自动完成的内容（实现、修复、补测试、执行可行的验证、生成必要的工单/输出等），应默认自动完成；只有在无法完成、需要你确认（例如明确要求你选择方案/同意上传推送等）、或可能产生不可逆风险时，才让用户手动介入。
---
## 零点五·一、文档与真相优先级（信息源）
协作与决策时，按以下顺序理解「该信什么」——**避免**用进度报告或旧文档推翻产品方向，也**避免**把当前代码里的临时实现当成永久正确。
1. **`docs/MEMORY.md`（最高优先级）**  
   - 所有产品方向、国家策略、平台顺序、架构原则 **以本文件为准**。  
   - **即使**与当前代码或某份实现文档不一致，也 **以 MEMORY 为未来对齐方向**（除非经负责人修订本文件）。
2. **`docs/PROJECT-STATUS-REPORT-FOR-CHATGPT.md`（当前状态）**  
   - 用于判断 **「现在做到哪」**、模块落地情况与约束摘要。  
   - **不用于**推翻或替代 MEMORY；与 MEMORY 冲突时 **以 MEMORY 为准**，状态报告应随后更新以反映「计划 vs 现状」差距。
3. **代码实现（最终验证「是什么」）**  
   - 若文档与代码行为冲突，**以代码为当前运行真实状态**（便于排障与改 bug）。  
   - **不**因「代码已如此」就自动视为正确方向；是否保留或重构仍须 **与 MEMORY 对齐**。
4. **历史 / 专题文档（最低优先级）**  
   - 如 `docs/V*.md`、旧版 ChatGPT 报告、实现摘要等：**仅作背景与专题参考**。  
   - **禁止**单独依此做产品或架构决策；决策链仍回到第 1 条。
5. **`memory/`（运行手册 · 分步怎么做）**  
   - 仓库根目录 **`memory/`**：按主题拆分的 **执行步骤、清单、协作说明**（企划落地、脚本流水线等），由人或外部 AI 维护；**入口索引见 `memory/README.md`**。  
   - **全链路执行（Cursor 防跑偏）**：日常自动生产、上传与生产状态汇报、SEO/检索飞轮、变现与风控沙箱、内容治理、版本开发与汇报格式等，见 **`memory/tooleagle-project-operating-manual.md`**（与第 1 条冲突时仍以本 MEMORY 为准）。**用户要求上传/ push 同步远端时**，执行 `git` 前须按该手册 **§8** 核对并汇报当日生产状态（详见 `.cursor/rules/00-memory-read-policy.mdc` 第 6 条）。  
   - **不作**规则正文：与第 1 条冲突时 **始终以本文件（MEMORY）为准**。  
   - AI 使用方式：**先读索引或上述全链路手册（视任务）**，再按需打开其他 `memory/*.md`；不在单次对话中假设「已读完整个文件夹」。
**索引**：给外部 AI 的协作入口说明见 **`docs/CHATGPT-PROJECT-REPORT.md`**（指向主报告与 MEMORY，避免误读过时长文）。
---
## 零点六、Mobile-First（移动优先 · 🔒 永久）
**定位（写死）**：ToolEagle **所有用户可见体验以手机为第一优先**；桌面为增强，**不得**以桌面布局为唯一标准牺牲移动端。
**工具必须**
- **单手操作**（主路径拇指可达；避免关键动作依赖精细拖拽或角落点击）。
- **最少输入步骤**（能省则省；默认值、历史、一键填充优于长表单）。
- **清晰大按钮（CTA）**（主操作一眼可辨；次要操作层级分明）。
- **卡片化结果**（结构化输出，便于 **复制 / 选用 / 再生成**）。
**Workflow 必须**
- **流畅连续**，像刷 App：输入 → 生成 → 结果 → 下一步/分享/升级，**同屏或短路径**完成。
- **不割裂、不跳跃**：避免为同一任务在多页面间反复跳转；异步与加载状态须可预期。
**页面必须**
- **信息分块清晰**（标题、步骤、结果分区；用间距与容器区分，而非堆砌）。
- **避免大段文字**（长说明折叠、分点、或链到专门阅读页；工具页以「做完事」为先）。
- **强视觉引导**（层级、对比、留白；让用户知道「现在该点哪里」）。
**与别条关系**：不削弱 **「二点五」Content Safety** 与 **「一点五」** 本土平台语境；移动端亦须满足合规与可读性。
---
## 零点七、产品形态路线图（Web → PWA → 原生 · 🔒）
**原则**：**阶段不可跳步**；资源与注意力与当前阶段对齐，**禁止**在「当前阶段」用原生 / PWA 绑架主链路，导致 SEO、验证与收入被稀释。
### 1️⃣ 当前阶段（**必须专注**）— 🌐 Web（**移动优先**）
- **形态**：浏览器内的 **响应式 Web**（见 **「零点六」Mobile-First**）。
- **目标**：
  - **SEO 流量增长**（可索引、可抓取、内容与内链健康）。
  - **产品验证**（需求真、路径清、数据可观测）。
  - **转化与收入**（付费、打赏、留存与关键漏斗）。
### 2️⃣ 中期阶段 — 📲 PWA（类 App）
- **形态**：**Progressive Web App** — 接近 App 的安装与使用体验，**非**替代当前 Web 主站优先级。
- **目标**：
  - **提升留存**（回访与再进入成本更低）。
  - **接近 App 的体验**（壳层、离线/缓存策略按产品需要逐步加）。
  - **支持「添加到主屏幕」**（各浏览器 / 系统能力范围内）。
### 3️⃣ 成熟阶段 — 📱 原生 App（iOS / Android）
- **前提（须同时满足再立项）**：
  - **稳定流量**（自然与付费增长可预期，非单次campaign）。
  - **DAU**（日活与粘性已验证，非偶发访问）。
  - **收入验证**（商业模式跑通，非仅 DAU 无转化）。
- **说明**：原生开发与上架、审核、推送与多端同步成本高；**未满足前提前**默认 **不**启动原生，以免分散 Web 主战场。
---
## 一、方向（不可搞反）
| 站点 | 角色 |
|------|------|
| **英文站** | **为主** — 全球流量引擎、品牌与默认产品叙事中心 |
| **中国站** | **为副** — 首个本地盈利模型 + **国家站模板**；**非翻译站**，乃 **平台级创作者系统**（见 **一点五**：抖音→小红书→快手，可赚钱、可打透） |
| **其他国家** | **为副** — 按需复制中国站模式，**不稀释**全球站优先级 |
**英文站永远是主；其他国家站永远是副。**
**禁止**：国家站当「主站」、英文站变翻译壳、用国家站替代全球 SEO/增长共识、**CN-only 架构绕过全球主系统**（CN 只能是扩展）。
---
## 一点五、中国站核心发展策略（锁死）
**定位（原则写死）**
- ❗ 中国站 **不是**「中文翻译站」。
- ✅ 中国站 **是**「**平台级创作者系统**」：按本土内容平台分栈建设，每栈以 **工具 + 示例 + 教程/方法论 + 真实场景** 交付，语境对齐 **中国创作者与算法/互动习惯**，目标是把 `/zh` 做成 **能独立增长、能本地化变现** 的业务，而非英文功能的汉化壳。
**执行路径（固定顺序，不得并行全量铺开）**
1. **抖音** — **优先打爆**（当前唯一允许全量上线的本土平台栈）。
2. **小红书** — 第二阶段（未就绪前仅配置/占位，不上线空壳整站）。
3. **快手** — 第三阶段（同上）。
**强制约束**
- ❌ **禁止**将 TikTok / 英文站页面与示例 **直接翻译** 作为中国站主体内容或主要卖点。
- ❌ **禁止**在同一版本内 **同时全量上线** 多个本土平台（避免分散资源与薄内容 SEO）。
- ✅ 每个 **已上线** 本土平台必须同时具备：**专用或明确标注的工具**、**平台原生示例**、**可执行教程/工作流**、**场景化叙事**（同城、带货、知识等真实语境）。
- ✅ 所有中国站用户向文案、示例、教育模块须经得起 **「是否像该平台真实创作者写的」** 检验。
**战略意义**
- 本条不是「加几个功能」，而是：**把中国站从附属翻译层，升级为可与全球站并列的、可赚钱的本土化增长与变现系统**；**英文站仍为品牌与全球叙事中心**（见「一」），二者分工不混淆。
**实现参考**：`src/app/zh/layout.tsx` 统一挂载 `ZhCnPerfBeacon` + `ZhSiteHeader` + `ZhSiteFooter`（子页各自 `<main>`，不再重复顶栏/页脚）；`src/lib/zh-site/cn-platforms/`（平台标识、路由约定、`launched` 节奏）；已落地抖音枢纽见 **`docs/V102-1-CN-PLATFORM-DOUYIN.md`**。中文首页 **`/zh`**：`ZhWrittenForCreatorsHome`（原「写给中国创作者」整页）— `ZhStationBrandHero` +「我们坚持的四件事」+「从这里开始逛」三卡；**`/zh/about` 永久重定向至 `/zh`**（`next.config.mjs`）。中文站 **IA**：`/zh` 为全站品牌与入口；各本土平台分区自治。**V109 — 抖音创作操作系统**：`/zh/douyin` 为 **抖音工具首页**（对齐英文 `/tiktok-tools`：`ZhDouyinToolsLanding` — Hero + 五大场景 × `ToolCard` 网格 + 教程/SEO 链接区），场景数据仍来自 `douyin-scenes.ts`；顶栏 **「抖音」** 直链 `/zh/douyin`（**无下拉菜单**）。抖音专属生成器 `/zh/douyin-*-generator`（六件套）；可执行教程 `/zh/douyin-guide/`；`/zh/douyin/tools` 为工具索引；**已移除**抖音分区页顶栏下 **二级横幅**（创作入口 / 教程 / 工作台，`ZhPlatformSubNav`）；`/zh/douyin/tutorials` 仍为长尾阅读索引。原 `/zh/tools` 仍 301 至 `/zh/douyin`。SEO 集群每页充足示例并内链工具。**抖音工具内页 UI**：与英文站同构（`PostPackageToolClient` + `ToolPageShell` + `ZhDouyinToolRelatedAside`）。**V104.2**：见 **`docs/V104.2-DOUYIN-CONVERSION.md`**（英文主站优先级不变；小红书/快手仍不公开展开）。
---
## 一点六、本土化副站：前后台边界与 SEO（产品定稿 · 锁死）
**目标**：每个国家/市场站是**真正的本土化副站**——前台可独立生长，后台可工程复用；**英文主站战略优先级**仍以「一」为准，不冲突。
1. **SEO**  
   - **搜索引擎友好**始终按市场落实（技术 SEO、sitemap、canonical、结构化数据等），**随业务与竞争情况调整**，不设「一刀切」模板与死规则。  
   - **对用户**：SEO **不抢主叙事**——不在页面上暴露「为 SEO 而设」的操控感；**不在 UI 上展示**面向爬虫的噪声块；**不降低**阅读与转化体验。实现上：metadata、内链、sitemap 等**对用户自然不可见或等价于正常站点能力**，与「无感、不扰民」一致。
2. **国家/市场切换**  
   - **每个**本土化副站（或进入该市场的入口）须保证用户**能切换国家/市场**（与现有 `MarketSelector`、`market`、`cookie` 策略一致或演进），避免用户锁死在单一市场语境。
3. **后台 — 能共用就共用**  
   - **API**、鉴权、**支付与订单**、数据库、**Content Safety**、模型 **router**、计费、日志、观测等**基础设施与服务层**优先**共享、复用**，按 `market` / `locale` / `siteMode` **显式分支**，禁止为副站复制一套绕开主系统的「影子后端」（与「一」CN-only 禁令一致）。
4. **前台 — 必须独立、可自由构建**  
   - 各市场**用户可见**层：**语言**、**工具与路由**、**文章/教程/范例**、**导航与信息架构**、**版式与组件编排** — **全部独立**，**不**要求与英文站页面一一对应、**不**以「翻译全球站」为交付标准。  
   - **允许**各副站**自由布局、自由构建**页面结构（含平台内二级导航、场景分组等），以本土用户习惯为准。
5. **小结**  
   - **副站** = 前台本土化独立 + 后台工程共享 + 分区 SEO（不污染全球主意图）+ 国家可切换；**不是**英文壳翻译站。
---
## 二、双架构与五类分区
- **全球系统 + 国家系统**双轨并存；**中国站 `/zh`** 为第一个模板，可扩展到 `/jp`、`/br` 等。
**五类分区**（按国家/市场切分）：
1. **分区 AI** — 模型、提示、语言、合规按市场；新能力默认接 **router**，见下文「八」。
2. **分区性能** — 缓存、边缘、限流等可按市场优化，不拖累全球默认路径。
3. **分区支付** — 中国侧重微信/支付宝打赏与国内定价说明；全球保留主收款链路（如 `NEXT_PUBLIC_PAYMENT_LINK`）。**V100.1 支持者**：`/zh/support`、`POST/GET /api/donation/*`、匿名 `te_supporter_id`（httpOnly）、`donation_ledger` 表；写入需 **`SUPABASE_SERVICE_ROLE_KEY`**。说明见 **`docs/V100-1-SUPPORTER-SYSTEM.md`**。**V100.2 打赏 UX**：全站不默认铺 QR；价值触发 `SupportPrompt` → `SupportModal`；页脚/首页仅低调文案链到 `/zh/support`。见 **`docs/V100-2-DONATION-UX.md`**。**V100.3 反馈**：`POST /api/feedback/create` 写 `user_feedback`（migration `0032`）；匿名/登录身份同 **`te_supporter_id`** 或 auth id；`GET /api/feedback/list` / `summary` 需请求头 **`x-feedback-admin-secret`** = `FEEDBACK_ADMIN_SECRET`。**V100.4 人工支持**：`SupportContactBody` + `SupportContactModal` + `SupportContactFooterTrigger`（页脚「人工帮助」弹窗，与反馈同级）+ `NEXT_PUBLIC_SUPPORT_*`（企业微信优先）；`/zh/support` 专注打赏/订单与反馈入口，**不再**内嵌人工渠道区块；定价页「人工支持」同弹窗。**V101 CN Pro 订阅**：`orders` + 回调 `POST /api/payment/callback`（migration `0033`）；`order_type`（`0034`）区分 **`pro` | `donation`**。**V101.1 打赏**：`POST /api/payment/create-donation-order`（档位 ¥5/10/20）与 Pro 共用聚合与回调；**`GET /api/donation/history` 只读已支付 `orders`（`order_type=donation`）**；支持者等级由实付金额统计；`POST /api/donation/record` 已废弃（410）；静态个人码仅作「备用、不记账」说明。`router.ts`、`ZhProPaymentPanel`、`ZhDonationPaymentPanel`、`/zh/support`。见 **`docs/V101-CN-PAYMENT.md`**。
4. **分区 SEO** — canonical、hreflang、站点地图按市场独立，不与全球首页抢同一意图。**V107 中国站计费**：CN 使用 `user_credits`（次数 + `expire_at`）+ `credit_usage_logs`；`/api/generate-package` 在 `market=cn` 且有余额时走扣次（`cnCreditCostForGeneration`：完整发布包 3，其余 pro 输出 2）；支付回调 `order_type=credits` 入账；旧 Pro 迁移见 `0035_credits_system.sql`（1000 次临时方案）。**V108 信息架构**：`/zh/pricing` 仅套餐与 CTA；价值说明在 `/zh/pro`；`ZhSiteHeader` 导航为抖音 / 小红书·快手（soon）/ 工具 / 定价；`middleware` 不强制 `/`→`/zh`，仅写 cookie；`MarketSelector` + `market_switch`；中文站登录区 `login_click`。
5. **分区体验** — 导航、CTA、核心转化优先留在该国站内闭环。中国站本土平台栈须遵守 **「一点五、中国站核心发展策略（锁死）」**：当前以抖音为先；**V102.1** 已落地 `/zh/douyin` 与 `/zh/douyin-*-generator`；小红书/快手仅占位配置直至下一阶段。
**实施**：新功能默认服务 **全球站**；国家站用 `siteMode`、locale 前缀、`market`、配置层 **显式分支**。
**身份与运营（锁死）**：CN **充值类**（算力包 / Pro 月付）`POST /api/payment/create-order` **必须登录**（`401 login_required`）；订单只绑 **`user_id`**，不接匿名充值。**全站收入/联盟**页 `/dashboard/revenue`、`/zh/dashboard/revenue` 及 `/api/revenue/*` 管理向接口仅允许 **`OPERATOR_USER_IDS` 与/或 `OPERATOR_EMAILS`**（`src/lib/auth/operator.ts`）；**未配置则任何环境均不可进**（工作台不显示「收入」）。本地联调可设 **`OPERATOR_DEV_ALLOW_ALL=true`**（仅非 production）临时放开。工作台「收入」入口仅对运营者展示。
---
## 二点五、Content Safety Engine（全平台合规系统 · 已锁定 · 核心能力）
**定位（写死）**
- ❗ 这不是「附属安全小功能」，而是 **转化增强 + 信任背书 + 差异化护城河** 的 **系统级能力**。
- ✅ **所有** 面向用户的 **AI 生成内容**（含未来新工具、新国家站、新平台栈）**必须** 经过 Content Safety Engine；**英文主站、中国站、未来所有国家站** 一律执行，**不得遗漏**。
- ✅ **英文主站** 是 **全球信任与品牌叙事的第一触点**：Content Safety **必须**在英文路径上做到 **标杆级**（提示、过滤、用户可见说明），**不得**弱于或晚于国家站迭代。
- ❌ **禁止** 向用户 **承诺 100% 合规** 或替代平台/法务审核。
- ✅ **目标**：**显著降低** 违规与误导风险；语气与承诺可控；提升用户 **信任 → 转化**。
- ✅ **与模型提供商解耦（写死）**：无论输出来自 **OpenAI（英文主站常用）、DeepSeek（CN 链）、或未来任意新模型**，Content Safety **一律在服务端**对 **即将返回给用户的内容** 执行；**禁止**把合规只绑在「某一家的内置审核」上而跳过本站 CSE。新增 provider 只改 **`router` / provider 层**，**不改变**「先模型、后 CSE」的顺序。
**强制执行结构（三层）**
1. **Prompt 层（生成前）** — 在系统/用户提示中约束：规避高风险表达、控制绝对化承诺与导流话术；实现参考：`src/lib/ai/prompts/shared/content-safety-prompt.ts`、`composePostPackagePrompts` 等；**新 AI 任务须默认接入同类策略**。
2. **输出层（生成后）** — 敏感词/风险句式 **检测 + 软替换 + 文本归一**；**不** 以「整包拦截空结果」为主手段（避免用户体验断崖）；实现参考：`src/lib/content-safety/filter.ts`。
3. **平台层（差异化）** — **抖音 / 小红书 / TikTok / YouTube** 等平台 **独立规则配置**，按 `market`（如 CN vs global）与后续国家站扩展 **合并/切换**；实现参考：`src/lib/content-safety/platform-rules.ts`、`rulesForMarket()`。
**接入约定**
- **Post-package**：`POST /api/generate-package` 返回前 **必须** `applyContentSafetyToPackages`；telemetry 带 `content_safety_*`。
- **Legacy 纯文本生成**：`POST /api/generate` 返回前 **必须** `applyContentSafetyToStringArray`（或逐条 `applyContentSafetyToPlainText`）；请求体可带 `market`（可选）与 `locale`，与 package 路由一致地用 **`resolveSafetyMarket`** 选 **cn / global** 规则集；**system** 消息须含 **`sharedContentSafetyPrompt()`**。日志：`[cse_plain]` JSON（含 `content_safety_filtered_count`、`content_safety_risk_detected`、`profile`）。
- **文案润色**：`POST /api/improve` 返回前 **必须** `applyContentSafetyToPlainText`；同样 **system** + `sharedContentSafetyPrompt()` + `resolveSafetyMarket`；日志同上。
- **市场解析唯一入口**：`src/lib/content-safety/resolve-market.ts` 的 **`resolveSafetyMarket`** — `generate-package` / `generate` / `improve` **禁止**各写一套 cookie/locale 判断。
- **后续扩展**：任何新的 **面向用户的 AI API**（含内部工具若对用户展示结果），须复用 **同一套 prompt 约束 + `filter.ts` 输出层 + `platform-rules`**；并在 Implementation Summary 中标注接入点。
**产品层（信任与转化）**
- **英文主站（全球默认、品牌与信任第一触点）**：Content Safety 的 **提示词约束、输出过滤、结果区 🛡️ 信任文案** 必须与中文站 **同等落实**，且 **验收标准不得低于中文站**；**禁止**「英文随便写写、只在中文站精修」的次等体验。
- 有生成结果时，须在结果区展示 **🛡️ 信任文案**（中文核心句：**「已自动优化为更符合平台规范的表达方式」**；英文须为 **主站级** 专业表述，明确平台语境 + assistive / non-legal 边界，与中文信息对等）。
- 该文案服务于 **信任感 + 付费/留存转化**，与「一点五」创作者语境 **并列**，不互相替代。
**实现索引（V104 / V104.1）**
- **V104.1（pSEO 文案层，≠ CSE）**：程序化 SEO 页（`/pseo/*`、`/zh/pseo/*`）须 **专家 / 中性 / 建议型** 语气；禁标题党与绝对化承诺；中文合规缓冲 **「建议根据平台规则调整」「不同账号情况可能不同」**；`seo_keywords.quality_score` 由 **`combinedProgrammaticQualityScore`**（启发式 + 合成内容质量）写入；高风险 topic 仅 **`inferHighRiskPseoTopic`** 内部标记（`GET /api/seo/quality-check` 聚合），**不在 pSEO 页加 🛡️ 信任条或营销轰炸**。实现：`src/lib/seo/pseo-content-safety.ts`、`ProgrammaticPageTemplate`、`pseo-metadata.ts`。
- `src/lib/content-safety/platform-rules.ts` — 平台规则表与 `rulesForMarket`
- `src/lib/content-safety/resolve-market.ts` — `resolveSafetyMarket`（cookie + `locale` + `body.market`）
- `src/lib/content-safety/filter.ts` — `applyContentSafetyToPackages`、`applyContentSafetyToPlainText`、`applyContentSafetyToStringArray` 及检测/替换/归一（**与 provider 无关**）
- `src/lib/ai/prompts/shared/content-safety-prompt.ts` — 模型侧安全约束（**任意**走 chat 补全的路由均可挂 system）
- `src/app/api/generate-package/route.ts`、`src/app/api/generate/route.ts`、`src/app/api/improve/route.ts` — 已接 CSE
- `src/components/tools/PostPackageResults.tsx` — 用户可见 🛡️ 信任信号（package 流）
---
## 二点六、商业防护系统（成本保护 + 风控 + 限流 · 🔒 永久）
**定位（写死）**
- ❗ 保护系统是商业基础设施，和收款/生成能力同级；任何上线方案不得绕过。
- ✅ 新能力默认必须覆盖：**成本保护**、**风控系统**、**限流系统**、**行为检测**、**动态策略**。
- ✅ 目标写死：**攻击无收益、滥用成本高于收益、正常用户体验不受影响**。
**必须覆盖（硬约束）**
1. **成本保护（不亏钱）**：所有高成本路径（生成、批量、回调、充值）须有预算与消耗保护闸门。
2. **风控系统（防滥用）**：账号、会话、设备、来源网络、调用模式需可识别与拦截。
3. **限流系统（防爆）**：按全局/路由/用户/IP 多层限流，防突发压垮服务或烧穿成本。
4. **行为检测（识别异常）**：识别刷量、脚本化、重复攻击、异常峰值与可疑路径。
5. **动态策略（实时调整）**：策略支持按环境、市场、活动时段快速调节，不依赖发版。
**必须具备（控制面）**
- **全局控制能力（Kill Switch）**：关键链路一键降级/一键关停/一键切备用策略。
- **用户级控制**：支持 `credits`、`limits`、配额、临时降权与恢复。
- **IP 级控制**：支持封禁、灰名单、限速、挑战策略。
- **行为级控制**：维护 `risk_score` 并参与放行/限速/拦截决策。
**必须做到（验收）**
- 对攻击者：路径可走但**无正向收益**，且持续攻击成本显著上升。
- 对滥用者：收益-成本比被反转（成本 > 收益），形成天然劝退。
- 对正常用户：默认体验稳定、延迟可控、误伤率可观测并持续下降。
**持续进化（工程要求）**
- **全量可观测**：所有异常、拦截、放行、降级都必须进 telemetry（含原因码）。
- **全量可调**：阈值、规则、权重、名单必须配置化（config 化），禁止硬编码散落。
- **可扩展**：设计目标支持未来百万级用户规模，控制面与数据面可横向扩展。
---
## 三、IP → 国家站 → 全站该国体验
- **目标**：按 **IP / 市场** 识别国家，默认进入 **该国向体验**：语言 + 文案 + 示例 + CTA + 本土支付/打赏等（例：中国 → 中文站）；他国同理 **表驱动 / 可配置**，勿只写死 CN。
- **实现**：与 **`te_preferred_*` cookie、`COOKIE_PREFERRED_MARKET` / `COOKIE_PREFERRED_LOCALE`、`middleware`** 同一套延伸。
- **必须**：保留用户 **手动切换国家/语言**；**勿**用浏览器自动翻译代替产品级本地化。
**Middleware / cookie 要点**：
- **根路径 `/`（GET）**：按 **IP（cf-ipcountry / x-vercel-ip-country）+ Accept-Language** 与 **`geo_debug`** 决定默认落地 **全球英文 `/`** 或 **中文站 `/zh`**（含 CN 及华语区 TW/HK/MO）；**无** `te_preferred_locale` 时 **302 重定向**到对应首页；**已有**偏好 cookie 时 **尊重**（如用户选 EN 则不再因 IP 进 `/zh`）。其他国家暂无独立首页时 **落在 `/`**（全球英文）；日后有 `/{locale}` 国家首页时在 `src/config/geo-redirect.ts` 扩展映射。
- **仅首次访问**无市场 cookie 时在 `/` 上写入偏好 cookie；之后 **尊重 cookie**，勿反复覆盖。
- 深链 `/zh/...` 且无 locale cookie 时，可在响应中写入 zh + cn 偏好。
- **Geo 调试**（非生产或 `ENABLE_GEO_DEBUG=1`）：`?geo_debug=cn` / `?geo_debug=global` + cookie `te_geo_debug`（见 `src/config/geo-debug.ts`）。
---
## 四、国家站模板（路由 · 文案 · CTA · 支付 · SEO）
**路由**
- 本地化营销与核心工具在 `/{locale}`（如 `/zh`、`/zh/pricing`）。
- 高意向工具用 **短路径**（如 `/zh/tiktok-caption-generator`），旧 `/zh/tools/...` 可用 **`permanentRedirect`** 到短路径。
- 每市场至少：首页、定价、2～3 个旗舰工具、一个增长指南/工作流页。
- 全球英文 URL 保持原路径；hreflang 与本地化 URL **显式映射**（参考实现：`src/lib/zh-site/paths.ts` 的 `ZH_TO_EN_CANONICAL` 等）。
**文案**
- **禁止**把英文营销字面直译；用该国创作者语境（中国：短视频、自媒体、涨粉、效率、变现）。
- **中国站额外锁死**：须符合 **「一点五」** — 按 **抖音 → 小红书 → 快手** 顺序做**平台级**内容，禁止 TikTok 直译作主路径；每平台栈需 **工具 + 示例 + 教程 + 场景**。
- 工具页用 `PostPackageToolClient` 等传本地文案；中国工具设 `siteMode="china"`，API 传 `locale` + `market: cn`，升级入口优先 `/zh/pricing`（如 `ZhPricingLink`），国内打赏更醒目（`DonationBox` `variant="zh"`、`prominent`）。
**CTA**
- 站内升级发现：先 **`/{locale}/pricing`**，再链到全球结账。
- 头尾导航与同 locale 工具/pricing/增长页互链，减少跳出到 EN。
- 语言/国家切换：**仅**客户端 `select` 导航 + cookie（`MarketSelector`），**不**改写各 URL 的 `metadata` / `canonical` / `robots` / sitemap——**爬虫与搜索引擎收录逻辑与改 UI 无关**，不得因「换地区」组件去动 `noindex`、结构化数据或 hreflang 的既有策略。
- `enPathToZh` / `zhPathToEn` 等价页映射；点「中文」时**禁止**把 EN 的 `/tiktok`、`/tiktok-tools`、`/tiktok-growth-kit` 等镜像到 `/zh/tiktok` 等 **程序化 SEO 聚合页**，应进 `/zh`（见 `paths.ts` 中 `EN_PATH_LOCALE_SWITCH_TO_ZH_HOME`）。
- **英文主站顶栏**：`MarketSelector` 使用 `presentation="dropdown"`，默认选项为 **English (Global)**，旁侧文案 **「选择国家」**；可选 **简体中文（中国）**、**Español**（进 `/es/how-to`）。中文站顶栏仍用分段按钮（`presentation` 默认）。
**支付与国内支持**
- Pro 可走国际收款；定价页诚实说明。
- 国内微信/支付宝 QR：`NEXT_PUBLIC_DONATE_WECHAT_QR`、`NEXT_PUBLIC_DONATE_ALIPAY_QR`。
**SEO 与站点地图**
- 各本地化页：`metadata.alternates.canonical` 为该页完整 URL；`alternates.languages` 含 `en` 与对应 `zh-CN` 等。
- `/` 与 `/zh` **各自 canonical**，勿混同。
- 高价值本地化 URL 写入主站 sitemap 与分市场 sitemap API（如 `api/sitemap-zh`）。
- **每日 SEO 发布节奏（反异常门禁）**：全站 SEO 内容（英文 `content/blog/*.mdx` 与中文程序化内容）必须按日持续发布；每日发布量以“通过质量/去重/反异常门禁的数量”为上限，并且必须分时段错峰，避免同一批次爆量。禁发：占位文本、重复/近似重复模板、低信息密度门页；标题、摘要、正文结构（含 FAQ 与示例）必须有实质差异。发布前必须经过内部质量门禁（AI 输出走安全层；文本走 `npm run audit:text`；必要时做重复/相似度抽检；内容必须可验证、基于真实可操作经验，不编造数据/结果/“保证”）。关于“完全保证不被搜索引擎/AI 检测为异常”的承诺禁止写入流程，但目标是将发布行为保持在搜索引擎可理解、非垃圾信号的常规范围内。
  - **更快被爬取的优先级**：发布后必须触发 sitemap 的自动更新与索引覆盖，并将“可被发现/可被抓取”作为发布交付标准（`robots.txt` 不误伤、URL 无人为 `noindex`、HTTP 可访问、internal links 指向新内容）。如适用，按既有站长平台流程做 sitemap 提交/通知与抓取诊断（GSC / Baidu Webmaster Tools / 允许的 API/ping），以缩短收录爬取时间。
  - **用尽对搜索有帮助的方法**：只采用不污染用户体验、且与站点发现机制一致的做法（metadata/structured data、sitemap、内链、抓取诊断修错），不新增“展示 XML sitemap/引导用户提交 XML”的用户可见入口。
  - **目标与门禁（价值必须真实）**：内容必须“对搜索真正有帮助”，并满足质量门禁：必须有价值、可操作、可验证，不编造数据/结果/结论；对程序化/批量内容必须强制去重与实质差异（标题/摘要/结构/示例/FAQ 等至少一部分维度必须独立且符合同一主题的真实意图），不得只做关键词替换。
  - **发布账本全自动**：每日自动记录“当日新发布/新增可见内容数量 + 具体内容清单（slug/topic）+ 发布后全站/模块总数快照”，输出到本地 `logs/seo-ledger*`，并作为后续查验/修正的单一入口，避免每天都重复手工统计。
**Sitemap（XML）全局规则（全站开发必须遵守）**
面向 **搜索引擎的 XML sitemap**（`/sitemap.xml`、各分片 `*.xml`、rewrite 到 `api/sitemap-*` 等），以后所有开发必须符合：
- ❌ **永远不允许**
  - **做 sitemap 页面入口**：禁止新增「站点地图」类页面用于展示、分发或引导用户访问 **XML** sitemap；禁止在 Header / Footer / 设置 / 任何用户可见区域增加指向 `sitemap.xml` 或各 XML 分片的链接或按钮。
  - **在 UI 显示 sitemap**：禁止在界面文案或组件中展示 XML sitemap URL、原始 XML、或「提交站点地图」类用户向说明（内部运维/文档除外）。
  - **手动维护 sitemap**：禁止靠人工编辑列表、静态文件或一次性脚本充当「主路径」；URL 须由数据/配置/生成管线 **自动** 产出。
  - **改动现有 sitemap 结构**（路由、分片命名、rewrite、与 `api/sitemap-*` 的契约）：**除非**有**明确升级方案**（含迁移说明、对收录与 GSC 的影响评估），否则禁止为「顺手」而改。
- ✅ **必须保证**
  - **sitemap 自动生成**：新增可索引 URL 时，走既有生成逻辑（数据驱动、`sitemap-data` / 程序化 SEO 管线、`api/sitemap-*` 等），不另起一套手抄清单。
  - **sitemap index 统一入口**：主入口保持 **单一、稳定**（如 `/sitemap.xml` 作为索引；完整子索引仍由既有 `api/sitemap-index` 等承担时不得无故删改契约）；新增能力时优先 **挂入既有索引/管线**，不另造多套「主入口」。
  - **对搜索引擎完全可访问**：`robots.txt` / HTTP 可正常抓取；`Content-Type`、缓存头符合惯例；不因鉴权、Cookie、地域墙挡住爬虫对 **公开 XML** 的 GET。
  - **对用户完全隐藏**：用户路径与导航中 **不出现** XML sitemap；爬虫与用户使用两套发现机制，不混用。
**说明（避免与 HTML 站内导航混淆）**：若仓库内已有 **HTML 内容导航页**（如 `/zh/sitemap` 中文指南索引），其性质是 **站内内容目录**，**不是** XML sitemap 分发页；**不得**在该类页或全局导航中新增指向 **`/sitemap.xml` 或 XML 分片** 的入口；亦不得新建「整站 XML URL 列表」类用户页。
**新国家站上线路径（检查清单）**
1. `/{cc}` 首页 + 本地头尾（可参考 `ZhSiteHeader` / `ZhSiteFooter`）。
2. `paths.ts` + `seo.ts` 类助手与 hreflang 映射。
3. 定价 + 2～3 工具 + `siteMode` 或等价分支。
4. 语言/市场切换与路径映射。
5. Middleware 仅在需要时扩展首访逻辑，且尊重用户已选 cookie。
6. Sitemap 与环境变量（打赏图等）。
---
## 五、区域 AI 路由（V98，与全球主链一致）
**原则**
- **全球 / OpenAI 主栈**；**CN** = 提示层 + provider **尝试链** 的扩展，**不是**独立应用。
- **post-package** 主路径：`POST /api/generate-package` → **`routerGeneratePostPackage`**（`src/lib/ai/router.ts`）。
- 业务只依赖 **`src/lib/ai/providers/types.ts`** 的接口，不绑死某家 SDK。
**流程摘要**
1. 解析 **`market`**：`body.market` → cookie `te_preferred_market` → `locale === "zh"` → 默认 `global`。
2. **Provider 链**：Global → 仅 OpenAI。CN 且 `ENABLE_CN_PROVIDER` → DeepSeek → OpenAI 回退（`CN_PROVIDER=deepseek`）。Qwen 名目前仍回全球链直至接好。
3. **提示分层**：`composePostPackagePrompts` — shared 策略师 + **Content Safety（prompt 层）** + locale + market（global/cn）+ platform（toolKind）+ 任务正文（`src/lib/ai/prompts/`）。
4. **Post-package 响应**：服务端在返回 JSON 前 **必须** 走 **Content Safety 输出层**（见 **「二点五」**）。
5. 响应带 **`generationMeta`**：`provider_used`、`model_used`、`fallback_used`、`latency_ms`；**V99** 另含 `outcome`、`error_class`（可选）、`route`（可选）。`outcome`：`model_primary` / `model_after_provider_fallback` / `heuristic_after_empty_parse` / `heuristic_after_router_failure`。
6. **Telemetry**：`[ai_telemetry]` + JSON 单行日志；**V99** 增加 `route`、`outcome`、`error_class`、`user_fulfilled`、`model_latency_ms`；**V104** 增加 `content_safety_filtered_count`、`content_safety_risk_detected`、`content_safety_profile`。中文路由另有 **`[cn_page_perf]`**（见 `docs/COUNTRY-DELIVERY-STANDARDS.md`）。
**环境变量（节选）**
- `OPENAI_API_KEY`（必须）、`OPENAI_BASE_URL`、`OPENAI_MODEL`
- `ENABLE_CN_PROVIDER`、`CN_PROVIDER`、`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`
- 详见 **`.env.example`** V98 段
**客户端**：中国站工具 `generatePostPackages(..., { locale, market: 'cn', clientRoute })`；可读取返回的 `generationMeta`。国家站交付标准见 **`docs/COUNTRY-DELIVERY-STANDARDS.md`**（缓存键、降级、遥测、首屏优先级）。
---
## 六、工程执行约定（Cursor / 协作）
- **角色**：执行实现；重大产品/架构/SEO 商业决策标注 **「需由负责人决策」** 并给 Spec 要点。
- **版本流**：Version Spec → 实现 → Implementation Summary → 审查。
- **执行严谨**：必须严谨执行完每一条指令，确认无误后再做出准确总结与报告；禁止仅做口头“完成”总结而不落地实现/验证。
- **DB**：仅 migration；**API**：try/catch、明确错误、可观测；**推送前**：lint + build；交付写验收点 + 可选 **「## Cursor 执行反馈」**。
- **自动化优先**；缺密钥或须本人账号时列 **「需您手动操作：」**。
### 六点一、修改边界原则（避免误伤已完成结构）
当页面**总体布局、壳层、导航主框架**已稳定时，后续版本应 **优先**：
1. **修复公开缺陷**（bug、错链、明显体验断裂）
2. **强化主路径**（核心工具与关键转化步骤）
3. **提升移动端体验**（见 **「零点六」**）
4. **完善转化闭环**（付费、留存、下一步动线等）
**禁止**在无明确业务理由（负责人拍板或 MEMORY 修订）时 **反复重做**：
- 全站 `layout` 级结构
- 全局 `header` / `footer` 主骨架
- 已稳定的信息架构主框架
- **国家站主副关系**（英文主站 vs 本土站，见 **「一」**）
**永久冻结（写死）**
- 以后所有“布局大框架”（`layout`、全局 `header/footer`、主导航 IA、页面壳层/路由壳）默认视为**永久锁死**。
- 任何涉及这些布局大框架的改动，必须在动代码前先向你提交：改动范围说明 + 影响面清单 + 迁移/回滚预案，并由你明确决定后方可执行。
增量改进应在既有壳层与 IA 内完成；若确需大改，须先 **Spec + 影响面说明**，避免为「换皮」或偏好而拆稳定结构。
### 六点二、工具质量与生成一致性（🔒 永久）
**总原则（写死）**：
- **每一个工具必须做好，做到几乎完美；做不好就不上线。**
- 工具价值优先于工具数量；**禁止**用页面数量或模板复用冒充可用能力。
**工具定义一致性（必须）**：
- 每个工具的输出必须与其 **标题 / 描述 / 介绍 / 场景承诺**一致。
- 若输出与工具说明不一致（例如标题写「脚本」，结果只给泛句），视为不合格实现。
**随机生成类工具（必须）**：
- **禁止固定内容**：同输入多次调用不能长期返回同一批文本（无变化即判失败）。
- **禁止乱随机**：随机只用于「表达变体/结构变体」，不能偏离工具说明与任务目标。
- **输入强相关**：用户输入必须显式影响结果内容；不得只做关键词替换或无关泛文案。
- 评估维度至少包含：**多样性**、**输入相关性**、**可执行性**（用户拿到可直接用的结果）。
**AI 输出合规（必须）**：
- 所有接入 AI 的用户可见输出，必须按该工具所指向平台规则执行合规处理（如抖音/TikTok/YouTube 等）。
- 必须经过统一的 Content Safety 流程（生成前约束 + 生成后过滤/改写），规避潜在违规词句与高风险表达。
- **禁止**新增绕过安全层的输出路径；若无法满足平台合规要求，该工具不得上线。
**上线门禁（必须）**：
- 工具需通过自动化质量审计后方可合并/上线（随机性、输入相关性、说明一致性、合规风险扫描）。
- 不满足门禁即拦截：**宁缺毋滥，不降标准上线**。
### 六点二·一、Knowledge Engine（知识引擎 · 🔒 · Cursor 执行）
**定位**：用户向生成链路须以 **知识引擎** 为默认架构，**禁止** 将「仅拼 system/user prompt 直接调模型」作为新工具的默认或唯一路径。
**强制流程（缺一不可）**  
每条面向用户的 **生成请求** 在工程上须显式包含以下阶段（可合并实现，但须可观测、可排障）：
1. **intent** — 解析用户意图、任务类型、平台/场景约束（与工具契约一致）。
2. **retrieval** — 从 **本地知识资产**（如 `generated/workflow-assets-retrieval.json`、高质量指纹与索引、工具侧结构化资产等）检索相关片段；**优先** 用已有资产，**禁止** 默认跳过检索直接全文生成。
3. **recipe** — 将检索结果与任务合成为 **可执行的生成配方**（段落结构、约束、引用锚点、输出 schema）；再进入模型调用。
4. **generation** — 在 recipe 与 Content Safety 约束下调用模型；**telemetry** 须能区分是否走了检索与配方（与既有 `generationMeta` / V172 检索注入等模式对齐）。
**资产优先**  
- **优先** 使用 **本地知识资产 + 检索-改写**；**禁止** 把「无检索、纯模型即兴」作为新工具的默认主路径（在已有可索引、可复用资产的前提下）。
**未完成定义（上线禁止）**  
- **未** 按上述链路接入 Knowledge Engine（或等价可审计实现）的 **新工具**，视为 **未完成**，**不允许上线**。
- 存量工具按阶段迁移；**新增** 与 **大改版** 须默认符合本条。
**实现索引（以代码为准）**：`POST /api/generate-package` 与检索块注入、`composePostPackagePrompts` 的 `retrievalReferenceBlock`、`src/lib/ai/router.ts` 的 `retrieval_used` / V172 元数据；管线资产见检索飞轮与 `generated/*` 相关产出。
### 六点三、背景日更管线 + 上传指令（解耦 · 🔒）
**Tool Eagle Background Pipeline + Upload — 永久执行约定**（用户简称 **「上传」** 的 **默认语义已变更**，见下 **〇**；**不等用户再补充一句才继续** 仍适用 **轻量步骤**。）
#### 〇、背景管线架构（Background Pipeline Architecture · CRITICAL）
**关键变更**：**日更 SEO 发布管线不得在「上传」时同步跑完并长时间阻塞。**
1. **后台执行模型**  
   - 日更管线 **必须** 作为 **后台系统** 运行：**由 cron / 调度器触发**，可 **持续或分批次** 执行，**不绑定** 用户「上传」指令。
2. **上传与管线解耦**  
   - 「上传」**必须**：**校验代码**；将 **已落盘** 的生成内容 / artifact **纳入版本**；**push GitHub**。  
   - 「上传」**禁止**（默认）：**启动完整日更管线**、**长时间等待** 运行中的生成任务。
3. **管线执行模式**  
   - **A. 后台模式（默认）**：每日自动跑；可跨时段延续；**EN 与 ZH 分轨**、分别推进。  
   - **B. 手动触发（可选）**：可显式触发，但仍宜 **异步 / 后台** 执行，**不阻塞** 默认「上传」流程。
4. **渐进式生成**  
   - 宜 **分批处理**（例如每批约 **5～20** 条，具体以脚本与风控为准）；**可分段提交进度**；**不以「整管必须一次跑完」** 阻塞上传或协作。
5. **状态追踪**  
   - 系统须能体现或导出：**当前进度（EN/ZH）**、当日目标态（**completed / running / partial**）、**上次成功跑完时间**（实现载体：`generated/*`、专用 state JSON、日志等，**以代码为准**）。
6. **上传行为（相对管线）**  
   - **读取** 当前已生成的产出；**就绪则纳入提交**；**禁止** 为等内容 **等待未完成管线**（默认）。
7. **保证每日有运行**  
   - **调度器** 须保证管线 **每日会跑**（即使用户未操作）。
**目标**：SEO 内容在 **后台持续产出**；「上传」退化为 **轻量 git 同步**。「**当日日更是否算跑完**」见 **六点五**，**不** 绑定在同一次「上传」命令内完成。
#### 手动上传 · 全自动生产（系统标准 · MEMORY 保护 · 🔒）
**Tool Eagle Manual Upload + Full Auto Production — 永久标准**（与上条 **〇**、**B**、**E** 一致；强调 **用户记忆负担为零** 的 **设计意图**。）
1. **用户唯一常态手动作**  
   - 用户 **只** 在 **愿意把本地/工作区同步到 GitHub** 时，发出 **「上传」** 类指令（校验 → 纳入已落盘产物 → `push`）。  
   - **不要求** 用户 **每天记得** 去点 EN、ZH、SEO、管线、检索、队列等；**不得** 把「会不会用产品」建立在「用户记得跑 cron」上 —— **执行责任在系统侧调度**。
2. **全自动职责（须由调度执行，不依赖上传）**  
   下列 **默认** 均属 **后台/计划任务/常驻进程**（本机或 CI/远端，以负责人部署为准），**与「上传」解耦**：  
   - **EN** 日更向内容生成（如 blog 批、`en:auto`、与 EN SEO 相关的脚本链）；  
   - **ZH** 日更向内容生成（关键词页、自动扩词、质量门）；  
   - **SEO / 程序化页** 生成与 **分发**（如 `auto-distribute`）；  
   - **AI-search 向** 可索引、可引用内容（由现有 SEO/博客/指南管线覆盖的部分 **随上述管线每日推进**，不单独依赖用户上传触发）；  
   - **retrieval / rewrite**、**topic expansion**、**队列构建**（如 publish queue、indexing queue、allocation 等 **以 `package.json` + `generated/*` 为准**）；  
   - **activation / materialization**（若仓库内存在对应阶段，归 **同一调度体系**，不默认由上传拉起）；  
   - **retries、recovery、缩批与安全降级**（脚本与 state/日志体现，如 **`generated/seo-pipeline-state.json`**、质量门、六点四/六点五）；  
   - **日更状态摘要**（ledger、state、日志 —— 可扫读，**与 push 分开报**）。
3. **上传不是生产总开关**  
   - **禁止** 把默认「上传」定义为 **启动整条生产链路** 的入口；上传 **只** 同步 **已写入工作区** 的产出。  
   - 即使用户 **长期仅偶尔 upload**，**只要调度在跑**，生产侧仍应 **按日持续推进**（见上 **〇·7**）。
4. **工程前提（诚实边界）**  
   - 「全自动」以 **已配置** 的 **cron / 计划任务 / `npm run seo:background:watch` / CI** 等为 **前提**；**未部署调度则不会魔法式每日运行**。助手在排障与 onboarding 中应 **主动提醒** 配置调度，**不得** 假设用户仅靠上传即可替代日更。
5. **实现索引（以磁盘为准）**  
   - 日更入口：**`npm run daily-pipeline`**（默认 **V153 分批后台**；**`--sync`** 为 legacy 全长 **`zh:auto`**，见 **`scripts/run-daily-pipeline.js`**）；**`npm run seo:background`** / **`seo:background:watch`**；**`scripts/run-background-seo-engine.ts`**。  
   - 具体命令与产物 **以 `package.json`、`scripts/`、`generated/*` 为真相**；本款 **只定责**，不替代代码变更记录。
#### 触发词（等价）
**上传**、`upload`、**提交到 GitHub**、`push`、**提交代码**、推到 GitHub、提交并推送 等 —— **默认** 视为：**校验 → 纳入已生成物 → GitHub**（**不** 含「同步启动并等待完整 `daily-pipeline`」）。
**显式例外（须用户明文写出）**：若用户写明 **「上传前跑完 EN+ZH 管线并等待结束」** 等，可按 **单次显式指令** 执行长任务，**不** 与默认「上传」语义自动合并。
#### A. 版本与代码就绪
- 用 `git status` / `git diff --stat` 看清变更面，判断是否在 **本次版本/本次上传周期** 意图内。
- **校验**：至少 `npx tsc --noEmit`；涉及测试的逻辑则加跑相关 `npm test`（或仓库约定脚本）；有前端构建门禁时跑 `npm run build`（若耗时合理）。
- **修复**：仅修复 **由本次变更直接引起** 的明显编译/类型/lint/构建问题；不借机大改无关模块。
- **生成物与合约**：凡已落盘、且属本次应上线的 **`generated/*`、合约 JSON、脚本产出物** 等，**上传时应纳入提交**（与 `scripts/`、`src/lib/agent/workflows.contract.json` 等保持一致），避免「代码已改、artifact 未更新」。
#### B. 日更发布职责归属（非「上传」默认职责）
- **日更发布** 是 **常驻后台职责**，由 **调度 + 管线脚本** 承担（**EN + ZH** 每日推进；体量、安全、治理见 **六点四、六点五、「四」**）。
- **默认「上传」不代替调度**：**不得** 把「每次上传 = 必须当场跑完 `daily-pipeline`」作为默认行为；管线应在 **计划任务 / CI / 后台进程** 中运行（以负责人部署为准）。
- **体量 / 安全 / AI 搜索向质量**：仍由管线与治理规则约束；上传只 **打包当前磁盘上** 已符合提交范围的产物。
- **一侧长期阻塞**：若 EN 或 ZH 一侧故障，须在 **调度侧报告** 中 **标明阻塞侧与原因**；**另一侧继续**。**上传** 仍可推送已就绪侧产物。
**具体管线命令** 见 **`package.json`**；助手维护/排障时应 **主动查阅** `daily-pipeline`、`zh:auto`、`en:auto` 等，但 **默认上传路径不等待其全长结束**。
#### （上传与长任务）Tool Eagle Upload vs Long-Running Jobs · 🔒
1. **默认**：**禁止** 在「上传」流程内 **同步启动并阻塞等待** 完整日更管线（如 `npm run daily-pipeline` 直至自然结束）。  
2. **允许**：管线 **并行在后台** 运行；上传 **仅提交已写入工作区** 的文件（含管线跑到一半已落盘的增量，**若** 符合提交范围与质量预期）。  
3. **禁止** 为「等管线」而 **长时间卡住** `commit`/`push`（与旧「上传阻塞至管线结束」规则 **相反**，以本条为准）。  
4. 管线 **中断 / 失败 / 部分完成** 的判定与报告 → **六点五** + 调度日志；**不得** 与「本次 push 是否成功」混为一谈。
> **与六点四**：治理与质量仍优先；**渐进式提交** 不得用于灌发低质或重复内容。
#### C. GitHub 上传准备（提交范围）
- **前置条件**：**无**「必须等管线结束才能 add」的默认门槛；仅需 **常规** 前提（工作区可写、无破坏性的半成品覆盖等，由助手判断）。**进行中的后台任务** **不** 自动阻止 push，除非会导致 **明显损坏提交**（如同一文件并发写坏 —— 应优先修复调度/锁，而非硬性禁止上传）。  
- **干净边界**：提交范围 = **本次版本相关改动** + **已生成且应上线的** 内容与 artifact；**排除** 误改、私货、本机缓存、密钥。**不得** 提交 `.env`；遵守 **`.gitignore`**。  
- **不要** 故意丢掉 **已就绪、应随本次上线** 的文章与 `generated` 产物。  
- **流程**：`git add` → `git commit -m "…"` → `git push origin`（当前分支，一般为 `main`）。
#### D. 上传完成后的反馈（短、可扫读）
须区分两类信息：
- **上传 / Git**：校验结果（tsc / test / build）；**提交与 push** 是否成功；本次 **纳入** 的主要路径（代码 / 内容 / `generated` 摘要）。  
- **日更管线状态**（若可知）：**EN/ZH** 侧调度态（running / partial / completed）、**可读自** 日志或 state 文件的一行摘要；**不得** 用「push 成功」冒充「当日日更周期已在调度意义上完成」（后者见 **六点五**）。
#### E. 成功判定（修订 · Tool Eagle Upload & Daily Cycle Criteria · 🔒）
**A. Git 上传任务**（默认「上传」所指）  
下列成立可称 **「上传（同步）成功」**：
1. **代码校验** 已按 **A** 执行并通过（或已说明豁免范围）。  
2. **提交范围** 符合 **C**，且 **已 push**（或已说明需用户手动 `push`）。  
3. **未** 将「仅 docs/规则」在用户期望含内容上线时 **谎称** 为全量内容发布。
**B. 当日日更周期完成**（与「上传」**解耦**）  
「**当日 EN/ZH 日更在调度意义上已完成 / 部分 / 失败**」**仅** 能依据 **六点五** + **后台状态/日志** 判定，**不要求** 在同一次「上传」会话内跑完管线。  
助手 **禁止** 把 **B** 与 **A** 混报：例如 push 成功但管线仍在跑 → **上传成功**，日更状态标 **running/partial**。
**若用户显式要求「跑管线并等完再传」**（见 **触发词·例外**）：  
- 该次可 **单独** 报告管线完成度；**仍须** 遵守 **六点四** 质量与 **六点五** 完成定义。
**若发布侧仅部分就绪**：
- 上传可成功，但须在报告中标 **内容纳入 = 部分**（若适用），并指向 **六点五** 的 EN/ZH 状态。
#### 例外
- 推送需 **网络/凭证** 且环境无法代劳时，用中文写 **「需您手动操作」**：本地 `git push` 或配置 SSH/token。  
- 缺密钥、须本人账号的操作，同上，并说明已完成的本地步骤。
### 六点四、内容治理（长期可扩展 · SEO + AI 搜索 · 🔒）
**Tool Eagle Content Governance — 永久规则**。适用于 **一切** 内容生成、SEO 发布、topic 扩张、队列与 Agent 管线。助手须同时知道 **「怎么做」** 与 **「不治理会怎样」**，避免只做 **生产机器** 而忽视 **治理执行**。
#### 风险认知（为何必须治理）
- **关键词会耗尽**、**页面会过度堆积**、**单一 topic/cluster 会被打爆**、**重复会缓慢累积**；**优质内容靠筛选与复用体系**，不能只靠「多写规则」。
- **短期**：量涨、看似健康。**中期**：近似重复增多 → SEO 与 **AI 引用率** 承压。**长期**：整站质量被稀释、排名不稳、难以再扩。
- 目标：助手是 **治理系统执行者**，在 **安全体量** 内扩张，而不是无上限堆页。
#### 1. 总原则
- **不把内容生成当成无限扩张**；在已达 **安全缩放** 后，优先 **质优于量**、**主题结构优于关键词条数**、**资产复用优于纯新生成**。
#### 2. Topic 饱和控制
- 生成或扩张前：**检测** topic/cluster **是否已过度覆盖**；密度高时 → **收缩扩张**、只加 **高表现子话题**。
- **禁止** 单一 topic 集群在系统内 **长期主导**。
#### 3. 去重控制
- 主动防范：**近似重复页**、**轻改写**、**结构相同仅微调** 的页面。
- **优先** retrieval + rewrite，而非新生成；若已有 **相似高质量资产** → **避免** 再生成；队列/候选应对 **重复倾向** 降权。
#### 4. 高质量筛选优先
- 仅当 **`quality_score_v2` 高**、**conversion_score 可接受**、**非重复**、**用户价值明确** 时，才允许 **扩张与优先**。
- 低质内容：**不扩张**、**不优先**、**不作 topic 扩张种子**。
#### 5. Topic 扩张规则
- 仅基于 **高表现** topic；**深度有限**；**跨集群多样化**。
- **禁止** 盲扩；每次扩张须 **新增用户价值**、与既有页 **显著区隔**（与 **「四」** 中反模板、实质差异要求 **互见**）。
#### 6. AI 搜索向优化
- 优先：**可引用**、**可抽取**、**结构化答案**。
- 避免：**填充**、**长而稀**、**重复套路**。
#### 7. 内容资产策略
- 把内容当 **资产** 而非一次性页面：**积累高质量资产**、**检索复用**、**迭代改进**。
- 避免：**一次性生成不复用**、**无法复用的生成**。
#### 8. 体量与安全缩放的关系
- 日更仍遵守 **最大安全体量** 与反异常门禁（与 **六点三 · 背景管线**、调度策略 **BUT**：**不得用体量牺牲质量**）；若质量下滑或重复抬头 → **自动收缩扩张/降优先**（与现有 throttle、downshift **对齐**）。
#### 9. 长期目标
- 建设：**主题权威集群**、**可复用内容资产**、**可被 AI 引用的答案**。
- **不要**：关键词农场、薄内容网。
#### 10. 冲突时的执行优先级（写死）
1. 内容质量  
2. 避免重复  
3. topic 多样性  
4. 缩放体量（**体量永远最后**）
> **与六点三的关系**：动态「最大安全量」仍在，但须在 **不违反本条 1→4 优先级** 的前提下执行；二者冲突时 **以六点四为准**。
### 六点五、日更发布完成判定（Daily Publish Completion · 🔒）
**Tool Eagle Daily Publish Completion — 永久规则**。定义 **「当日发布周期何时算跑完」**，与 **六点三（上传已与管线解耦）**、**六点四（治理）** 配合使用。
#### 1. 禁止固定篇数
- **不要** 用死数字作为完成标准（如「每天必须 10 篇 / 50 页 / 100 条」）。
- **体量必须动态**，由安全上限与候选池共同决定。
#### 2. 最大安全体量
- 每日发布体量 = 在 **不触发搜索引擎异常信号**、**不违反缩放策略与安全护栏** 的前提下，**尽可能高**。
- 须 **沿用现有系统**：scaling mode、volume policy、topic 上限、多样性约束、throttle/downshift 等（如 `asset-seo` 体积策略、队列门禁、脚本内限额 —— 以仓库实现为准）。
#### 3. 完成条件（核心）
**当日发布周期视为「已完成」**，当且仅当 **下列之一** 已达成（在 **质量与治理** 未强制提前停的前提下）：
- **A. 安全体量上限已用尽** —— scaling / 日限额 / cap / 策略触顶（以系统判定为准）。  
- **B. 候选池已耗尽** —— 无更多 **高质量、非重复、且符合发布/合规门禁** 的可发内容。
二者满足 **其一** 即可对本侧标 **完成**；**不得** 为凑数在 A、B 均未满足时假装完成。
#### 4. 最低质量与提前停止
- 若 **质量跌破可接受阈值**、**重复风险升高**、或内容 **未过安全/有用性门禁**：须 **提前停止** 当日发布。
- **禁止** 为增加条数而 **继续灌发**（与 **六点四** 体量优先级一致）。
#### 5. EN 与 ZH 分别判定
- **英文站** 与 **中文站（`/zh`）** 的完成条件须 **分别** 评估；**不得** 因一侧完成即默认另一侧也完成。
#### 6. 部分运行（PARTIAL RUN）
- 若在达成 **3** 中任一条件 **之前** 管线停止（中断、人工停止、异常退出等）：必须标为 **部分运行（PARTIAL RUN）**，**不得** 视为 **完整日更发布成功**。
- 报告须包含 **进展度**（例如相对当日安全容量的 **大致占比**，或脚本输出的计数/上限比）。
#### 7. 短报告（日更结束时）
须简要给出：
- **EN**：`completed` / `partial` + **原因**  
- **ZH**：`completed` / `partial` + **原因**  
- **已用发布量**（相对安全上限的 **比例或说明**，如「约 80% 当日 cap」）  
- **停止原因**：`limit_hit` / `no_candidates` / `quality_stop` / `manual_stop` / 其他（如实填写）
> **与六点三 E 的关系**：**「当日日更周期」完成 / 部分 / 失败** 仅以本条 + **调度/管线状态** 为准；与 **Git 上传是否成功** **分开表述**。**禁止** 在管线仍在 `running` 时，把 **当日日更** 报成 **completed**；亦 **禁止** 用「已 push」代替 **六点五** 的完成判定。
---
## 七、一句话备忘
🌍 全球 + 国家双轨 · 🌐 **当前专注 Web（移动优先）→ 中期 PWA → 成熟原生** · 📱 **Mobile-First** · 🧠 分区 AI · 🛡️ **Content Safety Engine = 系统级护城河（全站 AI 输出必过）** · ⚡ 分区性能 · 💰 分区支付 · 🔍 分区 SEO · ♾️ 可扩展 · 🇨🇳 **中国站 = 平台级创作者系统（抖音→小红书→快手，禁 TikTok 直译、禁多平台并行全量）** · 🧩 **工具质量红线：做不好不上线，宁缺毋滥；工具说明一致、随机不固定、输入强相关、平台合规必过** · 📐 **内容治理：防堆量稀释、质与去重优先于体量（见六点四）** · ⚙️ **全局优先级与 Tool Eagle 核心 OS（见九）** · 🔄 **日更 = 后台/调度；用户常态只手动 upload；上传≠启动生产；余下 EN/ZH/SEO/检索/队列/恢复/摘要全自动（见六点三·手动上传·全自动生产）** · 💸 **AI：检索改写优先、DeepSeek 主用、高价仅 fallback（见九点 9.6）** · **只读本文件**
---
## 八、Cursor 里如何对齐记忆本（省 token 版）
软件层面**没有**「每句自动后台读文件」的接口；做法是 **Cursor 规则 + 助手主动 Read**：
1. **`.cursor/rules/00-memory-read-policy.mdc`**（`alwaysApply: true`）  
   **本会话首次**实质性回复前 **Read `docs/MEMORY.md` 一次**；**不要**每条新消息都 Read（省 token）。改记忆本并保存后，助手在触发「须再读」条件时再 Read，即可对齐最新版。
2. **唯一规则正文**仍只维护 **`docs/MEMORY.md`**（本文件）；`.cursor/rules` 等只写 **Read 流程**，**不**重复粘贴规则全文。
3. **纯寒暄**可完全不 Read。**长对话**可新开 Cursor 会话，或在关键节点再 Read 一次。
4. **老窗口记录 ≠ 记忆本（禁止混类）**  
   - **`MEMORY.md`**：**只放** 长期有效的 **产品/架构/执行规则**；**禁止** 把「某一窗聊到哪、临时进度、一次性纪要」写进本文件。  
   - **换 Cursor 窗口**：**不必** 在仓库里单独维护接力文件。换窗前可在 **旧窗口** 让助手 **输出一段可直接粘贴的短摘要**（目标、进度、未竟事、关键路径）；**新窗口** 第一条消息 **粘贴** 即可。**规则**仍以 **`MEMORY.md`** 为准，摘要只是 **临时上下文**。
---
## 九、Tool Eagle 全局优先级、枯竭处理、自检、增长锁定与核心操作系统（🔒）
> **与「零点五·一」的关系**：本条为 **规格与执行层** 的细化；**产品/架构最终决策**仍以 **`MEMORY` 全文** 与 **负责人对 `MEMORY` 的修订** 为准。若外部规格（含 ChatGPT 输出）与本文件其他条款冲突，**以 `MEMORY` 及负责人变更**为准。
### 9.1 全局优先级（Global Priority Rule · STRICT）
**严格顺序（冲突时自上而下）：**
1. **Quality（质量）** — 最高  
2. **Uniqueness / non-duplication（唯一性 / 不重复）**  
3. **User value / usefulness（用户价值 / 有用性）**  
4. **SEO structure（SEO 结构）**  
5. **Volume（体量）** — 最低  
**规则：**
- **禁止** 以牺牲质量换取体量。  
- **禁止** 仅为凑配额而生成内容。  
- 一旦发生冲突 → **永远削减体量，绝不削减质量**。
（与 **六点四 §10**、**六点五 §4** 一致；本条为全局重申。）
### 9.2 内容枯竭与饱和（Content Exhaustion Rule）
当 **topic / 关键词空间饱和** 时：
1. **禁止** 硬挤生成。  
2. **应改为**：扩展 **主题图谱**（长尾、变体、子意图）；通过 **retrieval + rewrite** 复用高质量资产；优先 **更深内容**（指南、对比、工作流页）。  
3. 若无高质量候选：对该 cluster **停止发布**，并标记为 **「暂时饱和（temporarily saturated）」**。  
4. **禁止** 为维持体量而产出低质或重复内容。
（与 **六点四 §2、§5** 互见。）
### 9.3 日更管线自检（Self-Check Rule）
**每次日更管线运行前**，系统/助手须 **尽量核验**（以仓库 **实际模块、脚本、artifact、路由** 为准，能检则检）：
1. SEO 系统可用（发布/索引/内链等主路径未断）  
2. Volume policy（体量策略）可用  
3. Scaling engine（缩放引擎）可用  
4. Conversion feedback loop（转化反馈环）可用  
5. Data flywheel（数据飞轮：存—用—优化）可用  
6. Monetization system（变现：触发与追踪）可用  
#### 9.3.1 仓库执行对照（助手按表操作 · 以 `package.json` 为准）
以下为 **抽象自检项 → 本仓库可执行入口/产物**；脚本增删时 **以磁盘 `package.json` 与 `scripts/` 为准**，本表仅作索引。
| # | 自检项 | 建议核验（能跑则跑、能看则看） |
|---|--------|--------------------------------|
| 1 | **SEO 系统** | `npm run audit:seo`；必要时 `npm run enforce:seo`（可先 `--dry-run`）。日更主入口：**`npm run daily-pipeline`**（**默认** V153 **分批后台**：`run-background-seo-engine` + `auto-distribute`；**`--en`** 含 EN 批；**`--sync`** = legacy 全长 **`zh:auto`** + distribute + 可选 **`en:auto`**，见 **`scripts/run-daily-pipeline.js`**）。常驻可选 **`npm run seo:background`** / **`seo:background:watch`**。索引队列为 **`npm run en:indexing:queue`**。抽查 **`generated/indexing-queue.json`**、**`generated/topic-registry.json`**、**`generated/quality-gate/*`**、**`generated/seo-pipeline-state.json`** 是否异常空或明显损坏。 |
| 2 | **Volume policy（体量策略）** | 与 **六点四 / 六点五** 对齐的 **limit / cap / 提前停**：各 `generate-*` / `auto-*` 脚本参数及 **`generated/content-allocation-plan.json`**、**`generated/growth-priority.json`**（存在则读摘要字段）。 |
| 3 | **Scaling engine（缩放）** | `node scripts/check-optimization-readiness.js`（无 npm 别名时直接 node）。查看 **`generated/optimization-readiness.json`**、**`generated/optimization-scheduler-status.json`**、**`generated/page-optimization-rollout-status.json`**。页面优化链：`npm run seo:opt:candidates` → `seo:opt:recommendations` →（写入）`seo:opt:apply` → `seo:opt:measure`。 |
| 4 | **Conversion feedback loop** | `npm run search:conversion`。辅助：`npm run search:growth`。若有 **`generated/tool-click-events.jsonl`** 或同类 telemetry 产物，抽查近期是否有写入。 |
| 5 | **Data flywheel** | `npm run search:output-quality`；`npm run search:performance`；`npm run content:allocation`。需要跑内容工厂时用 **`npm run content-factory`**（以脚本说明为准）。 |
| 6 | **Monetization system** | `npm run revenue:summary` / `npm run revenue:expand`。代码与生成物：**`src/lib/seo/asset-seo-monetization-*.ts`**、**`generated/asset-seo-monetization-*.json`**（分支若存在则一并核对是否更新）。 |
**管线结束后（抽查）**：可再跑 **`npm run audit:seo`**；有文案改动时 **`npm run audit:text:changed`**；结合当日 **git diff** 看 `content/blog` 等是否出现异常同质化。
> **与六点三**：`daily-pipeline` 等属 **后台/调度职责**；**默认「上传」** **不** 以「跑完本表第 1 行长命令」为前置条件，但 **排障 / 显式用户指令** 仍可单独执行。
**若任一项缺失或损坏：**
- 降级为 **安全模式（safe mode）**  
- **降低** 当日发布体量  
- **记录** 错误（日志/报告）  
**管线结束后**还须 **抽查/校验**：输出质量、重复是否异常升高、多样性约束是否仍满足。
### 9.4 增长方向锁定（Growth Direction Lock Rule）
**仅允许** 的扩张方向：
1. 更多 **SEO 页**（程序化为主）  
2. **更高** 内容质量  
3. 更深 **工作流**（非堆「更多零散工具」）  
4. 更强 **转化路径**  
5. 更强 **数据飞轮**（可复用资产）
**不允许** 作为主增长手段：
- 随意新增工具、**纯 UI** 功能、低价值生成器、**不可规模化** 的一次性功能。
**每条新功能** 须至少满足其一：**流量** ↑ 或 **转化** ↑ 或 **留存** ↑ 或 **数据资产** ↑；否则 **不做**。
（与 **「零点六」Mobile-First**、**「二点五」CSE**、**「六点二」工具质量红线** 同时满足。）
### 9.5 Tool Eagle 核心操作系统（Core Operating System · 汇总）
以下将 **角色、目标、策略、原则** 固化为 **永久执行上下文**（与 **六点三～六五**、**二点五**、**「四」SEO** 条款 **叠加执行**）。
#### 角色分工（协作惯例）
- **ChatGPT**：产品/系统 **规格撰写与架构叙事** 的一方（非仓库内法定唯一决策源）。  
- **Cursor（助手）**：**工程执行** — 实现、排障、按 `MEMORY` 与既定 Spec 落地。  
- **用户**：基础设施、账号、密钥与 **负责人级** 决策支持。
**Cursor（助手）不得**：擅自做 **产品方向** 决策、擅自 **改架构**、擅自 **为「优化方向」改战略**。  
**Cursor（助手）必须**：严格按 **`MEMORY` + 负责人/规格** 执行；仅在 **实现细节不清** 时提问。
#### 全局目标（方向性）
建设 **全球最大 AI 创作者平台** 路径上的工程取向：**10 万 → 50 万 → 100 万级** SEO 页面规模、**持续日更**、强变现、**AI 搜索优先** 的可抓取与可引用内容。
**每项工作** 应能指向：**流量增长**、**内容规模（在安全与治理前提下）**、**收入** 之一或多者。
#### 核心战略（不可自废）
优先级链条：**① SEO 流量系统** → **② 内容生产系统** → **③ 创作者工作流系统**（**不是**简单工具堆砌）→ **④ 数据飞轮**（存—复用—优化）→ **⑤ 变现系统**。
**不要** 主做：简单 AI 生成器、低价值功能、**纯 UI** 改动当成功标准。
#### 产品原则：工作流系统，非「工具清单」
**我们不是在堆工具**，而是在做 **创作者工作流系统**。示例链路：**idea → hook → script → caption → hashtags → publish**。  
每个工作流须：**结构化**、**可复用**、能形成 **持续使用依赖**。
#### SEO 系统原则
- 页面以 **程序化** 为主。  
- 每页须有：**title、description、H1、结构化正文、内链**。  
- **每页** 合理链向 **约 3～10** 个其他页面（与站点 IA 一致前提下）。  
- **禁止** 薄内容、无意义重复、对用户无帮助的页。
#### 日更发布系统（与六点五对齐）
- **每日** 运行（**EN + ZH**）。  
- **体量**：**最大安全体量**，**无固定篇数**。  
- **完成条件**：**安全上限触顶** **或** **合格候选耗尽**（见 **六点五**）。  
- **禁止** 为提量而发低质内容。
#### 上传规则（与六点三对齐 · 解耦版）
「上传」**默认**：**校验** → **纳入已落盘生成物与 artifact** → **GitHub**；**不** 同步启动并 **长时间等待** 完整日更管线（见 **六点三 · 〇～C**）。  
**用户常态只负责 upload**；**EN/ZH/SEO/检索/队列/恢复/日更摘要** 等 **默认全自动**（见 **六点三 · 手动上传 · 全自动生产**）。  
**当日日更是否算完成** 见 **六点五** 与调度状态，**与本次 push 成功与否分开报告**。
#### 质量优先级（与 9.1 对齐）
质量 → 唯一性 → 有用性 → SEO 结构 → 体量；冲突时 **减体量不减质量**。
#### 内容安全（与二点五对齐）
平台安全措辞、规避高风险承诺与导流话术；**全站用户向 AI 输出须过 Content Safety Engine**。
#### 内容枯竭（与 9.2 对齐）
饱和时 **不硬生成**；扩主题、retrieval-rewrite、加深内容；无候选则 **停**。
#### 数据飞轮
存高质量输出 → 检索复用 → **改写优于重生成** → 持续改进；目标：**降 AI 成本**、**提质量一致性**。
#### 转化系统
**SEO → 工具 → 生成 → 复用 → 付费**。每页应：**引导进工具**、**对齐意图**、**推入工作流**。
#### 变现原则（与 V151 类实现对齐）
**价值优先**，变现 **在价值交付之后**；触发位如 **post_generate**、**repeat_use**；**禁止** 阻断 **首次体验**。
#### 缩放控制
动态缩放（安全 / 平衡 / 积极 / 恢复等模式以系统为准）；防范：**陡峰暴量**、**单一 topic 独大**、**垃圾信号**。
#### 自检（与 9.3 对齐）
每轮执行前后做 **模块健康与质量/重复/多样性** 检查；异常 → **安全模式 + 减量 + 记录**。
#### 成功定义
**成功** = 流量可持续增长 + 高质量内容 **累积** + 转化 **随时间改善** + 收入 **上升**。  
**不是** = 仅「功能发得多」。
### 9.6 AI 成本与模型策略（Tool Eagle AI Cost · Model Cost Control · 🔒）
**目标**：在 **不牺牲治理与质量红线** 的前提下，**压低 AI 成本**、**抬高可规模化产出**。
#### 1. 不全量依赖「从头生成」
**优先级（从高到低）**：
1. **retrieval + rewrite（检索 + 改写）** — 最高  
2. **低成本模型**（DeepSeek / GLM 等，以仓库配置为准）  
3. **高成本模型** — **仅作 fallback**（质量关键、检索不足以覆盖时）
#### 2. 目标结构（方向性）
系统应逐步逼近（**非**一夜强制达标，以治理与 A/B 为准）：
- 约 **60%～80%** **检索-改写**  
- 约 **20%～40%** **全量生成**
#### 3. 模型使用约定
- **DeepSeek**：**主用** — 低成本、大体量任务。  
- **GLM**：**中文等场景的备份/补充**（以接入为准）。  
- **OpenAI（或其它高价线路）**：**仅** 在 **质量关键**、低价线路 **明显不足** 时使用。
#### 4. 禁止
- **禁止** 凡事 **从零全文生成** 当默认路径（在 **已有可复用高质量资产** 时）。  
- **禁止** 用 **高价模型** 做 **大批量** 程序化 SEO 页生成。  
- **禁止** 在 **retrieval 已足够** 时仍 **全页重生成**。
#### 5. 检索优先（Retrieval First）
生成前须 **尽量**：从高质量资产 **检索** → 若 **足够** → **改写**；**不足** 再 **生成**。
#### 6. 成本优先（在质量可比时）
若两种做法 **质量相当**（或均过门禁）→ **永远选成本更低** 的路径。
#### 7. 长期目标
**持续降低单页成本**，同时 **提高质量与一致性**（与 **九点 · 数据飞轮**、**六点四 · 资产复用** 一致）。
---
## 26. Cursor Token 成本控制规则（强制）

### 26.1 目标
限制 Cursor 执行任务时的 token 消耗。  
本规则作用对象：
- Cursor 对话
- Cursor 代码执行任务
- ChatGPT 给 Cursor 的指令

### 26.2 禁止高 token 任务
若任务满足以下任一条件，Cursor 不得直接执行：
- 需要扫描整个项目
- 需要同时修改 3 个以上核心文件
- 需要输出长报告 / 长总结 / 长计划
- 需要一次性重构整条链路
- 需要读取大量历史文件或全量目录
- 明显会导致超长上下文

命中以上任一条件时，必须回复：
HIGH TOKEN RISK  
SPLIT TASK

### 26.3 最小任务原则
每次只允许 Cursor 执行一个最小任务：
- 只改一个点
- 只验证一个点
- 只处理一个明确问题
- 只读最少必要文件

### 26.4 文件读取限制
Cursor 默认禁止：
- 全仓扫描
- 递归读取所有目录
- 一次读取大量文件
- 未经确认读取无关文件

默认规则：
- 每次只允许先读取 1–3 个直接相关文件
- 如仍不足，必须再单独申请下一步

### 26.5 输出限制
Cursor 输出优先级固定为：
1 Command  
2 Minimal code  
3 Verification

禁止：
- 长报告
- 长总结
- 大段解释
- 重复解释
- 无关分析

### 26.6 修改范围限制
单次任务默认：
- 最多改 1 个核心文件
- 必要时最多 2 个相关文件
- 超过则必须停止并回复：
SPLIT TASK

### 26.7 ChatGPT 对 Cursor 的指令限制
ChatGPT 不得给 Cursor 下列高 token 指令：
- “分析整个项目”
- “检查所有相关文件”
- “把整套系统都优化一下”
- “统一重构全部逻辑”
- “扫描所有目录找问题”
- “先全面分析再说”

ChatGPT 必须把任务改写成：
- 单点
- 最小改动
- 可验证
- 可回滚

### 26.8 高 token 风险拦截语
若 Cursor 判断当前请求将消耗大量 token，必须停止执行，并只输出：
HIGH TOKEN RISK  
SPLIT TASK  
RECOMMENDED NEXT STEP: \<最小下一步任务\>

### 26.9 默认策略
宁可多轮小任务，也禁止一次大任务。  
宁可少改，也禁止大改。  
宁可停止，也禁止无上限消耗 token。

### 26.10 成本优先级
当“完整分析”和“低 token 执行”冲突时：  
优先低 token 执行。

