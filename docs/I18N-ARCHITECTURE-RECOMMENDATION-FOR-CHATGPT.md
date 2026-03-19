# ToolEagle 国际化架构建议（给 ChatGPT）

> 本文档综合当前所有问题，提出统一架构方案。目标：**把不合理的全部变成合理**，并为未来多国家扩展（es, pt, id 等）打好基础。若每个国家一套实现，项目将无法维护。

---

## 一、当前问题总结

### 1. 工具实现：两套完全独立的代码

| 英文 | 中文 |
|------|------|
| `HookGeneratorClient` | `ZhHookGeneratorClient` |
| 调用 `/api/generate`，AI 生成 | 本地预设样本，随机选择，**无 AI** |
| 有登录、历史、限制、埋点 | 无任何上述能力 |
| `aiPrompts` 配置驱动 | 硬编码 `HOOK_SAMPLES` |

**后果**：若扩展西班牙语、葡萄牙语、印尼语，需要为每个语言再写一套 `XxHookGeneratorClient`，维护成本呈线性甚至指数增长。

### 2. SEO 内容：两套模板 + 两套数据

- 英文：`GuidePageTemplate` + 英文配置（`HOW_TO_TOPICS` 等）
- 中文：`ZhGuidePageTemplate` + `getZhContent`（AI 生成内容）
- 关键词页：英文无对应，中文有 `ZhKeywordPageTemplate` + `zh-keyword-data`

**后果**：每增加一种语言，需要新的 Template + 新的数据源，难以扩展。

### 3. i18n 配置：仅英文

- `src/i18n/request.ts` 固定返回 `locale: "en"`，只加载 `messages/en.json`
- 中文页面不经过 next-intl，文案全部硬编码
- 工具 UI 文案（按钮、提示、错误信息）无法复用

### 4. 路由结构：不统一

- 英文：`/tools/hook-generator`、`/how-to/tiktok`
- 中文：`/zh/tools/hook-generator`、`/zh/how-to/tiktok`
- 但 `/zh/tools/*` 下的工具是「假工具」，与 `/tools/*` 功能不对等

---

## 二、反思：哪里出错了？

1. **按语言拆分实现，而非按功能拆分**  
   正确做法应是：一套工具逻辑 + locale 参数；错误做法是：每种语言一套组件。

2. **把「中文 SEO」和「中文产品」混在一起**  
   中文 SEO 内容（指南、关键词页）可以独立生成；但工具、仪表盘、通用 UI 应是同一套代码，仅文案不同。

3. **未在设计阶段考虑 N 语言扩展**  
   若一开始就假设「未来会有 es, pt, id」，就不会出现 `ZhHookGeneratorClient` 这种单语言专用实现。

4. **AI 能力未抽象**  
   `/api/generate` 只接受 `prompt`，未接受 `locale`。若 prompt 中加上「Output in Chinese」，同一 API 即可服务多语言。

---

## 三、目标架构原则

### 原则 1：一套实现，locale 驱动

- **工具**：只有一个 `HookGeneratorClient`，接收 `locale`（或从 URL 推断）
- **API**：`/api/generate` 接受 `{ prompt, locale }`，在 system/user prompt 中注入「Output in {locale}」
- **UI 文案**：`messages/en.json`、`messages/zh.json` 等，由 next-intl 按 locale 加载

### 原则 2：路由与 locale 一一对应

```
/           → locale: en（默认）
/zh/*       → locale: zh
/es/*       → locale: es（未来）
/tools/xxx  → 英文工具
/zh/tools/xxx → 中文工具（同一组件，locale=zh）
```

### 原则 3：内容与代码分离

- **可翻译的 UI**：放在 `messages/{locale}.json`
- **SEO 内容**：按 locale 存储（如 `content/en/how-to/tiktok.md`、`content/zh/how-to/tiktok.md`），或 AI 生成后落库
- **工具逻辑**：与语言无关，只与「生成什么」有关

### 原则 4：新增语言 = 加配置，不加代码

- 新增 `messages/es.json`
- 新增 `content/es/` 或对应的内容数据源
- 在 `locales` 配置中加 `es`
- **不需要** 新建 `EsHookGeneratorClient`、`EsGuidePageTemplate` 等

---

## 四、具体实施建议

### 阶段 1：统一工具层（优先级最高）

1. **废弃 `ZhHookGeneratorClient`、`ZhTitleGeneratorClient`、`ZhIdeaGeneratorClient`**  
   不再维护中文专用工具组件。

2. **改造 `HookGeneratorClient` 等为 locale 感知**  
   - 从 `useLocale()` 或 URL pathname 获取 locale
   - 调用 `generateAIText(prompt, { locale })` 时传入 locale

3. **改造 `/api/generate`**  
   - 接受 `{ prompt, locale?: string }`
   - 若 `locale === 'zh'`，在 prompt 前追加：`Output in Simplified Chinese. ` 或作为 system message
   - 其他语言同理

4. **改造 `aiPrompts`**  
   - 可保持英文 prompt，由 API 层追加语言指令
   - 或拆分为 `aiPrompts.en`、`aiPrompts.zh`，按 locale 选择（若不同语言需要不同 prompt 结构）

5. **路由复用**  
   - `/zh/tools/hook-generator` 渲染与 `/tools/hook-generator` 相同的 `HookGeneratorClient`，仅通过 layout 或 provider 传入 `locale=zh`
   - 实现方式：`[locale]/tools/[slug]/page.tsx` 或 在 `zh` layout 下复用 `tools` 的 page 组件

### 阶段 2：统一 i18n

1. **启用 next-intl 多 locale**  
   - 修改 `src/i18n/request.ts`：根据 pathname 或 header 判断 locale，加载对应 `messages/{locale}.json`
   - 确保 `messages/zh.json` 覆盖所有工具 UI 文案（按钮、占位符、错误提示等）

2. **SiteHeader / SiteFooter**  
   - 使用 `useTranslations` 获取文案，不再硬编码
   - 语言切换器：`/`、`/zh/sitemap`、未来 `/es/...` 等

3. **工具页**  
   - 所有「生成」「复制」「历史」等文案从 `messages` 读取

### 阶段 3：统一 SEO 内容层（可后续迭代）

1. **抽象 ContentTemplate**  
   - 接收 `{ pageType, topic, locale, content }`
   - `content` 按 locale 从统一接口获取：`getContent(pageType, topic, locale)`

2. **内容存储**  
   - 英文：现有配置或 MD 文件
   - 中文：`getZhContent` 或迁移到统一 `getContent(..., 'zh')`
   - 未来：`getContent(..., 'es')` 等

3. **路由**  
   - `[locale]/how-to/[topic]`、`[locale]/content-strategy/[topic]` 等
   - 或保持 `/zh/how-to/xxx` 结构，但在 page 内调用统一的 `getContent`

---

## 五、技术实现要点

### 5.1 如何让 `/zh/tools/hook-generator` 使用同一组件？

**方案 A：pathname 判断**  
在 `HookGeneratorClient` 内：

```ts
const pathname = usePathname();
const locale = pathname.startsWith('/zh') ? 'zh' : 'en';
```

**方案 B：Locale Provider**  
在 `zh` 的 layout 中设置 `LocaleProvider` 的 `locale="zh"`，工具组件从 context 读取。

**方案 C：Next.js i18n 路由**  
使用 `next-intl` 的 `[locale]` 动态段，将 `en`、`zh` 作为顶层 segment，则 `/zh/tools/hook-generator` 和 `/en/tools/hook-generator` 共享同一 page 组件。  
（需评估与现有路由的兼容性，如 `/` 默认 en 的映射）

### 5.2 API 层 locale 注入示例

```ts
// /api/generate
const { prompt, locale = 'en' } = await request.json();

const localeInstruction: Record<string, string> = {
  zh: 'Output in Simplified Chinese. ',
  es: 'Output in Spanish. ',
  pt: 'Output in Portuguese. ',
  id: 'Output in Indonesian. '
};

const finalPrompt = (localeInstruction[locale] ?? '') + prompt;
```

### 5.3 新增语言检查清单

- [ ] 添加 `messages/{locale}.json`
- [ ] 在 `locales` 配置中注册
- [ ] 添加语言切换器入口
- [ ] 若有 SEO 内容，添加 `getContent(..., locale)` 数据源
- [ ] **不需要** 新建任何 `XxxClient` 或 `XxxTemplate` 组件

---

## 六、迁移顺序建议

1. **先做 hook-generator**  
   作为试点，将 `ZhHookGeneratorClient` 替换为复用 `HookGeneratorClient` + locale，验证 API 改造、i18n 加载无误。

2. **推广到 title-generator、idea-generator**  
   同理，删除 `Zh*Client`，统一入口。

3. **补全 `messages/zh.json`**  
   覆盖所有工具、通用组件的文案。

4. **改造 next-intl 配置**  
   支持从 pathname 解析 locale，并加载对应 messages。

5. **SEO 内容层**  
   可放在后续，优先保证工具层统一。

---

## 七、总结

| 当前 | 目标 |
|------|------|
| 每种语言一套工具实现 | 一套工具 + locale 参数 |
| 中文工具无 AI | 所有语言共用 AI API，prompt 注入语言指令 |
| next-intl 仅 en | 多 locale，按 pathname 加载 messages |
| 新增语言 = 新组件 | 新增语言 = 新 messages + 配置 |
| GuidePageTemplate vs ZhGuidePageTemplate | 统一 ContentTemplate + getContent(locale) |

**核心思想**：代码与语言解耦。语言只影响「文案」和「输出语言」，不影响「功能」和「组件结构」。这样，未来扩展 es、pt、id 时，只需加配置，不加新代码。
