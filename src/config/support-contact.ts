/**
 * V100.4 — Human support channels (CN-first). QR URLs or /public paths.
 * All optional; UI hides missing channels.
 */

export function getSupportEnterpriseWeChatQr(): string {
  return (process.env.NEXT_PUBLIC_SUPPORT_ENTERPRISE_WECHAT_QR || "").trim();
}

export function getSupportWeChatQr(): string {
  return (process.env.NEXT_PUBLIC_SUPPORT_WECHAT_QR || "").trim();
}

/** Optional QQ profile / group link */
export function getSupportQqLink(): string {
  return (process.env.NEXT_PUBLIC_SUPPORT_QQ_LINK || "").trim();
}

export function getSupportQqLabel(): string {
  return (process.env.NEXT_PUBLIC_SUPPORT_QQ_LABEL || "QQ").trim();
}

export function hasAnySupportChannel(): boolean {
  return Boolean(
    getSupportEnterpriseWeChatQr() || getSupportWeChatQr() || getSupportQqLink()
  );
}
