# CN platform stack (V102.1+)

- **Config**: `config.ts` — `CN_PLATFORMS`, route naming, `launched` flags.
- **Ship order**: Douyin → (later) Xiaohongshu → Kuaishou.
- **Per platform**: add `/zh/{prefix}` hub + `/zh/{prefix}-{caption|hook|script}-generator` tools; reuse `ZhDeferredPostPackageToolClient` with Douyin-native copy; use shared modules under `src/components/zh/cn-platforms/`.

Do not copy EN TikTok pages verbatim; prompts stay `market: cn` / `siteMode: china` via existing tool clients.
