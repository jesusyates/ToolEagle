import type { ToolPageCopy } from "@/config/tool-page-copy-en";
import { getToolPageCopyEn } from "@/config/tool-page-copy-en";
import { getToolPageCopyZh } from "@/config/tool-page-copy-zh";

/** Global tool hero + steps by UI locale (EN copy for non-Chinese locales). */
export function resolveToolPageCopy(slug: string, locale: string): ToolPageCopy | undefined {
  return locale.startsWith("zh") ? getToolPageCopyZh(slug) : getToolPageCopyEn(slug);
}
