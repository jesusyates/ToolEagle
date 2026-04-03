/**
 * Rebuild legacy titles/context into SEO articles and publish to content/auto-posts.
 * Run: npx tsx scripts/rebuild-and-publish.ts
 */

import { runClusterPublishPipeline } from "./cluster-publish-pipeline";

runClusterPublishPipeline({ source: "cli" }).then((r) => {
  process.exit(r.success ? 0 : 1);
});
