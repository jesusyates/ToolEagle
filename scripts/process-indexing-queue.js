#!/usr/bin/env node
/**
 * V106: Drain indexing queue via Google Indexing API (batch, non-interactive).
 * Run on a schedule (e.g. hourly). Respects --max per invocation (default 15).
 *
 * Env: GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY (same as /api/indexing)
 */

require("dotenv").config();

const { google } = require("googleapis");
const { dequeueBatch, recordSubmission, peekPendingCount } = require("./lib/indexing-queue");

function parseArgs() {
  const argv = process.argv.slice(2);
  let max = 15;
  for (const a of argv) {
    if (a.startsWith("--max=")) max = Math.max(1, parseInt(a.slice("--max=".length), 10) || 15);
  }
  return { max };
}

async function submitUrl(url) {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return { ok: false, error: "GSC credentials not configured" };
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/indexing"]
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const accessToken = token.token;
  if (!accessToken) {
    return { ok: false, error: "Failed to get access token" };
  }

  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ url, type: "URL_UPDATED" })
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: errText || `HTTP ${res.status}` };
  }
  return { ok: true };
}

async function main() {
  const { max } = parseArgs();
  const before = peekPendingCount();
  const batch = dequeueBatch(max);
  console.log(`[indexing-queue] pending_before=${before} batch=${batch.length} max=${max}`);

  let ok = 0;
  let fail = 0;

  for (const item of batch) {
    const url = item?.url;
    if (!url) continue;
    const r = await submitUrl(url);
    if (r.ok) {
      ok++;
      recordSubmission({ url, source: item.source || "queue", ok: true });
    } else {
      fail++;
      recordSubmission({ url, source: item.source || "queue", ok: false, error: r.error });
    }
  }

  const after = peekPendingCount();
  console.log(`[indexing-queue] done ok=${ok} fail=${fail} pending_after=${after}`);
}

main().catch((e) => {
  console.error("[indexing-queue] fatal", e);
  process.exit(1);
});
