/**
 * v60.2 统一自动部署 - 英文 + 中文
 * Run: npm run deploy:auto
 *
 * 逻辑：
 * - 自动检测当前状态（ZH + EN）
 * - 若距上次部署已过 3 天（或从未部署），则执行下一批
 * - ZH：分批发布（每批 30 页），先 validateLocal 通过才发布
 * - EN：纳入本次部署（如有变更一并推送）
 * - 统一 git add / commit / push
 * - 计划任务：每 3 天晚上 21:00 执行
 */

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const CWD = process.cwd();
const ZH_CACHE_PATH = path.join(CWD, "data", "zh-seo.json");
const EN_CORE_PATH = path.join(CWD, "data", "core-pages-en.json");
const STATE_PATH = path.join(CWD, ".deploy-state.json");
const BATCH_INTERVAL_DAYS = 3;
const ZH_BATCH_SIZE = 30;

function loadJson(p, defaultVal) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return defaultVal;
  }
}

function saveJson(p, data) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function loadState() {
  const def = {
    zh: { lastPublished: 0, lastDeployDate: null, batchNumber: 0 },
    en: { lastDeployDate: null }
  };
  // 迁移旧版 .zh-deploy-state.json
  const oldPath = path.join(CWD, ".zh-deploy-state.json");
  if (fs.existsSync(oldPath)) {
    const old = loadJson(oldPath, {});
    def.zh.lastPublished = old.lastPublished ?? def.zh.lastPublished;
    def.zh.lastDeployDate = old.lastDeployDate ?? def.zh.lastDeployDate;
    def.zh.batchNumber = old.batchNumber ?? def.zh.batchNumber;
    try {
      fs.unlinkSync(oldPath);
    } catch {}
  }
  const raw = loadJson(STATE_PATH, {});
  return {
    zh: { ...def.zh, ...raw.zh },
    en: { ...def.en, ...raw.en }
  };
}

function saveState(state) {
  saveJson(STATE_PATH, state);
}

// ----- ZH -----
function getZhStats() {
  const cache = loadJson(ZH_CACHE_PATH, {});
  const entries = [];
  for (const [pageType, topics] of Object.entries(cache)) {
    if (typeof topics !== "object") continue;
    for (const [topic, data] of Object.entries(topics)) {
      if (typeof data !== "object") continue;
      const ts = data.createdAt ?? data.lastModified ?? 0;
      entries.push({ pageType, topic, data, ts });
    }
  }
  entries.sort((a, b) => b.ts - a.ts);
  return { total: entries.length, entries, cache };
}

function runZhPublish(cache, limit) {
  const entries = [];
  for (const [pageType, topics] of Object.entries(cache)) {
    if (typeof topics !== "object") continue;
    for (const [topic, data] of Object.entries(topics)) {
      if (typeof data !== "object") continue;
      const ts = data.createdAt ?? data.lastModified ?? 0;
      entries.push({ pageType, topic, data, ts });
    }
  }
  entries.sort((a, b) => b.ts - a.ts);
  entries.forEach(({ pageType, topic, data }, i) => {
    cache[pageType][topic] = { ...data, published: i < limit };
  });
  saveJson(ZH_CACHE_PATH, cache);
}

function validateZhLocal(entries, limit) {
  const REQUIRED = ["intro", "guide", "stepByStep", "faq"];
  const MIN_LEN = 800;
  const issues = [];
  for (let i = 0; i < Math.min(limit, entries.length); i++) {
    const { pageType, topic, data } = entries[i];
    const text = [data.intro, data.guide, data.stepByStep, data.faq].filter(Boolean).join("");
    if (!data.intro || !data.guide) issues.push(`ZH ${pageType}/${topic}: 缺少 intro/guide`);
    else if (text.length < MIN_LEN) issues.push(`ZH ${pageType}/${topic}: 内容过短`);
    else if (REQUIRED.some((f) => !data[f]?.trim())) issues.push(`ZH ${pageType}/${topic}: 缺少必填字段`);
  }
  return issues;
}

// ----- EN -----
function getEnStats() {
  if (!fs.existsSync(EN_CORE_PATH)) return { hasCore: false };
  const core = loadJson(EN_CORE_PATH, {});
  const count = (core.allCoreUrls || []).length;
  return { hasCore: true, coreUrlsCount: count };
}

// ----- Git -----
const REMINDER_PATH = path.join(CWD, ".deploy-reminder.txt");

function writeReminder(msg) {
  try {
    fs.writeFileSync(
      REMINDER_PATH,
      `[${new Date().toISOString()}] ${msg}\n\n请联网后运行: npm run deploy:auto`,
      "utf8"
    );
  } catch {}
}

function runGit(message) {
  const addPaths = [
    "data/zh-seo.json",
    "data/zh-keywords.json",
    "data/core-pages-en.json",
    ".deploy-state.json"
  ].filter((p) => {
    const full = path.join(CWD, p);
    return fs.existsSync(full);
  });
  if (addPaths.length === 0) return { ok: false, reason: "nochange" };
  try {
    addPaths.forEach((p) => execSync(`git add -f "${p}"`, { cwd: CWD, stdio: "pipe" }));
    const status = execSync("git status --porcelain", { cwd: CWD, encoding: "utf8" }).trim();
    if (!status) return { ok: false, reason: "nochange" };
    execSync("git", ["commit", "-m", message], { cwd: CWD, stdio: "inherit" });
    execSync("git push", { cwd: CWD, stdio: "inherit" });
    try {
      if (fs.existsSync(REMINDER_PATH)) fs.unlinkSync(REMINDER_PATH);
    } catch {}
    return { ok: true };
  } catch (e) {
    const isNetwork =
      e.message?.includes("Could not resolve host") ||
      e.message?.includes("Connection refused") ||
      e.message?.includes("fetch failed") ||
      e.message?.includes("ECONNREFUSED") ||
      e.message?.includes("ENOTFOUND") ||
      e.message?.includes("ETIMEDOUT") ||
      (e.stderr && String(e.stderr).toLowerCase().includes("network"));
    console.error("Git 推送失败:", e.message);
    if (isNetwork) {
      writeReminder("部署因网络连接失败未完成。");
      console.log("\n⚠ 检测到网络问题，已写入 .deploy-reminder.txt");
      console.log("  联网后任务会自动重试（每 15 分钟，最多 5 次）");
      console.log("  或手动运行: npm run deploy:auto\n");
      process.exit(1);
    }
    return { ok: false, reason: "error" };
  }
}

function main() {
  console.log("\n==== 统一自动部署（EN + ZH）====\n");

  const state = loadState();
  const now = new Date();
  const lastDeploy = state.zh.lastDeployDate ? new Date(state.zh.lastDeployDate) : null;
  const daysSince = lastDeploy ? (now - lastDeploy) / (1000 * 60 * 60 * 24) : 999;

  // 检查间隔
  if (daysSince < BATCH_INTERVAL_DAYS && state.zh.lastPublished > 0) {
    console.log(`距上次部署仅 ${daysSince.toFixed(1)} 天，需等待 ${(BATCH_INTERVAL_DAYS - daysSince).toFixed(1)} 天后再部署`);
    console.log(`下次建议时间: ${lastDeploy ? new Date(lastDeploy.getTime() + BATCH_INTERVAL_DAYS * 86400000).toLocaleDateString() : "-"}`);
    process.exit(0);
    return;
  }

  let zhPublished = 0;
  let zhTotal = 0;
  let hasZh = false;

  // ZH 逻辑
  if (fs.existsSync(ZH_CACHE_PATH)) {
    hasZh = true;
    const { total, entries, cache } = getZhStats();
    zhTotal = total;
    zhPublished = state.zh.lastPublished;

    if (total >= ZH_BATCH_SIZE) {
      const nextLimit = Math.min(state.zh.lastPublished + ZH_BATCH_SIZE, total);
      if (nextLimit > state.zh.lastPublished) {
        const issues = validateZhLocal(entries, nextLimit);
        if (issues.length > 0) {
          console.log("⚠ 中文本地检测发现问题，本次不部署：");
          issues.slice(0, 5).forEach((i) => console.log(`  - ${i}`));
          if (issues.length > 5) console.log(`  ... 共 ${issues.length} 个问题`);
          process.exit(1);
          return;
        }
        console.log("✓ 中文本地检测通过");
        console.log(`执行中文发布: 前 ${nextLimit} 页（本批 +${nextLimit - state.zh.lastPublished}）`);
        runZhPublish(cache, nextLimit);
        state.zh.lastPublished = nextLimit;
        state.zh.batchNumber = (state.zh.batchNumber || 0) + 1;
      } else {
        console.log("✓ 中文全部页面已发布，无需新增");
      }
    } else {
      console.log(`中文内容不足 ${ZH_BATCH_SIZE} 页（当前 ${total} 页），跳过中文发布`);
    }
  } else {
    console.log("未找到 data/zh-seo.json，跳过中文发布");
  }

  // EN 逻辑（本次一并部署，无分批发布）
  const enStats = getEnStats();
  if (enStats.hasCore) {
    console.log(`✓ 英文核心页配置存在（${enStats.coreUrlsCount} 个 URL）`);
  } else {
    console.log("未找到 data/core-pages-en.json，英文使用默认配置");
  }

  state.zh.lastDeployDate = now.toISOString();
  state.en.lastDeployDate = now.toISOString();
  saveState(state);

  const msg = hasZh
    ? `deploy: ${state.zh.lastPublished} zh pages (batch ${state.zh.batchNumber}) + en`
    : "deploy: en + config";
  console.log("\n执行 Git 提交与推送...");
  const result = runGit(msg);

  if (result.ok) {
    console.log(`\n✓ 统一部署完成`);
    if (hasZh) console.log(`  中文: ${state.zh.lastPublished} 页已发布`);
    console.log(`  英文: 已纳入本次推送`);
  } else if (result.reason === "nochange") {
    console.log("\n✓ 本地已更新，Git 推送未执行（无变更）");
  } else {
    console.log("\n⚠ Git 推送未成功，请检查网络后手动运行: npm run deploy:auto");
  }
  console.log(`下次自动部署时间: ${new Date(now.getTime() + BATCH_INTERVAL_DAYS * 86400000).toLocaleDateString()}\n`);
}

main();
