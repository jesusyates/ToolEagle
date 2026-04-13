/**
 * Web integration: shared-core AI execute + response helpers.
 * Transport remains `@/lib/api/shared-core-client`; this module is the Web façade.
 */
import { apiClient } from "@/lib/api/shared-core-client";

export {
  parseSimpleExecuteResults,
  unwrapPackageExecuteResponse,
  parseSimpleTextToResultList
} from "@/lib/api/shared-core-ai-helpers";

export function webAiExecute(accessToken: string | null, body: unknown): Promise<Response> {
  return apiClient.aiExecute(accessToken, body);
}

export function webAiRouterPreview(accessToken: string | null, body: unknown): Promise<Response> {
  return apiClient.aiRouterPreview(accessToken, body);
}
