V196.1 Activation Runbook（人工执行）

1. 去 Supabase 执行哪个 SQL 文件
- `supabase-migrations/phase23-content-memory.sql`

2. 需要配置哪 3 个环境变量
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

3. 真实操作链路怎么跑
- hook-generator → generate → copy → Go to TikTok

4. 跑哪个命令验证
- `npm run v196:preflight`
- `npm run v196:activation-check`

5. 成功标准
- `generated/v196-activation-check.json` 里 `activation_status` 为 `ok`
- 且 `migration_applied=true`、`content_items_ok=true`、`content_events_ok=true`、`sample_dump_ok=true`

