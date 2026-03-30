/**
 * V180.1 — Order-time revenue attribution (provider_payload) + shared keys for callback / rollup.
 */

export type V180AttributionConfidence = "exact" | "inferred" | "fallback";
export type V180AttributionSource = "order_payload" | "callback_payload" | "return_url" | "page_inference";

export type AnonymousOrUser = "anonymous" | "user" | "unknown";

export type V180AttributionFields = {
  source_path: string;
  source_type: string;
  page_type: string;
  tool_slug: string | null;
  referrer_path: string | null;
  market: string;
  plan: string;
  anonymous_or_user: AnonymousOrUser;
  attribution_confidence: V180AttributionConfidence;
  attribution_source: V180AttributionSource;
  /** Same key set as create_order / callback / activation rollups */
  attribution_key: {
    order_id: string;
    source_path: string;
    tool_slug: string | null;
    page_type: string;
  };
  v180_attribution_version: "180.1";
};

export function normalizePathname(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "/";
  const trimmed = input.trim();
  if (!trimmed) return "/";
  try {
    const u = trimmed.startsWith("http") ? new URL(trimmed) : new URL(trimmed, "https://placeholder.local");
    let p = u.pathname || "/";
    if (!p.startsWith("/")) p = `/${p}`;
    const collapsed = p.replace(/\/+/g, "/");
    if (collapsed.length > 1 && collapsed.endsWith("/")) return collapsed.slice(0, -1) || "/";
    return collapsed || "/";
  } catch {
    if (!trimmed.startsWith("/")) return `/${trimmed}`.replace(/\/+/g, "/");
    return trimmed.replace(/\/+/g, "/");
  }
}

function parseReferrerPath(ref: string | null | undefined): string | null {
  if (!ref || typeof ref !== "string") return null;
  try {
    const u = new URL(ref);
    return u.pathname || null;
  } catch {
    return null;
  }
}

function parseReturnPathFromPayload(returnUrl: string | null | undefined): string | null {
  if (!returnUrl || typeof returnUrl !== "string") return null;
  try {
    const x = new URL(returnUrl, "https://placeholder.local");
    return x.pathname || null;
  } catch {
    return null;
  }
}

export function inferPageTypeFromPath(p: string): string {
  if (!p || p === "/") return "home";
  if (p.startsWith("/zh/pricing") || p === "/pricing" || p.startsWith("/pricing")) return "pricing";
  if (p.startsWith("/zh/tools/") || p.startsWith("/tools/")) return "tool";
  if (p.startsWith("/blog/") || p.startsWith("/zh/blog/")) return "blog";
  if (p.startsWith("/answers/")) return "answer";
  return "other";
}

export function inferToolSlugFromPath(p: string): string | null {
  const m = p.match(/^\/(?:zh\/)?tools\/([^/]+)/);
  return m ? m[1] : null;
}

export function buildV180AttributionForCreateOrder(input: {
  body: Record<string, unknown>;
  refererHeader: string | null;
  orderPublicId: string;
  market: string;
  plan: string;
  anonymousOrUser: AnonymousOrUser;
  returnUrl: string | null;
}): V180AttributionFields {
  const { body, refererHeader, orderPublicId, market, plan, anonymousOrUser, returnUrl } = input;

  const explicitPath =
    typeof body.source_path === "string" && body.source_path.trim()
      ? normalizePathname(body.source_path)
      : null;
  const explicitPageType = typeof body.page_type === "string" ? body.page_type : null;
  const explicitTool =
    typeof body.tool_slug === "string" && body.tool_slug.trim() ? String(body.tool_slug).trim() : null;
  const sourceType =
    typeof body.source_type === "string" && body.source_type.trim()
      ? String(body.source_type).trim()
      : "client";

  const referrerFromBody =
    typeof body.referrer_path === "string" && body.referrer_path.trim()
      ? normalizePathname(body.referrer_path)
      : null;
  const referrerPath = referrerFromBody ?? parseReferrerPath(refererHeader);

  let sourcePath: string;
  let pageType: string;
  let toolSlug: string | null;
  let confidence: V180AttributionConfidence;
  let source: V180AttributionSource;

  if (explicitPath) {
    sourcePath = explicitPath;
    pageType = explicitPageType || inferPageTypeFromPath(explicitPath);
    toolSlug = explicitTool ?? inferToolSlugFromPath(explicitPath);
    confidence = "exact";
    source = "order_payload";
  } else {
    const refOnly = referrerPath ? normalizePathname(referrerPath) : null;
    if (refOnly && refOnly !== "/") {
      sourcePath = refOnly;
      pageType = inferPageTypeFromPath(refOnly);
      toolSlug = inferToolSlugFromPath(refOnly);
      confidence = "inferred";
      source = "page_inference";
    } else {
      const fromReturn = parseReturnPathFromPayload(returnUrl);
      if (fromReturn && fromReturn !== "/") {
        sourcePath = normalizePathname(fromReturn);
        pageType = inferPageTypeFromPath(sourcePath);
        toolSlug = inferToolSlugFromPath(sourcePath);
        confidence = "inferred";
        source = "return_url";
      } else {
        sourcePath = market === "cn" ? "/zh/pricing" : "/pricing";
        pageType = "pricing";
        toolSlug = null;
        confidence = "fallback";
        source = "return_url";
      }
    }
  }

  const attributionKey = {
    order_id: orderPublicId,
    source_path: sourcePath,
    tool_slug: toolSlug,
    page_type: pageType
  };

  return {
    source_path: sourcePath,
    source_type: sourceType,
    page_type: pageType,
    tool_slug: toolSlug,
    referrer_path: referrerPath,
    market,
    plan,
    anonymous_or_user: anonymousOrUser,
    attribution_confidence: confidence,
    attribution_source: source,
    attribution_key: attributionKey,
    v180_attribution_version: "180.1"
  };
}

/** Flatten for orders.provider_payload (top-level keys + nested attribution_key). */
export function v180AttributionToProviderPayloadPatch(
  fields: V180AttributionFields
): Record<string, unknown> {
  return {
    source_path: fields.source_path,
    source_type: fields.source_type,
    page_type: fields.page_type,
    tool_slug: fields.tool_slug,
    referrer_path: fields.referrer_path,
    market: fields.market,
    plan: fields.plan,
    anonymous_or_user: fields.anonymous_or_user,
    attribution_confidence: fields.attribution_confidence,
    attribution_source: fields.attribution_source,
    attribution_key: fields.attribution_key,
    v180_attribution_version: fields.v180_attribution_version
  };
}

export function mergeProviderPayload(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  return { ...base, ...patch };
}

/** Read V180 fields from stored provider_payload (supports legacy orders without V180 keys). */
export function extractV180AttributionFromProviderPayload(
  payload: Record<string, unknown> | null | undefined,
  fallback: { order_id: string; market: string; plan: string; anonymous_or_user: AnonymousOrUser }
): {
  source_path: string;
  source_type: string;
  page_type: string;
  tool_slug: string | null;
  referrer_path: string | null;
  market: string;
  plan: string;
  anonymous_or_user: string;
  attribution_confidence: V180AttributionConfidence;
  attribution_source: V180AttributionSource;
  attribution_key: { order_id: string; source_path: string; tool_slug: string | null; page_type: string };
} {
  const p = payload && typeof payload === "object" ? payload : {};
  const nested =
    p.attribution_key && typeof p.attribution_key === "object"
      ? (p.attribution_key as Record<string, unknown>)
      : null;

  if (typeof p.source_path === "string" && p.source_path.trim()) {
    const sourcePath = normalizePathname(p.source_path);
    const pageType =
      typeof p.page_type === "string" ? p.page_type : inferPageTypeFromPath(sourcePath);
    const toolSlug =
      p.tool_slug === null || typeof p.tool_slug === "string"
        ? (p.tool_slug as string | null)
        : inferToolSlugFromPath(sourcePath);
    const conf = (p.attribution_confidence as V180AttributionConfidence) || "exact";
    const src = (p.attribution_source as V180AttributionSource) || "order_payload";
    const sourceType = typeof p.source_type === "string" ? p.source_type : "unknown";
    return {
      source_path: sourcePath,
      source_type: sourceType,
      page_type: pageType,
      tool_slug: toolSlug ?? inferToolSlugFromPath(sourcePath),
      referrer_path: typeof p.referrer_path === "string" ? p.referrer_path : null,
      market: typeof p.market === "string" ? p.market : fallback.market,
      plan: typeof p.plan === "string" ? p.plan : fallback.plan,
      anonymous_or_user:
        typeof p.anonymous_or_user === "string" ? p.anonymous_or_user : fallback.anonymous_or_user,
      attribution_confidence: conf,
      attribution_source: src,
      attribution_key: {
        order_id: (nested?.order_id as string) || fallback.order_id,
        source_path: (nested?.source_path as string) || sourcePath,
        tool_slug: (nested?.tool_slug as string | null) ?? toolSlug ?? inferToolSlugFromPath(sourcePath),
        page_type: (nested?.page_type as string) || pageType
      }
    };
  }

  const fromReturn = parseReturnPathFromPayload(
    typeof p.return_url === "string" ? p.return_url : undefined
  );
  if (fromReturn && fromReturn !== "/") {
    const sourcePath = normalizePathname(fromReturn);
    return {
      source_path: sourcePath,
      source_type: "legacy_return_url",
      page_type: inferPageTypeFromPath(sourcePath),
      tool_slug: inferToolSlugFromPath(sourcePath),
      referrer_path: null,
      market: fallback.market,
      plan: fallback.plan,
      anonymous_or_user: fallback.anonymous_or_user,
      attribution_confidence: "inferred",
      attribution_source: "return_url",
      attribution_key: {
        order_id: fallback.order_id,
        source_path: sourcePath,
        tool_slug: inferToolSlugFromPath(sourcePath),
        page_type: inferPageTypeFromPath(sourcePath)
      }
    };
  }

  const defaultPath = fallback.market === "cn" ? "/zh/pricing" : "/pricing";
  return {
    source_path: defaultPath,
    source_type: "unknown",
    page_type: "pricing",
    tool_slug: null,
    referrer_path: null,
    market: fallback.market,
    plan: fallback.plan,
    anonymous_or_user: fallback.anonymous_or_user,
    attribution_confidence: "fallback",
    attribution_source: "return_url",
    attribution_key: {
      order_id: fallback.order_id,
      source_path: defaultPath,
      tool_slug: null,
      page_type: "pricing"
    }
  };
}
