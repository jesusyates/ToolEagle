/**
 * Server-only checks for CN checkout (aggregator env is not exposed to the client).
 * Import only from Server Components / Route Handlers.
 */
export function isCnAggregatorConfigured(): boolean {
  const base = (process.env.AGGREGATOR_BASE_URL || "").trim();
  const key = (process.env.AGGREGATOR_API_KEY || "").trim();
  return base.length > 0 && key.length > 0;
}
