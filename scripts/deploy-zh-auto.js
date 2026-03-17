/**
 * v59.3 全自动分批部署 - 检测、发布、上传一气呵成
 * Run: npm run zh:deploy-auto
 *
 * 逻辑：
 * - 先检测本地：deploy:prep 验证，有问题则不部署
 * - 自动检测当前状态
 * - 若距上次部署已过 3 天（或从未部署），则发布下一批
 * - 自动 git add / commit / push
 * - 计划任务：每 3 天晚上 21:00 执行
 */

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const CWD = process.cwd();
const CACHE_PATH = path.join(CWD, "data", "zh-seo.json");
const STATE_PATH = path.join(CWD, ".zh-deploy-state.json");
const BATCH_INTERVAL_DAYS = 3;
const BATCH_SIZE = 30;

function loadJson(p, defaultVal) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return defaultVal;
  }
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function loadState() {
  return loadJson(STATE_PATH, { lastPublished: 0, lastDeployDate: null, batchNumber: 0 });
}

function saveState(state) {
  saveJson(STATE_PATH, state);
}

function getStats() {
  const cache = loadJson(CACHE_PATH, {});
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
  let published = 0;
  for (const { data } of entries) {
    if (data.published === true) published++;
  }
  return { total: entries.length, entries, cache };
}

function runPublish(cache, limit) {
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
  saveJson(CACHE_PATH, cache);
}

function validateLocal(entries, limit) {
  const REQUIRED = ["intro", "guide", "stepByStep", "faq"];
  const MIN_LEN = 800;
  const issues = [];
  for (let i = 0; i < Math.min(limit, entries.length); i++) {
    const { pageType, topic, data } = entries[i];
    const text = [data.intro, data.guide, data.stepByStep, data.faq].filter(Boolean).join("");
    if (!data.intro || !data.guide) issues.push(`${pageType}/${topic}: 缺少 intro/guide`);
    else if (text.length < MIN_LEN) issues.push(`${pageType}/${topic}: 内容过短`);
    else if (REQUIRED.some((f) => !data[f]?.trim())) issues.push(`${pageType}/${topic}: 缺少必填字段`);
  }
  return issues;
}

function runGit(message) {
  try {
    execSync("git add -f data/zh-seo.json .zh-deploy-state.json", { cwd: CWD, stdio: "pipe" });
    const status = execSync("git status --porcelain", { cwd: CWD, encoding: "utf8" }).trim();
    if (!status) return false;
    execSync("git", ["commit", "-m", message], { cwd: CWD, stdio: "inherit" });
    execSync("git push", { cwd: CWD, stdio: "inherit" });
    return true;
  } catch (e) {
    if (e.status === 1 && e.stderr && e.stderr.includes("nothing to commit")) return false;
    console.error("Git 操作失败:", e.message);
    return false;
  }
}

function main() {
  console.log("\n==== 自动部署检测 ====\n");

  if (!fs.existsSync(CACHE_PATH)) {
    console.log("未找到 data/zh-seo.json，请先运行: npm run zh:generate");
    process.exit(0);
    return;
  }

  const { total, entries, cache } = getStats();
  const state = loadState();

  if (total < BATCH_SIZE) {
    console.log(`内容不足 ${BATCH_SIZE} 页（当前 ${total} 页），请先运行: npm run zh:generate`);
    process.exit(0);
    return;
  }

  const now = new Date();
  const lastDate = state.lastDeployDate ? new Date(state.lastDeployDate) : null;
  const daysSince = lastDate ? (now - lastDate) / (1000 * 60 * 60 * 24) : 999;

  if (daysSince < BATCH_INTERVAL_DAYS && state.lastPublished > 0) {
    console.log(`距上次部署仅 ${daysSince.toFixed(1)} 天，需等待 ${(BATCH_INTERVAL_DAYS - daysSince).toFixed(1)} 天后再部署`);
    console.log(`下次建议时间: ${new Date(lastDate.getTime() + BATCH_INTERVAL_DAYS * 86400000).toLocaleDateString()}`);
    process.exit(0);
    return;
  }

  const nextLimit = Math.min(state.lastPublished + BATCH_SIZE, total);
  if (nextLimit <= state.lastPublished) {
    console.log("全部页面已发布，无需部署");
    process.exit(0);
    return;
  }

  const issues = validateLocal(entries, nextLimit);
  if (issues.length > 0) {
    console.log("⚠ 本地检测发现问题，本次不部署：");
    issues.slice(0, 5).forEach((i) => console.log(`  - ${i}`));
    if (issues.length > 5) console.log(`  ... 共 ${issues.length} 个问题`);
    process.exit(1);
    return;
  }

  console.log("✓ 本地检测通过，无问题");
  console.log(`执行发布: 前 ${nextLimit} 页`);
  runPublish(cache, nextLimit);
  const batchNum = state.batchNumber + 1;
  saveState({
    lastPublished: nextLimit,
    lastDeployDate: now.toISOString(),
    batchNumber: batchNum
  });

  const msg = `publish ${nextLimit} zh pages (auto batch ${batchNum})`;
  console.log(`\n执行 Git 提交与推送...`);
  const pushed = runGit(msg);

  if (pushed) {
    console.log(`\n✓ 自动部署完成: ${nextLimit} 页已发布并推送`);
  } else {
    console.log(`\n✓ 本地已更新，Git 推送未执行（可能无变更或需手动 push）`);
  }
  console.log(`下次自动部署时间: ${new Date(now.getTime() + BATCH_INTERVAL_DAYS * 86400000).toLocaleDateString()}\n`);
}

main();
