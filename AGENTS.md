# AGENTS.md

## Cursor Cloud specific instructions

### Product

**Receipts** is a TanStack Start (React 19 + Vite 7) marketing site and interactive prototype. One dev server handles SSR and server functions — there is no separate API process.

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/try` | Core demo: paste a call transcript → AI returns a cited “close package” |
| `/waitlist` | Design-partner signup (Supabase insert via server function) |
| `/app` | Redirects to `/try` |

### Services

| Service | Required? | Notes |
| --- | --- | --- |
| Vite dev server (`npm run dev`) | **Yes** | Default port is **8080** (Lovable sandbox detection), not 5173 |
| Hosted Supabase | **Yes** for `/waitlist` | `.env` has anon/publishable keys; waitlist also needs `SUPABASE_SERVICE_ROLE_KEY` |
| Lovable AI Gateway | **Yes** for `/try` | Set `LOVABLE_API_KEY` for `runClose` server function |

There is no `docker-compose` or local Supabase stack in this repo.

### Commands

See `package.json` scripts:

- **Dev:** `npm run dev` → http://localhost:8080/
- **Build:** `npm run build`
- **Preview:** `npm run preview`
- **Lint:** `npm run lint` (currently reports many pre-existing Prettier formatting issues)
- **Format:** `npm run format`

Package manager: **npm** (`package-lock.json`). Bun lockfile exists but npm is the primary path used in Cloud Agent setup.

### Environment variables

Committed `.env` includes Supabase URL and publishable keys (`SUPABASE_*`, `VITE_SUPABASE_*`).

Server-only secrets (not in committed `.env`):

- `LOVABLE_API_KEY` — required for `/try` AI generation
- `SUPABASE_SERVICE_ROLE_KEY` — required for `/waitlist` form submissions

Add these to `.env` or export them before starting the dev server. Restart `npm run dev` after changing env vars.

### Gotchas

- `@lovable.dev/vite-tanstack-config` owns Vite plugins (TanStack Start, Tailwind, Nitro). Do not duplicate them in `vite.config.ts`.
- `src/integrations/supabase/client.server.ts` is generated; reads `SUPABASE_SERVICE_ROLE_KEY` at request time via a Proxy.
- Nitro/Cloudflare deploy plugin is skipped outside Lovable Cloud (`No Lovable context detected` during build is expected locally).
- No automated test suite in this repo; verify with `npm run build`, `npm run lint`, and manual/browser checks of `/`, `/try`, `/waitlist`.
