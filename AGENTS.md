# AGENTS.md

## Cursor Cloud specific instructions

This repo is **Nyvlo** — an AI "promise/commitment capture" product. The only locally-runnable service is the **web app** (a TanStack Start + Vite SSR app at the repo root that also serves all `/api/*` routes). The backend (Supabase Postgres/Auth, the Lovable AI gateway, Stripe) is **hosted/SaaS**, not booted locally.

### Services & how to run them

- **Web app (root)** — dev: `npm run dev` (or `bun dev`) → serves on `http://localhost:8080` (port is fixed by `@lovable.dev/vite-tanstack-config`, not 5173). Build: `npm run build`. Lint: `npm run lint`. Format: `npm run format`.
- **Desktop app** (`/desktop`, Electron) and **Swift sidecar** (`/desktop/sidecar`, macOS-only) and the **browser extension** (`/extension`, load-unpacked) are optional capture clients with their own setup; not needed to run/test the core web app.

### Non-obvious gotchas

- **Package manager mismatch:** both `bun.lock` and `package-lock.json` are committed and they resolve to *different* dependency trees. The startup update script uses `npm install` (npm is always present). `bun install` also works if you install bun first. Pick one and stick with it for a session — switching package managers rewrites `node_modules` and triggers a Vite dependency re-optimize.
- **Do not commit churn:** running install/dev/build mutates `package-lock.json` and regenerates `src/routeTree.gen.ts` (TanStack router plugin). Revert these unless you intentionally changed deps/routes.
- `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which already injects `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, nitro (build), env injection, and the `@` alias — do **not** add these plugins manually or the build breaks with duplicate plugins.
- **Lint is pre-existing-dirty:** `npm run lint` currently reports thousands of pre-existing prettier/eslint errors across the repo (not caused by setup). The tooling works; expect a non-zero exit on the untouched tree.
- **Missing secret for AI features:** `LOVABLE_API_KEY` (server-side) is not committed. Without it, AI flows (chat/agent under `/agent`, promise drafting on `/try`, transcription, embeddings) return errors. Supabase URL/anon key are committed in `.env`; the Stripe test publishable key is in `.env.development`.
- **No-secret smoke test:** the public `/try` route is a fully client-side demo workspace (no auth/AI key needed) — good for verifying the app runs (navigate views, mark a promise done). Email/password signup via `/auth` requires email confirmation, so it can't complete fully in this environment.
