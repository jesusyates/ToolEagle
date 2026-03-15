# Database Migration

## 一键初始化（首次运行）

1. 获取数据库连接字符串：
   - 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择项目
   - Settings → Database → Connection string
   - 选择 **URI**，复制连接字符串
   - 将 `[YOUR-PASSWORD]` 替换为你的数据库密码（创建项目时设置的）

2. 添加到 `.env.local`：
   ```
   SUPABASE_DB_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-xx-x.pooler.supabase.com:6543/postgres
   ```

3. 执行迁移：
   ```bash
   npm run db:migrate
   ```

完成后，Table Editor 中会出现：profiles, favorites, generation_history, usage_stats, projects, project_items。
