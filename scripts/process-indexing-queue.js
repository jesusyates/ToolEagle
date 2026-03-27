#!/usr/bin/env node
/**
 * V106: Drain indexing queue via Google Indexing API (batch, non-interactive).
 * Run on a schedule (e.g. hourly). Respects --max per invocation (default 15).
 *
 * Env: GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY (same as /api/indexing)
 */

require("dotenv").config();

const crypto = require("crypto");
const { fetch, ProxyAgent } = require("undici");
const { dequeueBatch, recordSubmission, peekPendingCount } = require("./lib/indexing-queue");

function loadEnvLocal() {
  try {
    const dotenv = require("dotenv");
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return {};
    return dotenv.parse(fs.readFileSync(envPath, "utf8")) || {};
  } catch {
    return {};
  }
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let max = 15;
  for (const a of argv) {
    if (a.startsWith("--max=")) max = Math.max(1, parseInt(a.slice("--max=".length), 10) || 15);
  }
  return { max };
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getProxyDispatcher() {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || "";
  if (!proxy) return undefined;
  if (proxy.startsWith("http://") || proxy.startsWith("https://")) {
    try {
      return new ProxyAgent(proxy);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function getIndexingAccessToken() {
  const env = loadEnvLocal();
  const clientEmail = env.GSC_CLIENT_EMAIL || process.env.GSC_CLIENT_EMAIL;
  const privateKey = (() => {
    const raw = env.GSC_PRIVATE_KEY || process.env.GSC_PRIVATE_KEY;
    if (!raw) return raw;
    let v = String(raw).trim();
    v = v.replace(/^"+/, "").replace(/"+\s*,?$/, "");
    return v.replace(/\\n/g, "\n");
  })();

  if (!clientEmail || !privateKey) {
    throw new Error("GSC credentials not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const keyObj = crypto.createPrivateKey({ key: privateKey, format: "pem" });
  const sig = crypto.sign("RSA-SHA256", Buffer.from(unsigned), keyObj);
  const assertion = `${unsigned}.${base64url(sig)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    dispatcher: getProxyDispatcher(),
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }).toString()
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenJson?.access_token) {
    const msg = tokenJson?.error_description || tokenJson?.error || `token_http_${tokenRes.status}`;
    throw new Error(`Failed to get access token: ${msg}`);
  }
  return tokenJson.access_token;
}

async function submitUrl(url, accessToken) {
  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    dispatcher: getProxyDispatcher(),
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
  let accessToken = null;
  if (batch.length > 0) {
    accessToken = await getIndexingAccessToken();
  }

  for (const item of batch) {
    const url = item?.url;
    if (!url) continue;
    const r = await submitUrl(url, accessToken);
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
