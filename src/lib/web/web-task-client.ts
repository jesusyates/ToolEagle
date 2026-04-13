/**
 * Web integration: shared-core tasks / runs / history.
 * Implementation lives in `@/lib/api/shared-core-tasks`.
 */
export {
  pickTaskId,
  pickRunId,
  persistToolGenerationToSharedCore,
  fetchSharedCoreHistory,
  type ToolGenerationPersistParams,
  type HistoryRowUi
} from "@/lib/api/shared-core-tasks";
