# ToolEagle System Blueprint

Version: V125  
Status: LOCKED FOUNDATION  
Scope: EN main-site growth system (with global extensibility)

---

## A. Mission & Core Goal

ToolEagle exists to build a scalable search-growth system that converts traffic into product usage and revenue.

Core outcomes:

1. Traffic growth
   - Build broad, high-intent SEO entry coverage.
   - Maintain discoverability through indexing, linking, and sitemap hygiene.
2. Scale readiness
   - Architecture and production model must support 100k-1M pages over time.
   - Expansion must remain structured, observable, and anti-drift.
3. Monetization
   - Traffic should flow into tool usage, account intent, and upgrade paths.
   - Content and tools are revenue enablers, not isolated artifacts.

---

## B. Page Type System

### 1) blog

Definition:
- Broad discovery surface for ideas, examples, lists, and topic expansion.

Allowed use cases:
- "ideas", "examples", "best", "list", trend framing.
- Top/mid-funnel keyword expansion and content breadth.

Forbidden overlaps:
- Must not impersonate full workflow guides when guide is primary.
- Must not be written as short direct Q/A.

### 2) answer

Definition:
- Short, explicit question-intent page with direct answer format.

Allowed use cases:
- "how many", "what is", "when", "should I", concise query shapes.
- Support page only; never topic primary.

Forbidden overlaps:
- Never primary ownership for a topic.
- Must not become long workflow tutorial or broad listicle.

### 3) guide

Definition:
- Structured step-by-step workflow page for execution intent.

Allowed use cases:
- "how-to", "workflow", implementation path, sequence-based tasks.
- Primary page type for workflow-heavy topic clusters.

Forbidden overlaps:
- Must not become generic listicle disguised as a guide.
- Must not duplicate blog broad-intent structure for same core query.

### 4) tool

Definition:
- Product page where value is generated and user action happens.

Allowed use cases:
- Core conversion destination from SEO content.
- Feature value, user utility, and upgrade path.

Forbidden overlaps:
- Must not become content-only page without usable generation path.
- Must not be disconnected from traffic-entry content graph.

---

## C. Topic Ownership Rules

Ownership model:
- One topic cluster maps to exactly one primary page.
- Primary page type can be blog or guide.
- Answer is always supporting.

Required fields per topic:
- primaryType
- primaryUrl
- supportingPages[]

Role semantics:
- Primary page owns core intent for that topic cluster.
- Supporting pages target adjacent intent shapes without stealing primary intent.

Anti-cannibalization logic:
- If new page intent conflicts with existing primary intent, skip or downgrade.
- If same type competes with non-primary URL under same topic, block.
- Enforce intent boundaries by type (blog broad, answer short explicit, guide workflow).

---

## D. Traffic Flow Model

Canonical flow:
- SEO query -> entry page (blog/answer/guide) -> relevant tool -> upgrade/revenue path

Linking rules:
- Every content page should point to one or more relevant tools.
- Cross-type linking is required:
  - blog -> answer/guide/tool
  - answer -> tool + related answers/questions
  - guide -> tool + related guides/answers/blog
- Internal linking should reinforce ownership hierarchy, not blur it.

Discoverability requirements:
- New eligible pages must be index-queued.
- Sitemap coverage must include indexable EN surfaces.
- Content must join existing discoverability network, not isolated silos.

---

## E. Content Generation Rules

What can be generated:
- EN blog at primary volume.
- EN answer and guide at controlled secondary volume.
- Topic plans and ownership mappings for routing decisions.

What must be avoided:
- Near-duplicate pages across types for same query shape.
- Type-intent mismatch content (e.g., answer written like long guide).
- Unbounded expansion without ownership and conflict checks.

Quality requirements:
- Respect existing quality gates and retries for blog generation.
- For answer/guide secondary layer, enforce type-pattern safety before enqueue.
- If quality/intent safety is unclear, skip instead of force output.

---

## F. Scaling Rules

How to expand topics:
- Expand from strongest tool-aligned clusters first.
- Use allocation and growth signals where available.
- Preserve one-topic-one-primary ownership.

How to expand platforms:
- Expand EN platform clusters with explicit intent separation and ownership controls.
- Reuse existing indexing, linking, and status visibility systems.

What NOT to do:
- Do not reduce blog primary engine to inflate secondary page counts.
- Do not mix incompatible intents into one page type for volume.
- Do not introduce isolated generation paths outside shared quality/indexing network.
- Do not bypass anti-cannibalization controls for short-term output spikes.

---

## G. System Priority (LOCKED)

1. SEO traffic
2. content production
3. creator ecosystem
4. tools marketplace
5. monetization

Interpretation:
- Lower layers cannot compromise higher layers.
- New features or scripts must align with this order by default.

---

## Blueprint Usage

Implementation guidance:
- Future planning and generation scripts should read `generated/system-blueprint.json`.
- Human decision and review should use `docs/system-blueprint.md`.
- Any future logic that conflicts with this blueprint should be considered drift and corrected.

