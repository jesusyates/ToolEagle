/**
 * v60.2 Deploy Prep - Validate before deploying (EN + ZH).
 * Run: npm run deploy:prep
 *
 * ZH: Counts published pages, validates no empty content, no missing sections
 * EN: Checks core-pages-en.json exists and has valid structure
 */

const path = require("path");
const fs = require("fs");

const ZH_CACHE_PATH = path.join(process.cwd(), "data", "zh-seo.json");
const EN_CORE_PATH = path.join(process.cwd(), "data", "core-pages-en.json");

const REQUIRED_FIELDS = ["intro", "guide", "stepByStep", "faq"];
const MIN_CONTENT_LENGTH = 800;

function loadJson(p, defaultVal) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return defaultVal;
  }
}

function main() {
  console.log("\n========== DEPLOY PREP (EN + ZH) ==========\n");

  // ----- ZH -----
  if (fs.existsSync(ZH_CACHE_PATH)) {
    const cache = loadJson(ZH_CACHE_PATH, {});
    let published = 0;
    let total = 0;
    const issues = [];

    for (const [pageType, topics] of Object.entries(cache)) {
      if (typeof topics !== "object" || topics === null) continue;
      for (const [topic, data] of Object.entries(topics)) {
        if (typeof data !== "object" || data === null) continue;
        total++;
        if (data.published === true) published++;

        const text = [data.intro, data.guide, data.stepByStep, data.faq]
          .filter(Boolean)
          .join("");
        const hasEmpty = !data.intro || !data.guide;
        const tooShort = text.length < MIN_CONTENT_LENGTH;
        const missingSections = REQUIRED_FIELDS.filter((f) => !data[f]?.trim()).length;

        if (data.published && (hasEmpty || tooShort || missingSections > 0)) {
          issues.push(`ZH ${pageType}/${topic}: ${hasEmpty ? "empty intro/guide " : ""}${tooShort ? "content<800chars " : ""}${missingSections > 0 ? `missing ${missingSections} sections` : ""}`);
        }
      }
    }

    console.log("【中文 ZH】");
    console.log(`  Total pages: ${total}`);
    console.log(`  Published: ${published}`);
    if (issues.length > 0) {
      console.log(`  ⚠ Issues: ${issues.length}`);
      issues.slice(0, 5).forEach((i) => console.log(`    - ${i}`));
    } else {
      console.log("  ✓ No validation issues");
    }
    console.log("");
  } else {
    console.log("【中文 ZH】未找到 data/zh-seo.json\n");
  }

  // ----- EN -----
  if (fs.existsSync(EN_CORE_PATH)) {
    const core = loadJson(EN_CORE_PATH, {});
    const popular = (core.popularGuides || []).length;
    const allUrls = (core.allCoreUrls || []).length;
    const hasBest = core.bestGuidesByPlatform && Object.keys(core.bestGuidesByPlatform).length > 0;

    console.log("【英文 EN】");
    console.log(`  Core URLs: ${allUrls}`);
    console.log(`  Popular guides: ${popular}`);
    console.log(`  Best by platform: ${hasBest ? "✓" : "⚠"}`);
    console.log("  ✓ Config valid\n");
  } else {
    console.log("【英文 EN】未找到 data/core-pages-en.json（使用 src/config 默认配置）\n");
  }

  console.log("==========================================\n");
}

main();
