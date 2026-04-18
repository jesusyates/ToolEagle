/**
 * Client-safe surface: types + content-type list only.
 * Do not import `@/lib/seo-preflight` from Client Components — that barrel pulls in `runSeoPreflightJob` / fs adapters.
 */
export type {
  SeoPreflightConfig,
  SeoPreflightContentType,
  SeoPreflightCandidateResult,
  SeoPreflightJobResult,
  PublishedCorpus
} from "./types/preflight";
export { SEO_PREFLIGHT_CONTENT_TYPES } from "./types/preflight";
