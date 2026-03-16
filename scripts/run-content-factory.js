/**
 * v46 AI Content Factory - manual run
 * Usage: node scripts/run-content-factory.js [captions] [hooks] [ideas] [prompts]
 * Example: node scripts/run-content-factory.js 50 20 20 10
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

async function run() {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET;

  const [captions = 50, hooks = 20, ideas = 20, prompts = 10] = process.argv
    .slice(2)
    .map(Number);

  const config = { captions, hooks, ideas, prompts };

  const res = await fetch(`${base}/api/generate-content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cronSecret}`
    },
    body: JSON.stringify({ config })
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  process.exit(res.ok ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
