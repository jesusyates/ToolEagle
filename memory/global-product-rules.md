# Global product architecture rules

**This document defines the global architecture rules. All future features must comply.**

---

## Relationship to other docs

- **Normative source (Chinese, authoritative)**: **`docs/MEMORY.md` —「零点五·三、三端全球统一规则层」** 与本文件主题一致且条款最全；本文件为英文摘要，**冲突以 MEMORY 为准**。
- **Normative source (general)**: Full product direction, compliance text, and section references live in **`docs/MEMORY.md`**. This file is an **enforceable, implementation-facing checklist** for global architecture and feature gates.
- **On any conflict**: **`docs/MEMORY.md` wins.** Update this file when MEMORY changes so the checklist stays aligned.
- **How-to runbooks**: Operational steps stay under **`memory/`** (see **`memory/README.md`**).

---

## 1. Information hierarchy

1. **`docs/MEMORY.md`** — highest priority for product and architecture decisions.
2. **`docs/PROJECT-STATUS-REPORT-FOR-CHATGPT.md`** — current delivery state; does not override MEMORY.
3. **Code** — ground truth for runtime behavior; direction still follows MEMORY when choosing fixes vs refactors.
4. **Historical `docs/V*.md`** — background only; not a decision authority alone.

---

## 2. Engineering structure and modularity

- **Layering**: Routes/pages in `src/app`; domain logic in `src/lib`; config in `src/config`; reusable UI in `src/components`. Keep single-file responsibility; avoid duplicating whole “shadow forks” for markets—use shared modules with explicit `market` / `locale` branches.
- **Stability**: Auth, payments, generation, Content Safety, etc. must have explicit error handling; do not silently swallow errors in critical paths.
- **Discoverability**: New capabilities should have identifiable entry route, API, and key components; document a one-line index when the chain is non-obvious.

---

## 3. Modular architecture and single source of truth (backend)

- **Principle**: Unified backend truth; **not** a unified front-end shape. Core capabilities **must** be modular; core data flows through **shared-core-backend** (Supabase is storage/infra, not the business truth source).
- **Chain**: `Web / App / Desktop` → **shared-core-backend** → Supabase.
- **Front-end may**: call modules; call shared-core via the unified client; render UI.
- **Front-end must not**: invent business truth; directly own core data mutations outside the module system; reimplement auth / usage / tasks / AI as one-offs in pages.
- **Unified truth domains** include: user/profile, auth state, plan/entitlement, credits/quota, usage/cost, tasks/runs/results, AI execution, memory/template, payment/orders.
- **APIs**: Requests to shared-core use **apiClient**, **`Authorization: Bearer`**, and **platform / product / locale / version** per shared-core client conventions.
- **Module rules**: Must modularize; module > page; single responsibility; stable external API; reuse existing modules; logic portable across Web/App/Desktop; **`ui/`** subfolder optional—core logic not stacked in pages.
- **Auth chain (only path)**: Supabase session → shared-core **`GET /v1/account/session` (gate)** → **AuthProvider** → UI. Do not treat OAuth/password success alone as “logged in”; no parallel auth truth sources.
- **Development order**: Decide module ownership → extend or add module → **then** UI.
- **Migration**: Legacy `/api` is fallback only; **new** capabilities target shared-core; change one domain at a time.

---

## 4. Mobile-first and product stage

- **Mobile-first (locked)**: All user-visible experiences prioritize phone; desktop is enhancement, not the sole layout target. Tools and workflows must stay thumb-friendly, low-step, and card-oriented with clear CTAs.
- **Current stage — Web (locked)**: Focus on responsive, SEO-friendly Web. Do not let PWA/native work dilute SEO, validation, or revenue on the main path. PWA and native are later stages with explicit prerequisites (traffic, DAU, revenue) before native.

---

## 5. Global vs country sites

- **English site** is primary: global traffic engine, brand, default narrative.
- **Country sites** (e.g. China `/zh`) are secondary templates for local growth and monetization—not mere translations; **platform-level creator systems** with local context.
- **Forbidden**: Treating a country site as the “main” site, shrinking the global English SEO strategy, or **CN-only architecture** that bypasses the global system.
- **China stack order (locked)**: Douyin first at full depth; other local stacks (e.g. Xiaohongshu) only when ready—no empty shells at scale.
- **Five partitions** (AI, performance, payments, SEO, UX) are market-aware; new features default to **global** unless explicitly branched with `siteMode`, locale, `market`, or config.

---

## 6. Content Safety Engine (CSE)

- **Mandatory** for **all** user-facing AI output on EN, ZH, and future locales. **No** new path that bypasses CSE.
- **Structure**: Prompt constraints (pre) + output filtering/normalization (post) + platform-specific rules (`rulesForMarket`, platform configs).
- **Provider-agnostic**: CSE runs **server-side** on content returned to users; do not rely on a single vendor’s moderation as a substitute.
- **Do not** promise 100% compliance or legal approval in product copy.

---

## 7. Commercial protection

- New high-impact capabilities must respect **cost protection**, **risk control**, **rate limiting**, **abuse detection**, and **adjustable policy** without harming normal users.

---

## 8. Tool quality and Knowledge Engine

- **Tool quality (locked)**: Ship only near-perfect tools; quality over count. Output must match the tool’s promise; random generators need diversity and input relevance without nonsense variance.
- **Knowledge Engine (locked) for new/changed tools**: User-facing generation must follow **intent → retrieval (local assets first) → recipe → generation**, with observability (e.g. retrieval vs not). **Pure prompt-only** defaults for **new** tools are **not shippable**.
- **Compliance**: All AI outputs go through CSE and platform rules.

---

## 9. Background pipeline and “upload”

- Daily SEO/production pipelines run on **schedulers / background jobs**, decoupled from **upload** (git sync). **Upload** does not mean “run the entire daily pipeline and block.”
- See **`memory/tooleagle-project-operating-manual.md`** and **`docs/MEMORY.md`** (e.g. section six) for upload semantics and reporting.

---

## 10. Layout and IA freezes

- Major layout frameworks (global shell, header/footer, primary IA) are **frozen**; changes require explicit scope, impact, rollback plan, and approval—prefer incremental improvements inside existing shells.

---

## Compliance checklist (before shipping a feature)

- [ ] Aligns with **`docs/MEMORY.md`** and this checklist.
- [ ] Correct module/shared-core boundaries; no new auth or billing truth in a page.
- [ ] Mobile-first UX on primary paths.
- [ ] CSE on all new user-visible AI outputs; `resolveSafetyMarket` (or successor) used consistently.
- [ ] New or heavily revised tools: Knowledge Engine path (intent → retrieval → recipe → generation).
- [ ] Market/locale behavior explicit; global default unless intentionally partitioned.
- [ ] Cost/risk/limiting considered for expensive or abuse-prone paths.
