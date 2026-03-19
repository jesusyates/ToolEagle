# Google Translate 兼容方案

## 事实：这不是我们独有的问题

- **Next.js 官方文档** (nextjs.org/docs) 在开启 Google 翻译后点击链接会崩溃
- **React 官方** 未提供内置修复，[GitHub Issue #32557](https://github.com/facebook/react/issues/32557) 已关闭
- [Martijn Hols 深度分析](https://martijnhols.nl/blog/everything-about-google-translate-crashing-react)：目前没有完美方案

## 已实施的修复

### 1. translate-resilience 脚本（React 核心团队 Dan Abramov 方案）

Google 翻译会把文本包在 `<font>` 里，改变 DOM 结构。当 React 调用 `removeChild`/`insertBefore` 时会失败。该脚本让这些调用在节点已被翻译修改时静默失败。

- 来源：[Next.js Discussion #66313](https://github.com/vercel/next.js/discussions/66313)
- 来源：[React Issue #11538](https://github.com/facebook/react/issues/11538#issuecomment-417504600)

### 2. span 包裹 + suppressHydrationWarning（Next.js 维护者 icyJoseph 方案）

- **span 包裹**：避免「floating bits of text」，让 React 能正确引用 DOM 节点
- **suppressHydrationWarning**：让 React 在 hydration 时接受被翻译修改过的 DOM

已应用到：SiteHeader 导航、slogan、Community、Learn AI、Tools、Answers、SiteFooter 等

## 其他网站的常见做法

- **translate="no"**：彻底禁止翻译（如 Upstash 等控制台类产品）
- **自建 i18n**：在应用内实现多语言切换，不依赖浏览器翻译

## 参考

- [Next.js Discussion #66313](https://github.com/vercel/next.js/discussions/66313)
- [Martijn Hols - Everything about Google Translate crashing React](https://martijnhols.nl/blog/everything-about-google-translate-crashing-react)
- [Chromium Bug 41407169](https://issues.chromium.org/issues/41407169)
