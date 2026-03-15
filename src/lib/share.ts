/**
 * Encode string to base64, handling Unicode (emoji, etc.) via encodeURIComponent.
 */
function toBase64Url(str: string): string {
  const binary = unescape(encodeURIComponent(str));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode base64url to string, handling Unicode.
 */
function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (encoded.length % 4)) % 4);
  const binary = atob(padded);
  return decodeURIComponent(escape(binary));
}

/**
 * Encode result for shareable URL. Uses base64url to avoid server storage.
 */
export function encodeResultForShare(toolSlug: string, items: string[]): string {
  const payload = JSON.stringify({ t: toolSlug, i: items });
  return typeof btoa !== "undefined" ? toBase64Url(payload) : "";
}

/**
 * Decode result from shareable URL. Works in browser and Node.
 */
export function decodeResultFromShare(encoded: string): { toolSlug: string; items: string[] } | null {
  try {
    const pad = (4 - (encoded.length % 4)) % 4;
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
    const json =
      typeof Buffer !== "undefined"
        ? Buffer.from(padded, "base64").toString("utf8")
        : fromBase64Url(encoded);
    const data = JSON.parse(json);
    if (data?.t && Array.isArray(data?.i)) {
      return { toolSlug: data.t, items: data.i };
    }
  } catch {
    // ignore
  }
  return null;
}

export function getResultShareUrl(toolSlug: string, items: string[]): string {
  if (typeof window === "undefined") return "";
  const encoded = encodeResultForShare(toolSlug, items);
  return `${window.location.origin}/result/${encoded}`;
}

export function getTwitterShareUrl(text: string, url?: string): string {
  const params = new URLSearchParams();
  params.set("text", text.slice(0, 200));
  if (url) params.set("url", url);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/** Map tool slug to primary platform for share button */
export function getToolPlatform(toolSlug: string): "tiktok" | "youtube" | "instagram" | null {
  if (toolSlug.includes("tiktok")) return "tiktok";
  if (toolSlug.includes("youtube")) return "youtube";
  if (toolSlug.includes("instagram") || toolSlug.includes("reel")) return "instagram";
  return null;
}

/** Platform official website URLs for share button */
export const PLATFORM_URLS: Record<string, string> = {
  tiktok: "https://www.tiktok.com/",
  youtube: "https://www.youtube.com/",
  instagram: "https://www.instagram.com/"
};
