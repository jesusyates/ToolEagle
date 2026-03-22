/**
 * V98 — Lightweight server-side AI telemetry (logs only; no full cost platform).
 * Enables later comparison of Global vs CN routes and provider performance.
 */

export type AiTelemetryPayload = {
  task_type: string;
  market: string;
  locale: string;
  provider: string;
  model: string;
  user_plan: "free" | "pro";
  latency_ms: number;
  /** Wall time until first model completion when applicable */
  model_latency_ms?: number;
  fallback_used: boolean;
  /** Model returned parseable JSON packages (not heuristic-only). */
  success: boolean;
  error_code?: string;
  /** V99 — client route for CN/global perf slices */
  route?: string;
  /** V99 — structured outcome (see GenerationOutcome in router) */
  outcome?: string;
  error_class?: string;
  /** User still received packages (possibly via heuristic). */
  user_fulfilled?: boolean;
  /** V104 — post-output safety pass */
  content_safety_filtered_count?: number;
  content_safety_risk_detected?: number;
  content_safety_profile?: string;
};

const PREFIX = "[ai_telemetry]";

export function logAiTelemetry(payload: AiTelemetryPayload): void {
  try {
    console.info(
      PREFIX,
      JSON.stringify({
        ...payload,
        ts: new Date().toISOString()
      })
    );
  } catch {
    /* ignore log failures */
  }
}
