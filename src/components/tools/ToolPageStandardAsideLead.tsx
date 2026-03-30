import { tools } from "@/config/tools";
import { ToolAutoConversionPathCard } from "@/components/cta/AutoConversionPathCard";
import { getV178ToolSurface, loadV178FullSurfaceManifest } from "@/lib/seo/v178-full-surface-manifest";
import { getV179ToolBoost, loadV179UpgradeRuntime } from "@/lib/seo/v179-upgrade-runtime";
import { getV180ToolPaywall, loadV180PaywallRuntime } from "@/lib/seo/v180-paywall-runtime";
import { getV181ToolCta, loadV181RevenueCtaRuntime } from "@/lib/seo/v181-revenue-cta-runtime";
import {
  getV182PlacementRelatedSlugs,
  getV182ToolEntryBoost,
  loadV182RevenueEntryBoost
} from "@/lib/seo/v182-revenue-entry-boost";
import { RelatedToolsCard } from "./RelatedToolsCard";
import { WorkflowProminenceCard } from "./WorkflowProminenceCard";

type Props = { toolSlug: string };

/**
 * V178 / V178.1 — Same aside lead as `tools/[slug]/page.tsx`: workflow hub + manifest workflow steps,
 * optional conversion path from manifest, then related tools (manifest extras merged, deduped).
 */
export function ToolPageStandardAsideLead({ toolSlug }: Props) {
  const tool = tools.find((t) => t.slug === toolSlug);
  const category = tool?.category ?? "Captions";

  const v178 = loadV178FullSurfaceManifest();
  const autoSurface = getV178ToolSurface(v178, toolSlug);
  const extraRelated = autoSurface?.extraRelatedSlugs ?? [];
  const workflowExtra = autoSurface?.workflowExtra ?? [];
  const showConversionPath = autoSurface?.showConversionPath ?? false;

  const v179 = loadV179UpgradeRuntime();
  const rev = getV179ToolBoost(v179, toolSlug);
  const v180 = loadV180PaywallRuntime();
  const pw = getV180ToolPaywall(v180, toolSlug);
  const v181 = loadV181RevenueCtaRuntime();
  const r181 = getV181ToolCta(v181, toolSlug);
  const v182 = loadV182RevenueEntryBoost();
  const r182 = getV182ToolEntryBoost(v182, toolSlug);
  const boost = r181?.upgrade_boost_hint ?? rev?.upgrade_boost;
  const showPublishPath =
    showConversionPath ||
    boost === "max" ||
    boost === "standard" ||
    Boolean(r182?.short_click_path);
  const workflowMode = rev?.workflow_upgrade_mode;
  const upgradeLinkMode =
    showPublishPath && workflowMode === "subtle" ? "subtle" : "default";
  const trustBlock =
    r182?.trust_block_override === "full"
      ? "full"
      : r182?.trust_block_override === "compact"
        ? "compact"
        : r182?.trust_block_override === "none"
          ? "none"
          : r181?.trust_block === "full"
            ? "full"
            : r181?.trust_block === "compact"
              ? "compact"
              : r181?.trust_block === "none"
                ? "none"
                : pw?.trust_block === "full"
                  ? "full"
                  : pw?.trust_block === "compact"
                    ? "compact"
                    : "none";
  const placementExtra = getV182PlacementRelatedSlugs(v182, toolSlug);
  const extraRelatedMerged =
    placementExtra.length > 0 ? [...new Set([...placementExtra, ...extraRelated])] : extraRelated;

  const hideWorkflowPricing = Boolean(
    r181?.workflow_upgrade_hidden !== undefined ? r181.workflow_upgrade_hidden : pw?.workflow_upgrade_hidden
  );
  const upgradeCopyVariant =
    r181?.paywall_ab === "b"
      ? "b"
      : pw?.paywall_ab === "b"
        ? "b"
        : rev?.ab_upgrade_copy === "b"
          ? "b"
          : "a";

  return (
    <>
      <WorkflowProminenceCard
        toolSlug={toolSlug}
        mergeExtraSteps={workflowExtra}
        upgradeLinkMode={upgradeLinkMode}
        hidePricingLink={hideWorkflowPricing}
      />
      {showPublishPath ? (
        <ToolAutoConversionPathCard
          toolSlug={toolSlug}
          upgradeBoost={boost === "max" ? "max" : "standard"}
          upgradeCopyVariant={upgradeCopyVariant}
          trustBlock={trustBlock}
        />
      ) : null}
      <RelatedToolsCard currentSlug={toolSlug} category={category} extraSlugs={extraRelatedMerged} />
    </>
  );
}
