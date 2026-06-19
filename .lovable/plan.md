
# Nyvlo MVP — Real Product Build

Goal: a logged-in user connects Google Calendar + Gmail, and Nyvlo automatically surfaces forgotten promises, drafts replies, tracks reliability, and sends an end-of-day recap. Everything below replaces the current seeded demo.

## What ships

1. **Auth** — Email/password + Google sign-in (Lovable-managed). Per-user data with RLS.
2. **Connect Google Calendar + Gmail** — per-user OAuth (Test mode, no Google verification needed for ≤100 testers). Read-only scopes.
3. **Ingestion** — pull last 30 days of calendar events + sent Gmail messages on first connect; incremental sync after.
4. **AI extraction loop** — Gemini reads each event/email and extracts structured commitments: who, what, when promised, due date, source, confidence.
5. **Persistence** — `promises`, `memory_items`, `connections`, `agent_runs`, `reliability_snapshots`, `profiles` tables with RLS.
6. **Surfaces wired to real data** — Today, Promises, Memory, Command Center, Settings all read from DB.
7. **Drafted replies** — AI generates an email draft per promise (copy-to-clipboard for v1; "Send via Gmail" later).
8. **Reliability Score** — computed from kept vs. missed promises.
9. **Nightly agent (pg_cron)** — re-syncs sources, ages stale promises, recomputes score, generates end-of-day recap.
10. **Command Center chat** — RAG over the user's promises + memory items, streaming.

Out of scope for v1: Chrome extension, Slack/Notion/Linear, sending email through Gmail, billing.

## Architecture

```text
Browser (TanStack)
  ├─ /auth                  → Lovable Cloud auth (Google + email)
  ├─ /app/* (gated)         → reads via createServerFn → Supabase (RLS as user)
  └─ /app/command           → useChat → /api/chat (RAG over user's data)

Server (TanStack)
  ├─ createServerFn handlers  app-internal reads/writes
  ├─ /api/chat                streaming Command Center
  ├─ /api/oauth/google/start  per-user Google OAuth (Calendar+Gmail scopes)
  ├─ /api/oauth/google/callback  exchange code → store refresh_token (encrypted) in connections
  └─ /api/public/cron/*       pg_cron-triggered: sync, recap, score

AI: Lovable AI Gateway, model google/gemini-3-flash-preview
```

## Database (one migration)

- `profiles` (id=auth.uid, full_name, email, timezone)
- `connections` (user_id, provider='google', access_token, refresh_token, expiry, scopes, email)
- `sources` (user_id, kind='calendar_event'|'gmail_message', external_id unique per user, raw jsonb, occurred_at, processed_at)
- `promises` (user_id, summary, owed_to, channel, source_id, due_at, status='open'|'kept'|'missed'|'dismissed', confidence, draft_reply, created_at, last_nudged_at)
- `memory_items` (user_id, source_id, title, snippet, occurred_at, kind)
- `agent_runs` (user_id, kind='sync'|'extract'|'recap', started_at, finished_at, stats jsonb, error)
- `reliability_snapshots` (user_id, date, score, kept, missed, open)

All tables: `GRANT` to authenticated + service_role, RLS enabled, policies scoped to `auth.uid() = user_id`. Refresh tokens accessed only via service-role server fns.

## OAuth (per-user Google) — the honest constraint

We register a Google Cloud OAuth client (Web app) with scopes:
`openid email profile`, `calendar.readonly`, `gmail.readonly`.

- App in **Testing** status → works immediately, no Google review, but capped at 100 test users (you add their emails as testers). Perfect for demo + early beta.
- Going to Production later requires Google's OAuth verification (security assessment for Gmail scopes, 2–6 weeks).
- We store `client_id` + `client_secret` as Lovable secrets; UI in Settings shows "Connect Google" button → `/api/oauth/google/start` → consent → callback stores tokens.

## Sync + extraction pipeline

On connect, and then on nightly cron:

1. **Sync**: pull new Calendar events (`updatedMin`) and sent Gmail messages (`q=in:sent newer_than:30d`) → upsert `sources`.
2. **Extract** (batched, ~20 items/run): for each unprocessed source, Gemini returns structured JSON: `{ promises: [{summary, owed_to, due_at, confidence, draft_reply}], memory: {title, snippet} }`. Use AI SDK `Output.object` + Zod schema.
3. **Persist** promises + memory_items. Mark source `processed_at`.
4. **Age**: promises with `due_at < now() - 24h` and still `open` → flagged "forgotten" in UI.
5. **Recap** (nightly): generate an end-of-day summary per user → store as a memory_item; later surface via email/push.
6. **Score**: `reliability = kept / (kept + missed)`, snapshotted daily.

## Surfaces (wired to real data)

- **Today** — open promises due today, today's meetings with AI prep, stat tiles from `reliability_snapshots`.
- **Promises** — filterable list from `promises`, expandable to show `draft_reply` + source quote.
- **Memory** — `memory_items` timeline, searchable.
- **Command Center** — streaming chat. Server fetches top-N relevant promises + memory items by keyword/recency (simple v1, not vector), injects into prompt, streams answer.
- **Settings** — Connect Google (status, last sync, disconnect), timezone, sign out.

## Cron (pg_cron → /api/public/cron/*)

- `*/15 * * * *` — incremental sync for users connected in last 24h or with stale `last_synced_at`.
- `0 23 * * *` (user tz approximated server-side) — end-of-day recap + reliability snapshot.

Endpoints require `apikey` header (Supabase anon). Bodies empty.

## What you need to do (the only manual step)

Create a Google Cloud OAuth client and give me 3 things via the secret prompt:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- (I'll auto-fill the redirect URI for you to paste back into Google Cloud)

I'll provide step-by-step instructions when we get there.

## Build order (so you can demo at each checkpoint)

1. Migration: tables + RLS + GRANTs.
2. Auth: Google + email/password, `_authenticated` gate, profile auto-create trigger.
3. Settings page + OAuth flow + connection storage.
4. Sync server fns + initial backfill on connect.
5. AI extraction server fn + wire into sync.
6. Today / Promises / Memory pages on real data.
7. Command Center streaming chat with RAG.
8. pg_cron jobs + recap + reliability score.
9. Landing page CTA → `/auth`.

## Technical notes

- AI SDK with `createLovableAiGatewayProvider` (already exists in `src/lib/ai-gateway.server.ts`).
- `requireSupabaseAuth` middleware on all app-internal server fns.
- Refresh-token handling: server fn `getGoogleAccessToken(userId)` refreshes if expired, updates row.
- Gmail body parsing: use `messages.get?format=metadata` for the list, `format=full` for ones we extract from (cheaper).
- Calendar: `events.list?singleEvents=true&orderBy=startTime`.
- Lovable AI model: `google/gemini-3-flash-preview` everywhere.
- Public landing remains SSR; `/app/*` lives under `_authenticated/`.

Approve and I'll start with the migration.
