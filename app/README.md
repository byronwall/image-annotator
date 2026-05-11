# App Workspace

SolidStart app with Park UI wrappers and Panda CSS.

## Prerequisites

- Node `>=22`
- pnpm

## Commands

```bash
pnpm install
pnpm prepare
pnpm dev
pnpm lint
pnpm lint:fix
pnpm type-check
pnpm test
pnpm build
pnpm start
```

## Architecture

- UI wrappers: `src/components/ui/*`
- Theme + recipes: `src/theme/*`
- Panda output (generated): `styled-system/*`

## Reconciled Additions

This starter now includes additional reusable wrappers and dev scaffolding sourced from `visual-notes`:

- New wrappers: `WrapWhen`, `ClearButton`, `ConfirmDialog`, `PanelPopover`, `SimpleDialog`, `SimplePopover`, `SimpleSelect`
- UI wrapper quality fixes in `button`, `file-upload`, `select`, `tooltip`
- Added `vitest.config.ts` and scripts for `test` + `type-check`
- Added `amber` semantic color family and background semantic tokens in Panda config

For complete migration details and rationale, see `../docs/visual-notes-reconciliation-2026-02-15.md`.

## SaaS Scaffold

Reusable prototype SaaS pieces live under `src/lib` and `src/routes/api`:

- `src/lib/account/*`: file-backed users, sessions, magic links, credit ledger, Stripe event records, email activity, site errors
- `src/lib/billing/*`: Stripe checkout and webhook signature helpers
- `src/lib/email/send.ts`: console delivery by default, Resend delivery when configured
- `src/lib/admin/analytics.ts`: file-backed request analytics snapshots
- `src/middleware.ts`: request logging with optional session user enrichment

Data is persisted to `APP_DATA_DIR`, which defaults to `app/data/*` locally. Docker Compose sets it to `/app/data` and mounts that path to a named volume.

## Markdown Renderer Module

Reusable markdown rendering (GFM, syntax-highlighted code blocks, mermaid rendering) is available at:

- `src/components/markdown-renderer/`

Usage guide:

- `../docs/markdown-renderer-usage.md`
