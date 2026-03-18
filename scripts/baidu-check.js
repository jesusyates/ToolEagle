/**
 * 百度 API 健康检测
 * 检查百度推送接口是否正常
 *
 * 运行：BAIDU_TOKEN=xxx node scripts/baidu-check.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tooleagle.com";
const TOKEN = process.env.BAIDU_TOKEN;

async function check() {
  if (!TOKEN) {
    console.log("未设置 BAIDU_TOKEN，跳过检测");
    process.exit(0);
    return;
  }

  const api = `http://data.zz.baidu.com/urls?site=${new URL(BASE_URL).hostname}&token=${TOKEN}`;

  try {
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: BASE_URL
    });
    const data = await res.json();

    if (data.error) {
      console.error("❌ 百度异常:", data.message || data.error);
      process.exit(1);
    }

    console.log("✓ 百度 API 正常");
  } catch (e) {
    console.error("❌ 百度请求失败:", e.message);
    process.exit(1);
  }
}

check();
