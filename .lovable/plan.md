
# Per-user Gmail via Nylas

Bypass the 4–12 week Google verification gauntlet by using **Nylas** as the OAuth + email API layer. Each Nyvlo user clicks "Connect Gmail," authorizes through Nylas's already-verified Google app, and we get a per-user grant ID we use to read/send mail on their behalf.

Recommended: **Nylas** (mature, white-label OAuth, ~$0.20/user/mo on the v3 free tier up to 5 connected accounts, then paid). Unipile is the cheaper challenger — same architecture, swap the SDK if pricing bites later.

## How it works (the wedge)

```text
User clicks "Connect Gmail" in Nyvlo
  → redirect to Nylas hosted auth URL (their Google client, their consent screen)
  → user grants gmail.readonly + gmail.send to "Nylas"
  → Nylas redirects back to /api/public/nylas/callback with a code
  → we exchange code → grant_id (per-user, persistent)
  → store grant_id in gmail_connections (keyed to user_id)
  → all future Gmail calls: Nylas API + grant_id, no token refresh logic
```

Nylas owns: Google verification, OAuth flow, token refresh, API normalization, deliverability monitoring. We own: the grant_id ↔ user_id mapping and the UI.

## What we don't need anymore

- Our own Google Cloud OAuth client for Gmail scopes
- Google verification (Nylas is already verified for restricted scopes)
- Token refresh code, encryption-at-rest concerns for refresh tokens
- `oauth_states` PKCE table

## What we do need

### Phase 1 — Nylas account + DB (~30 min)

User-side:
1. Sign up at nylas.com (free tier)
2. Create a v3 application
3. Grab `NYLAS_CLIENT_ID` and `NYLAS_API_KEY`
4. Add redirect URI: `https://transform-pilot-ai.lovable.app/api/public/nylas/callback` (+ preview URL)

Agent-side migration `gmail_connections`:
```text
id uuid pk
user_id uuid → auth.users (unique)
provider text default 'nylas'
grant_id text not null            -- Nylas per-user identifier
email text not null               -- connected gmail address
scopes text[]
connected_at timestamptz
last_sync_at timestamptz
status text default 'active'      -- active | revoked | error
created_at, updated_at
```
RLS: user can read/delete their own row only; inserts/updates via service role in server fn. GRANTs to authenticated + service_role per house rules.

Secrets to add: `NYLAS_CLIENT_ID`, `NYLAS_API_KEY`, `NYLAS_API_URI` (default `https://api.us.nylas.com`).

### Phase 2 — OAuth wiring (~1 hr)

- Server fn `getNylasAuthUrl()` — builds Nylas hosted auth URL with state = signed user_id
- Public route `/api/public/nylas/callback` — verifies state, exchanges code for grant_id via Nylas API, upserts `gmail_connections`, redirects to `/settings/integrations?connected=gmail`
- Server fn `disconnectGmail()` — calls Nylas grant delete + soft-deletes row

### Phase 3 — Gmail helper (~30 min)

`src/lib/gmail.functions.ts`:
- `listMessages({ query, limit })` — wraps `GET /v3/grants/{grant_id}/messages`
- `sendMessage({ to, subject, body, threadId? })` — wraps `POST /v3/grants/{grant_id}/messages/send`
- `getThread(threadId)`

All authed via `requireSupabaseAuth` → look up grant_id by `context.userId` → call Nylas with `NYLAS_API_KEY`.

### Phase 4 — Settings UI (~45 min)

`/settings/integrations` route:
- Disconnected: "Connect Gmail" button → calls `getNylasAuthUrl` → `window.location.href = url`
- Connected: shows email, connected date, "Disconnect" button
- Connection status pulled via `useSuspenseQuery(getGmailConnection)`

## Tradeoffs the user should know

| | Nylas path | Own Google OAuth |
|---|---|---|
| Time to ship | This week | 4–12 weeks (verification) |
| User cap | Unlimited from day 1 | 100 until verified |
| Cost at scale | ~$0.20–1/user/mo | Free |
| Vendor risk | Nylas could change pricing or go down | None |
| Branding | Consent screen says "Nylas" not "Nyvlo" (acceptable on free tier, custom branding is a paid add-on) | Says "Nyvlo" |

For YC demo + first 1000 users: Nylas wins. Migration to own OAuth later is straightforward — same data model, swap the API client.

## Out of scope for this plan

- Real-time inbox sync via Nylas webhooks (add in a follow-up)
- Multi-account per user (one Gmail per Nyvlo user for v1)
- Outlook / iCloud (Nylas supports both — same code path, different provider param)

## Confirm before I build

1. Nylas vs Unipile — going with **Nylas v3**?
2. After you've created the Nylas app, I'll request `NYLAS_CLIENT_ID` + `NYLAS_API_KEY` via the secret tool. Want me to start Phase 1 (migration + UI shell) now so it's waiting when you have the keys?
