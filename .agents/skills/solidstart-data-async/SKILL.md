---
name: solidstart-data-async
description: Apply SolidStart SSR-safe data access and async boundaries. Use when implementing app data reads/writes, route resources, metadata, missing-resource handling, and hydration-safe async UI.
---

# SolidStart Data + Async Boundaries

Use this skill for client/server data flow and route-level async behavior.

## Rules

1. Reads: server `query()` + client `createResource()`.
2. Prefer `resource.latest` by default when consuming `createResource` values.
   - This avoids transient empty/loading blips during revalidation.
   - Use `resource()` only when a visible loading/pending transition is intentional.
3. Writes: server actions.
4. Do not use raw `fetch()` in UI components for app data.
5. For detail routes, set route metadata from loaded data.
   - Set `<Title>` and OG title/description from the resource.
6. Missing resources must return true 404 semantics.
   - Use `HttpStatusCode` with a clear recovery CTA (`Go home` or equivalent).
7. SSR-sensitive overlays/selects must keep server and first client DOM identical.
   - If needed, render deterministic fallback until mount, then enable interactive overlay.
   - Avoid locale-dependent initial labels in SSR output when they can differ by environment.

## Async UX Expectations

- Wrap resource UI in `Suspense` fallback.
- Prefer stable-height result panes (`overflow: auto`) for streaming/dynamic content.
- Prefer handling empty states inside resolved content instead of resource-level branch forks.

## Verification Checklist

- No UI-level app-data `fetch()`.
- `query/createResource` and server actions used for data operations.
- `createResource` consumption uses `resource.latest` unless pending UI is intentional.
- Detail routes set title/OG metadata.
- Missing resources return HTTP 404 and user-facing recovery action.
- SSR/client first render structure matches in async overlay controls.
