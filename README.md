# SolidStart + Park UI (Panda CSS) Starter

Starter repository for SolidStart with Park UI wrappers, Panda theming, and a curated set of developer-focused assets reconciled from `visual-notes`.

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

## SaaS-Ready Scaffold

The starter includes a small file-backed SaaS scaffold that is useful for prototypes and early product work:

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

## GitHub Pages Comps Explorer

This repo includes a Pages workflow that builds a static, pre-rendered Comps Explorer and deploys it to GitHub Pages.

- Workflow: [`.github/workflows/deploy-comps-explorer.yml`](.github/workflows/deploy-comps-explorer.yml)
- Triggers: push to `main` and manual run (`workflow_dispatch`)
- Build output uploaded to Pages: `app/.output/public`

How it works:

1. `actions/configure-pages` resolves the repository base path.
2. The workflow sets `BASE_PATH` so the app works under project URLs like `/solid-start-panda-park-ui/`.
3. The workflow sets `CI_SSG_PRERENDER=true` for the build, which enables CI-only prerender settings in [`app/app.config.ts`](app/app.config.ts):
   - pre-render known explorer routes (`/`, `/comps`, `/comps/:component`)
   - enable link crawling (`crawlLinks: true`) to emit additional static HTML
4. `.nojekyll` is added so `_build/*` assets are served correctly.
5. A safety check fails the build if prerendered `.html` files were not generated.

Local production-like build check:

```bash
BASE_PATH=/solid-start-panda-park-ui/ CI_SSG_PRERENDER=true pnpm -C app build
```

After deploy, the explorer is available at:

- Project pages: `https://<owner>.github.io/<repo>/` (for this repo: [https://byronwall.github.io/solid-start-panda-park-ui/](https://byronwall.github.io/solid-start-panda-park-ui/))
- User/organization pages repo (`<owner>.github.io`): `https://<owner>.github.io/`

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
