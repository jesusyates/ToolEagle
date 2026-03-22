import type { PostPackageToolKind } from "@/lib/ai/postPackage";
import { buildBaseUserInstruction, buildV106UserSuffix, buildPublishPackSuffix } from "./shared/json-rules";
import { sharedStrategistSystem } from "./shared/strategist-system";
import { sharedContentSafetyPrompt } from "./shared/content-safety-prompt";
import { localeSystemPrefix } from "./locale/output-language";
import { marketGlobalSystemSuffix } from "./market/global";
import { marketCnSystemSuffix } from "./market/cn";
import { platformPostPackageAngle } from "./platform/post-package";

export type ComposedMarket = "global" | "cn";

/**
 * Layered prompts: shared strategist + locale + market + (user) platform + task body.
 * Global remains the baseline; CN adds a market layer without forking JSON shape.
 */
export function composePostPackagePrompts(args: {
  userInput: string;
  toolKind: PostPackageToolKind;
  tier: "free" | "pro";
  market: ComposedMarket;
  locale: string;
  /** V106.1 — merged topic+hook+full script+caption+comment CTA in one pack */
  publishFullPack?: boolean;
}): { systemPrompt: string; userPrompt: string } {
  const depth: "compact" | "full" = args.tier === "pro" ? "full" : "compact";
  /** V103.1 — Free: 2–3 preview; Pro: 8–12 full packages, multiple styles */
  const count = args.tier === "pro" ? 10 : 5;

  const platform = platformPostPackageAngle(args.toolKind);
  let userBody = buildBaseUserInstruction(args.userInput, count, depth);
  userBody += buildV106UserSuffix(args.locale, count, depth);
  if (args.publishFullPack === true) {
    userBody += buildPublishPackSuffix(args.locale);
  }
  if (args.tier === "pro" && args.market === "cn") {
    userBody +=
      "\n\nAcross packages, keep 带货/情绪/干货/娱乐 angles diverse — already encoded in variation_pack.";
  }
  const userPrompt = `${platform}\n\n${userBody}`;

  const chunks: string[] = [
    sharedStrategistSystem(),
    sharedContentSafetyPrompt(),
    localeSystemPrefix(args.locale),
    args.market === "cn" ? marketCnSystemSuffix() : marketGlobalSystemSuffix()
  ];

  return {
    systemPrompt: chunks.join(" ").trim(),
    userPrompt
  };
}
