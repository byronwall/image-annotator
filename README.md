# Image Annotator

Production SolidStart app for image annotation, built with Park UI wrappers and Panda CSS.

## Layout

- `/app` - SolidStart application
- `/AGENTS.md` - repo-level contributor + agent guidance
- `/.agents/skills` - local reusable skills/playbooks
- `/.mcp.json` - Ark UI MCP server wiring
- `/docs` - migration/reconciliation documentation
- `/docker-compose.yml` + `/Dockerfile` - production container build with persisted runtime data

## Quick Start

```bash
pnpm -C app install
pnpm -C app dev
```

## Useful Commands

```bash
pnpm -C app prepare
pnpm -C app type-check
pnpm -C app test
pnpm -C app build
pnpm -C app start
```

## SaaS Scaffold

The app includes a small file-backed SaaS scaffold that is useful for prototypes and early product work:

- Magic-link auth: `app/src/lib/account/*` and `app/src/routes/api/auth/*`
- Local user/session/credit ledger store with atomic writes under `APP_DATA_DIR/account`
- Stripe checkout + webhook idempotency: `app/src/lib/billing/*`, `app/src/routes/api/billing/checkout.ts`, `app/src/routes/api/stripe/webhook.ts`
- Transactional email abstraction with console mode and Resend mode: `app/src/lib/email/send.ts`
- Request analytics middleware and admin JSON endpoint: `app/src/middleware.ts`, `app/src/lib/admin/analytics.ts`, `app/src/routes/api/admin/analytics.ts`
- Production Docker build and compose file with persisted `/app/data`

Copy `app/.env.example` to `app/.env` for local development. For Docker, put the same variables in root `.env`; Compose sets `APP_DATA_DIR=/app/data` and mounts that path to a named volume. Then run:

```bash
docker compose up --build
```

The scaffold intentionally stays generic: rename the cookie, product name, credit-pack env names, and success/cancel routes to match each app.

## UI Surface

Base Park-style wrappers are in `app/src/components/ui/*`, including reconciled utility wrappers:

- `SimpleDialog`
- `SimplePopover`
- `SimpleSelect`
- `PanelPopover`
- `ConfirmDialog`
- `ClearButton`
- `WrapWhen`

## Reconciliation Notes

See `/docs/visual-notes-reconciliation-2026-02-15.md` for the full import list and rationale.
