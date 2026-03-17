/**
 * OpenAI API fetch with custom base URL, timeout, retry.
 * Use OPENAI_BASE_URL in .env.local for proxy (e.g. China).
 * Use HTTPS_PROXY for VPN proxy - Node 默认 connectTimeout 10s 太短，用 undici 延长。
 */

const FETCH_TIMEOUT_MS = 60000; // 60s - OpenAI 生成 4000 token 需较长时间
const CONNECT_TIMEOUT_MS = 30000; // 30s - 代理连接建立
const RETRY_COUNT = 3;

let undiciFetch;
let undiciDispatcher;
function getFetch() {
  if (!undiciFetch) {
    try {
      const undici = require("undici");
      undiciFetch = undici.fetch;
      const { Agent, ProxyAgent } = undici;
      const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      // buildConnector uses timeout (default 10s); proxyTls/requestTls pass through
      const timeoutOpts = {
        proxyTls: { timeout: CONNECT_TIMEOUT_MS },
        requestTls: { timeout: CONNECT_TIMEOUT_MS }
      };
      undiciDispatcher = proxy
        ? new ProxyAgent({ uri: proxy, ...timeoutOpts })
        : new Agent({ connectTimeout: CONNECT_TIMEOUT_MS });
    } catch {
      undiciFetch = globalThis.fetch;
      undiciDispatcher = null;
    }
  }
  return { fetch: undiciFetch, dispatcher: undiciDispatcher };
}

function getBaseUrl() {
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  return base.replace(/\/$/, "");
}

function getModel() {
  if (process.env.OPENAI_MODEL) return process.env.OPENAI_MODEL;
  const base = getBaseUrl();
  return base.includes("deepseek") ? "deepseek-chat" : "gpt-4o-mini";
}

async function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const { fetch: doFetch, dispatcher } = getFetch();
  const fetchOptions = {
    ...options,
    signal: controller.signal,
    ...(dispatcher && { dispatcher })
  };
  try {
    const res = await doFetch(url, fetchOptions);
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function openaiChatCompletions(body, apiKey) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/chat/completions`;
  let lastError;

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify(body)
        },
        FETCH_TIMEOUT_MS
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = data?.error?.message || data?.message || `HTTP ${response.status}`;
        console.error("OpenAI error:", errMsg);
        throw new Error(`OpenAI API error: ${response.status} - ${errMsg}`);
      }

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty response from OpenAI");
      return content;
    } catch (e) {
      lastError = e;
      const cause = e.cause ? ` (cause: ${e.cause?.message || e.cause})` : "";
      console.error("OpenAI error:", e.message + cause);
      if (attempt < RETRY_COUNT) {
        const delay = attempt * 1000;
        console.error(`Retry ${attempt}/${RETRY_COUNT} in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

module.exports = { openaiChatCompletions, getBaseUrl, getModel };
