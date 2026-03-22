/**
 * V101 — Generic aggregator adapter (swap provider without UI changes).
 *
 * Create: POST `${AGGREGATOR_BASE_URL}${AGGREGATOR_CREATE_PATH}` with JSON body;
 * expects JSON response containing qr URL / pay URL in common field names (see extractPaymentSurface).
 *
 * Callback: raw body HMAC-SHA256 with AGGREGATOR_WEBHOOK_SECRET, header `x-aggregator-signature` (hex).
 * JSON body: { merchant_order_id | out_trade_no | order_id, status | trade_status }.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "@/config/site";

export type AggregatorCreateInput = {
  /** Our public order id (sent as merchant reference) */
  merchantOrderId: string;
  amountCny: number;
  subject: string;
};

export type AggregatorCreateResult = {
  paymentQrUrl: string | null;
  paymentUrl: string | null;
  providerOrderRef: string | null;
  rawResponse: unknown;
};

function baseUrl(): string {
  return (process.env.AGGREGATOR_BASE_URL || "").trim().replace(/\/+$/, "");
}

function apiKey(): string {
  return (process.env.AGGREGATOR_API_KEY || "").trim();
}

function createPath(): string {
  const p = (process.env.AGGREGATOR_CREATE_PATH || "/pay/create").trim();
  return p.startsWith("/") ? p : `/${p}`;
}

/** Public URL aggregator will POST to when payment completes. */
export function resolveNotifyUrl(): string {
  const explicit = (process.env.AGGREGATOR_NOTIFY_URL || "").trim();
  if (explicit) return explicit;
  return `${SITE_URL.replace(/\/+$/, "")}/api/payment/callback`;
}

function extractPaymentSurface(data: Record<string, unknown>): {
  qr: string | null;
  url: string | null;
  ref: string | null;
} {
  const dig = (obj: unknown, keys: string[]): string | null => {
    if (!obj || typeof obj !== "object") return null;
    const o = obj as Record<string, unknown>;
    for (const k of keys) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };

  const dataLayer = data.data && typeof data.data === "object" ? (data.data as Record<string, unknown>) : null;

  const qr =
    dig(data, ["qr_url", "qrUrl", "code_url", "codeUrl", "qr_code_url", "weixin_url"]) ||
    (dataLayer ? dig(dataLayer, ["qr_url", "qrUrl", "code_url", "codeUrl"]) : null);

  const url =
    dig(data, ["pay_url", "payUrl", "h5_url", "h5Url", "mweb_url", "payment_url"]) ||
    (dataLayer ? dig(dataLayer, ["pay_url", "payUrl", "h5_url"]) : null);

  const ref =
    dig(data, ["trade_no", "transaction_id", "provider_order_id", "prepay_id"]) ||
    (dataLayer ? dig(dataLayer, ["trade_no", "transaction_id"]) : null);

  return { qr, url, ref };
}

export async function aggregatorCreatePayment(input: AggregatorCreateInput): Promise<AggregatorCreateResult> {
  const url = `${baseUrl()}${createPath()}`;
  const key = apiKey();
  if (!url || url === createPath() || !key) {
    throw new Error("aggregator_not_configured");
  }

  const notifyUrl = resolveNotifyUrl();
  const body = {
    merchant_order_id: input.merchantOrderId,
    out_trade_no: input.merchantOrderId,
    amount: input.amountCny,
    amount_cny: input.amountCny,
    currency: "CNY",
    notify_url: notifyUrl,
    subject: input.subject
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Api-Key": key
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* non-json */
  }

  if (!res.ok) {
    throw new Error(`aggregator_http_${res.status}:${text.slice(0, 200)}`);
  }

  const { qr, url: payUrl, ref } = extractPaymentSurface(data);
  return {
    paymentQrUrl: qr,
    paymentUrl: payUrl,
    providerOrderRef: ref,
    rawResponse: data
  };
}

export type CallbackParseResult = {
  merchantOrderId: string | null;
  paid: boolean;
};

function parseJsonOrForm(raw: string, contentType: string): Record<string, string> {
  const lower = contentType.toLowerCase();
  if (lower.includes("application/json")) {
    try {
      const j = JSON.parse(raw) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(j)) {
        if (v === null || v === undefined) continue;
        out[k] = typeof v === "string" ? v : String(v);
      }
      return out;
    } catch {
      return {};
    }
  }
  const params = new URLSearchParams(raw);
  const o: Record<string, string> = {};
  params.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}

export function parseAggregatorCallbackBody(raw: string, contentType: string): CallbackParseResult {
  const trimmed = raw.trim();
  const effectiveType =
    trimmed.startsWith("{") || trimmed.startsWith("[") ? "application/json" : contentType;
  const p = parseJsonOrForm(raw, effectiveType);
  const merchantOrderId =
    p.merchant_order_id ||
    p.out_trade_no ||
    p.order_id ||
    p.outTradeNo ||
    p.merchantOrderId ||
    null;

  const status =
    (p.trade_status || p.status || p.tradeStatus || "").toLowerCase();
  const paid =
    status === "success" ||
    status === "paid" ||
    status === "complete" ||
    p.result_code === "SUCCESS" ||
    p.return_code === "SUCCESS";

  return { merchantOrderId, paid: paid && Boolean(merchantOrderId) };
}

export function verifyAggregatorSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = (process.env.AGGREGATOR_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    // Without secret, reject callbacks in production; allow only when explicitly dev
    return process.env.AGGREGATOR_ALLOW_UNSIGNED_CALLBACK === "1";
  }
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  try {
    const a = Buffer.from(signatureHeader.trim(), "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
