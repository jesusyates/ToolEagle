/**
 * Web integration: shared-core usage + quota reads (primary product path).
 * Implementation lives in `@/lib/api/shared-core-usage-quota`.
 */
export {
  mapSharedCoreUsageQuotaToUsageStatusPayload,
  fetchUsageStatusPayloadPrimary,
  fetchUsageQuotaToolUi
} from "@/lib/api/shared-core-usage-quota";
