# Shipkit Refactor & Optimization Plan (Console Debug Instrumentation)

This plan is designed for an LLM to execute step-by-step. It standardizes lightweight, development-only instrumentation using `console.debug` (or equivalent) while improving performance, maintainability, and code quality across the codebase.

## Overview

- Target stack: Next.js App Router, TypeScript, Shadcn UI, Radix, Payload, TRPC, Drizzle.
- Objectives:
  - Reduce unnecessary client-side code and bundle size
  - Split oversized modules into focused units
  - Standardize lightweight logging with `console.debug`
  - Improve query efficiency and error handling consistency
  - Keep files under ~700 lines where possible

## Global Rules

- Use `console.debug` for non-critical, development-time diagnostics; keep `console.error` for true errors.
- Guard debug output behind `process.env.NODE_ENV !== 'production'` or a `NEXT_PUBLIC_DEBUG` flag.
- Never pollute hot paths with heavy logs; prefer one-time lifecycle logs and timing summaries.
- Maintain server/client boundaries; do not fetch data with server actions.
- Prefer server components; only use client where hooks or browser APIs are required.
- Preserve existing comments and functionality; avoid unrelated changes.

## Debug Instrumentation Pattern

- Prefer this guard:

```ts
const __DEV__ = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true';
if (__DEV__) console.debug('[Context] Message', { key: value });
```

- Timing helper (inline, no global util required):

```ts
const __DEV__ = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true';
const t0 = __DEV__ ? performance.now() : 0;
// ... work ...
if (__DEV__) console.debug('[Timing] some-work', Math.round(performance.now() - t0), 'ms');
```

- Migration of existing console usage:
  - `console.log` → `if (__DEV__) console.debug(...)`
  - Keep `console.error` for actual failures
  - Remove redundant `console.warn` unless actionable; otherwise gate with `__DEV__`

## Phase 0 — Baseline & Safety

- [ ] Add `NEXT_PUBLIC_DEBUG` to `.env.example` (no code changes required yet)
- [ ] Do not run dev in CI; rely on `bun run test`, `bun run typecheck`, `bun run lint`
- [ ] Snapshot counts:
  - [ ] Count files with `"use client"`
  - [ ] Identify files > 700 lines
  - [ ] Grep for `console.(log|warn|info)` occurrences
  - [ ] Record in `audit-progress.md`

Acceptance:

- Baseline metrics captured in `audit-progress.md`.

## Phase 1 — Client Component Audit (Reduce bundle size)

Goal: Convert unnecessary client components to server components.

Locate candidates:

- [ ] `grep -R "^\"use client\"" src | wc -l` (already ~310)
- [ ] Prioritize primitives and static components:
  - `src/components/ui/visually-hidden.tsx`
  - `src/components/ui/separator.tsx`
  - `src/components/ui/avatar.tsx`
  - `src/components/ui/aspect-ratio.tsx`
  - `src/components/ui/progress.tsx`

Edits:

- [ ] Remove `"use client"` only if the file:
  - does not use React hooks, `window`, `document`, or browser-only APIs
  - is not consumed exclusively by other client components that require it to be client
- [ ] If removed, run typecheck; fix import boundaries if needed

Debug to add (temporary, dev-only):

```ts
const __DEV__ = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true';
if (__DEV__) console.debug('[ClientAudit] Converted to server component', 'path/to/file');
```

Acceptance:

- [ ] Reduce `"use client"` files by ≥ 25–35%
- [ ] No hydration warnings introduced

## Phase 2 — Console Hygiene & Dev-Only Logging

Goal: Replace noisy production logs with dev-only `console.debug` while keeping error diagnostics.

Targets:

- `src/server/actions/deployment-actions.ts` (multiple console.*)
- `src/lib/server-action-wrapper.tsx` (console.log + console.error)
- TRPC timing middleware: `src/lib/trpc/api/trpc.ts`

Edits:

- [ ] Replace `console.log/info/warn` with dev-only `console.debug` guards
- [ ] Keep `console.error` for true failures
- [ ] In TRPC timing middleware, change `console.info` → gated `console.debug`

Debug example:

```ts
const __DEV__ = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true';
if (__DEV__) console.debug('[TRPC] %s took %dms', path, end - start);
```

Acceptance:

- [ ] No unguarded `console.log/info/warn` in src/**/*
- [ ] All timing logs dev-only

## Phase 3 — Split Oversized Files

Goal: Improve readability and testability by breaking large modules into focused files.

Candidates & split plan:

- `src/server/services/payment-service.ts` (~1141 lines) →
  - `payment-status-service.ts` (status checks)
  - `purchase-verification-service.ts` (variant/product checks)
  - `payment-crud-service.ts` (create/update/get by id)
  - `payment-import-service.ts` (import + provider orchestration)
  - `checkout-service.ts` (checkout creation)
  - `payment-types.ts` (shared interfaces)
- `src/components/ui/sidebar.tsx` (~691 lines) → Provider, Content, Controls, Items
- `src/components/modules/search/search-ai.tsx` (~600 lines) → Dialog, Input, Results
- `src/lib/server-action-wrapper.tsx` (~300 lines) → utilities + hooks

Edits:

- [ ] Move code with zero behavior change
- [ ] Export stable API from new modules
- [ ] Update import paths across callers

Debug:

```ts
if (__DEV__) console.debug('[Refactor] Split module', { from: 'old.ts', to: ['a.ts','b.ts'] });
```

Acceptance:

- [ ] No behavior changes
- [ ] Each file ≤ 500–700 lines (where feasible)

## Phase 4 — Error Handling Standardization

Goal: Centralize error handling via `ErrorService` patterns while minimizing user-facing differences.

Edits:

- [ ] Use `ErrorService.createError()` and `ErrorService.handleError()` in services/actions
- [ ] Replace ad-hoc string errors with typed codes
- [ ] Keep `console.error` only for terminal failures; add dev-only `console.debug` context

Debug:

```ts
if (__DEV__) console.debug('[Error] Kind=%s', appError.code, { metadata: appError.metadata });
```

Acceptance:

- [ ] Consistent error codes across services
- [ ] No swallowed exceptions

## Phase 5 — Database Query Optimization

Goal: Reduce N+1 queries and add missing indexes where beneficial.

Locate patterns:

- [ ] Grep for repeated selects in loops over result sets
- [ ] Identify `findFirst`/`select` chains that can be batched or joined

Edits:

- [ ] Convert sequential provider calls to parallel with safety
- [ ] Batch user/payment queries where applicable
- [ ] Propose SQL indexes for high-cardinality filters

Debug:

```ts
const t0 = __DEV__ ? performance.now() : 0;
const res = await /* query */;
if (__DEV__) console.debug('[DB] query paymentsByUser took %dms (%d rows)', Math.round(performance.now() - t0), res?.length ?? 0);
```

Acceptance:

- [ ] Fewer queries on hot paths; measurable latency improvements in dev logs

## Phase 6 — Caching (Opt-In, Minimal)

Goal: Introduce light caching where it meaningfully reduces repeated work (respecting existing Redis service if enabled).

Edits:

- [ ] Use existing `CacheService` patterns (if Redis configured)
- [ ] Cache read-mostly queries (team lists, static content) with short TTLs

Debug:

```ts
if (__DEV__) console.debug('[Cache] hit', key);
if (__DEV__) console.debug('[Cache] miss', key);
```

Acceptance:

- [ ] Cache yields demonstrable hit rate in dev logs

## Phase 7 — Bundle & Rendering Optimization

Goal: Improve startup and interaction performance via SSR-first and dynamic import where helpful.

Edits:

- [ ] Convert large client-only modules to dynamic `import()` with `ssr: false` when appropriate
- [ ] Keep server components as default; wrap client islands in Suspense if needed

Debug:

```ts
if (__DEV__) console.debug('[Dynamic] loaded component', 'ComponentName');
```

Acceptance:

- [ ] Fewer client modules on initial route

## Phase 8 — Tests, Types, and Docs

- [ ] `bun run typecheck` clean
- [ ] Unit tests for split modules
- [ ] Update `ai.mdx` and `audit-progress.md` with checklist progress

---

## File-Specific Starting Points (Initial Batch)

1) Client-to-Server candidates:

- `src/components/ui/visually-hidden.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/aspect-ratio.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/progress.tsx`

2) Console hygiene:

- `src/server/actions/deployment-actions.ts`
- `src/lib/server-action-wrapper.tsx`
- `src/lib/trpc/api/trpc.ts`

3) Oversized splits:

- `src/server/services/payment-service.ts`
- `src/components/ui/sidebar.tsx`
- `src/components/modules/search/search-ai.tsx`
- `src/lib/server-action-wrapper.tsx`

---

## Definition of Done (Phase Gate)

- Phase 1: ≥ 25–35% reduction in `"use client"` components, no hydration errors
- Phase 2: No unguarded non-error console output in prod; dev logs via `console.debug`
- Phase 3: Target files split; imports updated; behavior unchanged
- Phase 4: Error handling standardized in impacted services/actions
- Phase 5: Verified query reductions; measurable latency improvements in dev
- Phase 6: Cache hit/miss logs visible under `NEXT_PUBLIC_DEBUG=true`
- Phase 7: Reduced client bundles; confirm via analyzer
- Phase 8: Typecheck/lint/tests pass; docs updated

---

## Commit Message Templates

- chore(logging): gate dev diagnostics with console.debug in <area>
- refactor(components): convert <name> from client to server component
- refactor(service): split <service> into focused modules
- perf(db): batch queries in <area>, add timing debug
- feat(cache): add lightweight cache to <query> with TTL=<n>s
- docs: update ai.mdx and audit-progress.md with progress

---

## Rollback Strategy

- Each phase is incremental; revert by file or directory
- Maintain API surface of split services to minimize ripple effects

---

## Appendix — Commands (run locally)

- Lint & types:
  - `bun run typecheck`
  - `bun run lint`
- Tests:
  - `bun run test`
- Bundle analyzer (optional, local):
  - `NEXT_PUBLIC_DEBUG=true` to surface console.debug timing locally`
