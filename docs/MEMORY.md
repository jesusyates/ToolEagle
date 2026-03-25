# ToolEagle 记忆本（唯一规则文件）

**只有本文件承载全部约定。** 无其他「架构原则 / 国家站模板 / V98 说明」文档；改规则只改此处。

**AI 行为（省 token）**：**不**要求每条用户消息都 Read（避免同一会话反复注入全文、堆积 token）。助手在**本会话首次**即将产出实质性内容前 **`Read docs/MEMORY.md` 一次**；同一会话内**延续工作不必每条再读**，除非：用户要求「读记忆本」、刚改过本文件、重大决策前需对齐磁盘、或不确定是否仍最新。细则见 **`.cursor/rules/00-memory-read-policy.mdc`**。

**可见确认**：**本会话第一次**完成 Read 并对齐后的**第一条**实质性回复须含 **「已读记忆规则」**（可注明「本会话首次」）。未 Read 时不得写该句；延续本会话未再读时可省略或说明 **「延续本会话，未重复读记忆本」**。

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

---

## 七、一句话备忘

🌍 全球 + 国家双轨 · 🌐 **当前专注 Web（移动优先）→ 中期 PWA → 成熟原生** · 📱 **Mobile-First** · 🧠 分区 AI · 🛡️ **Content Safety Engine = 系统级护城河（全站 AI 输出必过）** · ⚡ 分区性能 · 💰 分区支付 · 🔍 分区 SEO · ♾️ 可扩展 · 🇨🇳 **中国站 = 平台级创作者系统（抖音→小红书→快手，禁 TikTok 直译、禁多平台并行全量）** · 🧩 **工具质量红线：做不好不上线，宁缺毋滥；工具说明一致、随机不固定、输入强相关、平台合规必过** · **只读本文件**

---

## 八、Cursor 里如何对齐记忆本（省 token 版）

软件层面**没有**「每句自动后台读文件」的接口；做法是 **Cursor 规则 + 助手主动 Read**：

1. **`.cursor/rules/00-memory-read-policy.mdc`**（`alwaysApply: true`）  
   **本会话首次**实质性回复前 **Read `docs/MEMORY.md` 一次**；**不要**每条新消息都 Read（省 token）。改记忆本并保存后，助手在触发「须再读」条件时再 Read，即可对齐最新版。

2. **唯一正文**仍只维护 **`docs/MEMORY.md`**；规则文件只写流程，**不**重复粘贴全文。

3. **纯寒暄**可完全不 Read。**长对话**可新开 Cursor 会话，或在关键节点再 Read 一次。
