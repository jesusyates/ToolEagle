# 中文 SEO 页面分批部署计划

## 🤖 全自动模式（推荐）

**一键设置，无需手动操作：**

```bash
# 1. 首次：生成内容（需 OPENAI_API_KEY）
npm run zh:generate

# 2. 设置 Windows 计划任务（每 3 天自动部署）
# 以管理员身份打开 PowerShell，在项目目录执行：
Set-ExecutionPolicy Bypass -Scope Process -Force
.\scripts\setup-auto-deploy-task.ps1
```

之后每 3 天晚上 21:00 会自动：本地检测（无问题才部署）→ 发布下一批 → git push

**或手动触发一次自动部署：**
```bash
npm run zh:deploy-auto
```

---

## 手动模式

> **最后检测时间**：根据 `npm run zh:stats` 结果生成

---

## 一、当前状态（请先运行检测）

```bash
npm run zh:stats
```

**当前检测结果**：
- 总页面数：**1**
- 已发布：**0**（或未设置 published 字段）
- 未发布：**1**

**结论**：内容极少，尚未开始正式分批部署。

---

## 二、完整部署路线图

### 阶段 0：内容准备（必须完成）

| 步骤 | 命令 | 说明 |
|------|------|------|
| 1 | `npm run zh:generate` | 生成全部中文 SEO 内容（需 OPENAI_API_KEY） |
| 2 | `npm run zh:stats` | 确认总页面数 |

**⚠️ 你必须先完成阶段 0，才能进行分批发布。**

---

### 阶段 1：首次发布（第 1 批）

**建议时间**：完成内容生成后立即执行

| 步骤 | 命令 | 你必须执行 |
|------|------|------------|
| 1 | `npm run zh:publish -- --limit=30` | ✅ 发布前 30 页 |
| 2 | `npm run deploy:prep` | ✅ 验证无问题 |
| 3 | `git add .` | ✅ |
| 4 | `git commit -m "publish 30 zh pages (batch 1)"` | ✅ |
| 5 | `git push` | ✅ 部署到生产 |

**提醒**：首次发布控制在 30 页以内，观察 3–5 天。

---

### 阶段 2：第 2 批（间隔 3–5 天）

**建议时间**：第 1 批部署后 **3–5 天**

| 步骤 | 命令 | 你必须执行 |
|------|------|------------|
| 1 | `npm run zh:publish -- --limit=60` | ✅ 累计发布 60 页 |
| 2 | `npm run deploy:prep` | ✅ |
| 3 | `git add . && git commit -m "publish 60 zh pages (batch 2)" && git push` | ✅ |

---

### 阶段 3：第 3 批（再间隔 3–5 天）

**建议时间**：第 2 批部署后 **3–5 天**

| 步骤 | 命令 | 你必须执行 |
|------|------|------------|
| 1 | `npm run zh:publish -- --limit=100` | ✅ 累计发布 100 页 |
| 2 | `npm run deploy:prep` | ✅ |
| 3 | `git add . && git commit -m "publish 100 zh pages (batch 3)" && git push` | ✅ |

---

### 阶段 4：第 4 批及以后（每批 +50 页）

**建议时间**：每批间隔 **3–5 天**

| 批次 | limit 值 | 累计发布 |
|------|----------|----------|
| 第 4 批 | 150 | 150 页 |
| 第 5 批 | 200 | 200 页 |
| 第 6 批 | 250 | 250 页 |
| … | +50 递增 | … |

**命令模板**：
```bash
npm run zh:publish -- --limit=150
npm run deploy:prep
git add . && git commit -m "publish 150 zh pages (batch 4)" && git push
```

---

## 三、📌 你现在必须做的事（按顺序）

### 情况 A：你还没有生成足够内容（当前只有 1 页）

1. **先生成内容**：
   ```bash
   npm run zh:generate
   ```
   （需要设置 `OPENAI_API_KEY`）

2. **查看数量**：
   ```bash
   npm run zh:stats
   ```

3. **如果总页数 ≥ 30**，执行首次发布：
   ```bash
   npm run zh:publish -- --limit=30
   npm run deploy:prep
   git add .
   git commit -m "publish 30 zh pages (batch 1)"
   git push
   ```

### 情况 B：你已经有大量内容（例如 200+ 页）

1. **查看当前状态**：
   ```bash
   npm run zh:stats
   ```

2. **如果已发布数为 0**，执行首次发布：
   ```bash
   npm run zh:publish -- --limit=30
   npm run deploy:prep
   git add .
   git commit -m "publish 30 zh pages (batch 1)"
   git push
   ```

3. **设置日历提醒**：3–5 天后执行第 2 批（limit=60）

---

## 四、部署检查清单（每次部署前）

- [ ] 运行 `npm run zh:stats` 确认数量
- [ ] 运行 `npm run zh:publish -- --limit=N`
- [ ] 运行 `npm run deploy:prep` 无报错
- [ ] `git add .` 并 `git commit`
- [ ] `git push` 完成部署

---

## 五、重要提醒

1. **不要一次性发布全部**：避免 `--limit=9999` 或过大数值。
2. **严格按 3–5 天间隔**：每批之间留足时间。
3. **每批前先跑 `zh:stats`**：确认当前总数和已发布数。
4. **`--limit` 是累计值**：`--limit=60` 表示前 60 页发布，不是“再多发 60 页”。
