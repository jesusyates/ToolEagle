# ToolEagle — 给 ChatGPT 的协作入口（索引）

> **文档与真相优先级**（MEMORY 已写死）：`MEMORY.md` 最高 → `PROJECT-STATUS-REPORT-FOR-CHATGPT.md` 描述现状 → 代码为「当前行为」→ 历史/V* 仅背景。详见 **`docs/MEMORY.md`「零点五·一」**。

> **状态说明（重要）**  
> 本文件**不再**承担「全量项目说明书」角色：此前以 **V76–V78** 为主的旧版长文已过时。  
> **当前与仓库一致的主报告**是：**`docs/PROJECT-STATUS-REPORT-FOR-CHATGPT.md`**（持续与代码/记忆本对齐）。  
> **唯一规则正文**始终是：**`docs/MEMORY.md`**。

**给 ChatGPT 的复制用语：**  
请先读 **`docs/MEMORY.md`**，再读 **`docs/PROJECT-STATUS-REPORT-FOR-CHATGPT.md`**；若需路由/组件细节以仓库为准。勿单独依赖本索引中的历史小节做架构判断。

---

## 一、必读顺序

| 顺序 | 文件 | 作用 |
|------|------|------|
| 1 | **`docs/MEMORY.md`** | 战略、国家站顺序（抖音→小红书→快手）、CSE、Mobile-First、商业与合规等**唯一正文** |
| 2 | **`docs/PROJECT-STATUS-REPORT-FOR-CHATGPT.md`** | **当前**进度、能力模块、约束、阶段判断（与实现同步） |
| 3 | `docs/CHATGPT-PROJECT-REPORT.md`（本页） | 下一步任务索引 + 历史里程碑速查 |

---

## 二、下一步安排（执行向）

> **战略**：英文全球站 `/` 仍是主战场；`/zh` 为本土闭环与国家站模板。近期实现多落在中文站时，需**主动排期**拉回全球站迭代，避免长期偏科。

### A. 英文主站（Global）

- 核心转化路径：首页 → 高频工具 → 结果 → 升级/联盟；补齐英文侧 CTA、限额、埋点（可对照 `/zh` 已跑通动线）。
- SEO：`/pseo/*`、`/tools/*`、programmatic 健康（内链、sitemap、薄页）；高意图优先于堆量。
- 双轨：新能力默认考虑 **en + zh**，避免只写 `/zh`。
- 观测：英文关键漏斗建议有固定视图（可与中文并列）。

### B. 中文站（`/zh`）

- 抖音栈深化；小红书/快手未全量前遵守 MEMORY 顺序。
- 支付、工作台、算力/额度：稳定、可排障、无静默失败。
- 首页「最新/热门」等模块：内链 + SEO + 发现，保持更新与相关性。

### C. 全站硬约束

- **CSE**：用户可见 AI 输出须走安全层；禁止绕路。
- **Mobile-First**：默认按手机验收。
- 与 MEMORY 冲突时以 **MEMORY** 为准。

### D. 可选文案

- 头栏「英文主站」若改为「全球网站」等，仅改文案组件（如 `MarketSelector`），与 middleware 无关。

---

## 三、历史里程碑（V76–V78 · 仅背景，非当前全貌）

以下内容来自早期迭代，**细节可能已被后续 V9x / 程序化 SEO / 中文站深化覆盖**，实施前请对照仓库与 `PROJECT-STATUS-REPORT-FOR-CHATGPT.md`。

- **V76 / V76.5**：国家层、`country` 分析、zh 工具路由、Affiliate 分国家等。
- **V77**：DirectAnswerBlock、AI 引用向 FAQ、ZhToolEmbeddingSentence、`/en/how-to` 首批等。
- **V78**：直接回答结构化、DataSignalBlock、EN how-to 扩展、回答密度规范。

专题摘要仍可查：`docs/V76-V76.5-IMPLEMENTATION-SUMMARY.md`、`docs/V77-AI-CITATION-SUMMARY.md`、`docs/V78-AI-ANSWER-OPTIMIZATION-SUMMARY.md`。

---

## 四、其它专题文档（按需）

- `docs/V93-PROGRAMMATIC-SEO.md`、`docs/V93.1-PROGRAMMATIC-SEO-HARDENING.md`
- `docs/V96-V97-CONVERSION-GEO.md`、`docs/COUNTRY-DELIVERY-STANDARDS.md`
- `docs/V101-CN-PAYMENT.md`、`docs/V100-*`（支持者/反馈等）
- `docs/CHATGPT-ROADMAP.md`（若存在，与 MEMORY 冲突时以 MEMORY 为准）

---

*索引更新：2026-03-22 — 明确主报告为 `PROJECT-STATUS-REPORT-FOR-CHATGPT.md`，避免 ChatGPT 误读旧版 V76–V78 长文。*
