/**
 * v59.2 Deploy reminder - Show next steps after stats.
 */
const path = require("path");
const fs = require("fs");

const CACHE_PATH = path.join(process.cwd(), "data", "zh-seo.json");

let total = 0;
let published = 0;
try {
  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  for (const [pageType, topics] of Object.entries(cache)) {
    if (typeof topics !== "object") continue;
    for (const [topic, data] of Object.entries(topics)) {
      if (typeof data !== "object") continue;
      total++;
      if (data.published === true) published++;
    }
  }
} catch {}

console.log("\n========== 部署提醒 ==========");
if (total < 30) {
  console.log("⚠ 内容不足 30 页，请先运行: npm run zh:generate");
  console.log("   生成完成后再执行首次发布。");
} else if (published === 0) {
  console.log("📌 你必须现在执行首次发布：");
  console.log("   npm run zh:publish -- --limit=30");
  console.log("   npm run deploy:prep");
  console.log("   git add . && git commit -m \"publish 30 zh pages (batch 1)\" && git push");
} else if (published < total) {
  const next = Math.min(published + 30, total);
  console.log(`📌 下一批建议 (3-5 天后执行)：`);
  console.log(`   npm run zh:publish -- --limit=${next}`);
  console.log("   npm run deploy:prep");
  console.log(`   git add . && git commit -m "publish ${next} zh pages (batch N)" && git push`);
} else {
  console.log("✓ 全部页面已发布。");
}
console.log("==============================\n");
