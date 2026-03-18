/**
 * 百度站长平台 - 站点提交脚本
 * 用于主动推送 sitemap URL 到百度，加速收录
 *
 * 使用前提：
 * 1. 在 https://ziyuan.baidu.com/ 添加站点
 * 2. 完成 HTML 标签验证（meta baidu-site-verification）
 * 3. 在「普通收录」→「API 提交」中获取 token
 *
 * 运行：npm run baidu:submit
 * 或在 .env.local 中设置 BAIDU_TOKEN
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tooleagle.com";
const TOKEN = process.env.BAIDU_TOKEN;

const SITEMAPS = [
  `${BASE_URL}/sitemap.xml`,
  `${BASE_URL}/sitemap-zh.xml`,
  `${BASE_URL}/baidu-sitemap.xml`
];

async function submit(urls) {
  const api = `http://data.zz.baidu.com/urls?site=${new URL(BASE_URL).hostname}&token=${TOKEN}`;
  const res = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: urls.join("\n")
  });
  const data = await res.json();
  return data;
}

async function main() {
  if (!TOKEN) {
    console.error("请设置 BAIDU_TOKEN 环境变量");
    console.error("获取方式：百度站长平台 → 普通收录 → API 提交");
    process.exit(1);
  }

  console.log("提交 sitemap 到百度...");
  const result = await submit(SITEMAPS);
  console.log("结果:", JSON.stringify(result, null, 2));

  if (result.error) {
    console.error("提交失败:", result.message);
    process.exit(1);
  }

  console.log("提交成功");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
