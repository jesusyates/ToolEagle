/** Server / route handlers: full preflight. Client Components: use `./client` only. */
export type {
  SeoPreflightConfig,
  SeoPreflightContentType,
  SeoPreflightCandidateResult,
  SeoPreflightJobResult,
  PublishedCorpus
} from "./types/preflight";
export { SEO_PREFLIGHT_CONTENT_TYPES } from "./types/preflight";

export { runSeoPreflightJob } from "./core/pipeline";
export type { RunPreflightOptions } from "./core/pipeline";

export { slugifyForSeo } from "./policy/slug";
export { loadPublishedCorpusFromTopicRegistry } from "./adapters/load-corpus";
