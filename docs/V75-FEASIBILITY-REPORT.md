# V75 可行性分析报告

> 先看，确定可以再做。

---

## 一、总体结论

| 项目 | 可行性 | 复杂度 | 建议 |
|------|--------|--------|------|
| 1. 工具层统一 | ✅ 可行 | 中 | 立即实施 |
| 2. API 升级 | ✅ 可行 | 低 | 立即实施 |
| 3. next-intl 集成 | ✅ 可行 | 中 | 立即实施 |
| 4. 移除硬编码中文 | ✅ 可行 | 低 | 随工具统一完成 |
| 5. 路由一致性 | ✅ 可行 | 低 | 立即实施 |
| 6. SEO 内容层统一 | ⚠️ 复杂 | 高 | **建议分阶段，先不做** |

---

## 二、逐项分析

### 1. 工具层统一 ✅

**现状：**
- 英文：`HookGeneratorClient`、`TitleGeneratorClient`、`IdeaGeneratorClient`（在 idea-generator 里） + `GenericToolClient`（动态工具）
- 中文：`ZhHookGeneratorClient`、`ZhTitleGeneratorClient`、`ZhIdeaGeneratorClient`（无 AI，本地样本）

**实施要点：**
1. `/zh/tools/hook-generator/page.tsx` 改为渲染与 `/tools/hook-generator` 相同的布局：`SiteHeader` + `HookGeneratorClient` + `SiteFooter`
2. `HookGeneratorClient` 内用 `usePathname()` 判断 locale，传给 `generateAIText(prompt, { locale })`
3. 删除 `ZhHookGeneratorClient.tsx`、`ZhTitleGeneratorClient.tsx`、`ZhIdeaGeneratorClient.tsx`
4. `GenericToolClient` 同理，需支持 locale

**idea-generator 特殊说明：** 英文无 `/tools/idea-generator`，只有 `/tools/tiktok-idea-generator`、`/tools/youtube-video-idea-generator` 等。建议将 `/zh/tools/idea-generator` 映射为 `GenericToolClient` + `slug="tiktok-idea-generator"`，metadata 保持「免费选题生成器」以保留 SEO。

**注意：** 中文工具当前有 `ctaLinks` 指向 `/zh/search/*`。统一后可选方案：
- A) 保留：给 `HookGeneratorClient` 增加可选 `ctaLinks` prop，zh 页面传入
- B) 简化：统一用 `RelatedToolsCard` 等，链接改为 locale 感知（如 `/zh/tools/xxx`）

建议先用 A，改动最小。

---

### 2. API 升级 ✅

**现状：** `/api/generate` 只接收 `{ prompt }`

**改动：**
```ts
const { prompt, locale = 'en' } = await request.json();
const localeInstruction: Record<string, string> = {
  zh: 'Output in Simplified Chinese. ',
  es: 'Output in Spanish. ',
  pt: 'Output in Portuguese. ',
  id: 'Output in Indonesian. '
};
const finalPrompt = (localeInstruction[locale] ?? '') + prompt;
```

**风险：** 无。向后兼容（不传 locale 则默认 en）。

---

### 3. next-intl 集成 ✅

**现状：** `src/i18n/request.ts` 固定返回 `locale: "en"`，只加载 `messages/en.json`

**改动：**
- 使用 `headers().get("x-pathname")` 判断 pathname（middleware 已设置）
- 若 pathname 以 `/zh` 开头 → `locale: "zh"`，加载 `messages/zh.json`
- 否则 → `locale: "en"`，加载 `messages/en.json`

**已有：** `messages/zh.json` 已存在且结构完整（common、nav、tools 等）

**风险：** 需确认 `getRequestConfig` 中能否使用 `headers()`。next-intl 文档支持在 server 端用 `headers()` 或 `unstable_setRequestLocale`。可查 next-intl 的 `getRequestConfig` 用法。

---

### 4. 移除硬编码中文 ✅

**现状：** `ZhHookGeneratorClient` 等组件内硬编码「免费钩子生成器」「生成钩子」等

**实施：** 删除 Zh*Client 后，这些硬编码自然消失。工具 UI 由 `useTranslations("tools")` 等提供，需在 `messages/zh.json` 中补全工具相关 key（如 `hookGenerator.title`、`hookGenerator.generate` 等）。

**检查：** `messages/zh.json` 已有 `tools.title`、`tools.subtitle`，但工具页内具体文案（如 "Hook Generator"、"Generate Hooks"）可能来自 `ToolPageShell` 的 props。需确认 `HookGeneratorClient` 是否用 `t()` 还是硬编码。当前 `HookGeneratorClient` 中 "Hook Generator"、"Generate Hooks" 等为硬编码，需改为 `useTranslations`。

---

### 5. 路由一致性 ✅

**实施：** 让 `/zh/tools/hook-generator` 使用与 `/tools/hook-generator` 相同的 `HookGeneratorClient`。通过 layout 或 provider 传入 locale，或由组件内部 `usePathname()` 推断。

**结构：**
```
/tools/hook-generator/page.tsx     → HookGeneratorPage (locale 隐含 en)
/zh/tools/hook-generator/page.tsx  → 复用同一 HookGeneratorClient，locale=zh
```

可提取共享布局，或让 zh 的 page 直接 import 英文的 page 组件并传入 locale。

---

### 6. SEO 内容层统一 ⚠️ 建议暂缓

**现状：**
- `GuidePageTemplate`：~220 行，用 `getGuideContent`、`GuideContentSection`、`GuideRecommendations` 等
- `ZhGuidePageTemplate`：~440 行，用 `getZhContent`、`ZhPageContent`，以及大量 Zh 专用组件：
  - `ZhToolRecommendationBlock`、`ZhCtaCaptureBlock`、`ZhStickyCta`
  - `ZhFreeVsPaidSection`、`ZhComparisonTable`、`ZhCaseProofBlock`
  - `ZhExitIntentPopup`、`ZhAuthorBlock`、`ZhFreshnessBlock`
  - `ZhPageViewTracker`、`ZhExitIntentPopup` 等

**差异：**
- 英文：基于 `getGuideContent` 的结构化内容
- 中文：基于 AI 生成的 markdown（`content.directAnswer`、`content.faq` 等），结构不同
- 中文有更多转化/变现相关模块（affiliate、exit intent 等）

**统一为 ContentTemplate 的难度：**
1. 需抽象 `getContent(type, topic, locale)`，合并 `getGuideContent` 与 `getZhContent`
2. 需统一 UI 结构，或按 locale 分支渲染（会变成大 if/else）
3. 中文特有模块需设计为可选或 locale 条件渲染
4. 涉及 10+ 个页面（how-to、content-strategy、viral-examples、ai-prompts-for 等）

**建议：** V75 先不统一 SEO 内容层，保留 `GuidePageTemplate` 和 `ZhGuidePageTemplate`。工具层统一完成后，再单独规划 ContentTemplate 重构。

---

## 三、实施顺序建议

### Phase 1（本次可做）
1. 升级 `/api/generate`，支持 `locale`
2. 修改 `generateAIText`，支持传入 `locale`
3. 修改 `src/i18n/request.ts`，按 pathname 检测 locale 并加载对应 messages
4. 修改 `HookGeneratorClient`：从 pathname 取 locale，传给 `generateAIText`
5. 修改 `/zh/tools/hook-generator/page.tsx`，渲染 `HookGeneratorClient`（与英文相同布局）
6. 删除 `ZhHookGeneratorClient`
7. 对 `title-generator`、`idea-generator` 重复 4–6
8. 添加 `SUPPORTED_LANGUAGES`、`FUTURE_LANGUAGES` 配置
9. 补全 `messages/zh.json` 中工具相关 key，替换 `HookGeneratorClient` 等中的硬编码

### Phase 2（后续）
- SEO 内容层统一为 ContentTemplate
- `GenericToolClient` 的 locale 支持（若 /zh/tools/[slug] 需要）

---

## 四、风险与依赖

| 风险 | 缓解 |
|------|------|
| next-intl 在 getRequestConfig 中取 pathname | 使用 `headers().get("x-pathname")`，middleware 已设置 |
| 工具页硬编码文案未全部迁移到 messages | 先 grep 所有硬编码，再补全 zh.json |
| idea-generator 可能用不同结构 | 需单独查看 `idea-generator` 的实现 |

---

## 五、确认清单

实施前请确认：
- [ ] 同意 SEO 内容层（ContentTemplate）暂不统一
- [ ] 同意 zh 工具页的 aside 可先与英文一致（或保留 ctaLinks 作为可选 prop）
- [ ] `idea-generator` 的英文实现存在且可复用（需确认路由结构）

---

**结论：** 工具层、API、next-intl、路由统一均可实施。SEO 内容层建议延后。若确认以上清单，可开始实施 Phase 1。
