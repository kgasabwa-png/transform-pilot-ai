
# Per-User Gmail OAuth for Nyvlo

## Part 1 — Conceptual walkthrough

### Why this is the right wedge
Superhuman, Granola, Vimcal, Shortwave, Notion Calendar all do this. The user clicks "Connect Gmail," Google shows them a consent screen listing scopes, they click Allow, you get tokens. **IT is never involved** because the user is authorizing an app against their own account — same mechanism as "Sign in with Google," just with extra scopes. This is the cleanest PLG path: zero gatekeeper, zero procurement, zero security review.

### The actors
1. **Google Cloud project** (yours) — holds the OAuth client ID/secret, declares which scopes your app will ever request, and the consent screen branding (Nyvlo logo, support email, privacy policy URL).
2. **The user's Google account** — grants/revokes access.
3. **Nyvlo backend** — stores per-user refresh tokens, refreshes access tokens, makes Gmail API calls server-side.
4. **Nyvlo frontend** — kicks off the OAuth flow, shows connection status.

### The OAuth dance (Authorization Code flow with refresh)
```
User clicks "Connect Gmail"
   ↓
Nyvlo redirects → https://accounts.google.com/o/oauth2/v2/auth?...
   (params: client_id, redirect_uri, scope, access_type=offline, prompt=consent, state)
   ↓
Google shows consent screen ("Nyvlo wants to read & send email")
   ↓
User clicks Allow
   ↓
Google redirects → https://nyvlo.com/api/public/google/callback?code=XYZ&state=...
   ↓
Nyvlo backend POSTs code → https://oauth2.googleapis.com/token
   (with client_id + client_secret)
   ↓
Google returns: { access_token, refresh_token, expires_in: 3600, scope }
   ↓
Nyvlo stores refresh_token (encrypted) keyed to user_id
   ↓
Done — Nyvlo can now call Gmail API on behalf of this user forever
```

Key flags:
- `access_type=offline` — required to get a refresh token (without it you only get a 1-hour access token).
- `prompt=consent` — forces the consent screen so Google reliably re-issues the refresh token (Google sometimes omits it on repeat auths).
- `state` — CSRF token; you generate it, stash it in a short-lived cookie, verify on callback.

### Token lifecycle
- **Access token** — short-lived (1h), used in `Authorization: Bearer ...` header for Gmail API calls. Don't store; refresh on demand.
- **Refresh token** — long-lived (until user revokes, or 6 months of inactivity for unverified apps). Encrypted at rest. Used to mint new access tokens.

Refresh pattern: before each Gmail API call, check if cached access token is >55min old → if so, POST to token endpoint with refresh_token → cache new access token in memory (or short-TTL row).

### Scopes you need
- `https://www.googleapis.com/auth/gmail.readonly` — read inbox, threads, messages (extract promises from sent + received mail).
- `https://www.googleapis.com/auth/gmail.send` — send drafts on user's behalf (the watermarked follow-ups).
- `https://www.googleapis.com/auth/userinfo.email` — know which Gmail address you connected (so we can match it to the Nyvlo user).

Skip `gmail.modify` and `gmail.compose` for v1 — narrower scopes = less scary consent screen = higher conversion.

### The Google verification gatekeeper (the real catch)
Gmail scopes are "sensitive" + "restricted." Until your app is verified by Google:
- Unverified screen: "Google hasn't verified this app." User clicks "Advanced → Continue (unsafe)" to proceed.
- Cap of **100 users** total can grant access before you're hard-blocked.

For launch this is fine — 100 design partners. To remove the warning and lift the cap:
- Submit OAuth app for verification (form + privacy policy + ToS + demo video).
- Because Gmail is "restricted scope," you also need a **CASA security assessment** (3rd-party security audit, ~$1.5k–$15k, takes 4–8 weeks).

This is the real friction — but you don't need it until you've validated the wedge. Granola, Superhuman all went through this.

### Edge cases
- **User revokes access in Google account settings** → next refresh fails with `invalid_grant` → mark connection as disconnected, prompt re-auth.
- **User changes Google password** → refresh token still valid (Google doesn't invalidate on password change).
- **Multiple Gmail accounts** → store one connection per (user_id, gmail_address). v1 = single connection.
- **Token theft** → refresh tokens are bearer credentials. Encrypt at rest with a key from env (never plaintext in DB), restrict by RLS, never log.

### What you can do once connected
1. **Inbox scan**: pull last 30 days of sent mail → extract commitments ("I'll send you the deck by Friday") → seed promises table.
2. **Background sync**: poll every ~5 min via Gmail's `historyId` for new messages → detect new commitments in real time.
3. **Send drafts**: the killer feature — Nyvlo drafts a follow-up email and sends it from the user's Gmail with the watermark. Recipient sees it as a normal email from the user.
4. **Thread context**: when a promise comes due, pull the original thread for context in the agent UI.

---

## Part 2 — Build plan (sequenced)

### Phase 0 — Google Cloud setup (manual, ~30 min, you do this once)
1. Create Google Cloud project "Nyvlo Production."
2. Enable Gmail API + People API.
3. Configure OAuth consent screen: External, Nyvlo branding, support email, privacy + ToS URLs, scopes list (the 3 above), test users (your email + first design partners — up to 100 while unverified).
4. Create OAuth 2.0 Client ID (Web application). Authorized redirect URI: `https://transform-pilot-ai.lovable.app/api/public/google/callback` (+ preview URL + custom domain when added).
5. Copy client ID + secret → store as `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` secrets. (Already present per project secrets — reuse if they're the right project, otherwise add new.)

### Phase 1 — DB schema (1 migration)
New table `gmail_connections`:
- `id uuid pk`
- `user_id uuid` (→ profiles.id, unique — one Gmail per Nyvlo user for v1)
- `gmail_address text not null`
- `refresh_token_encrypted text not null` (encrypted via pgsodium or app-level AES-GCM)
- `scopes text[] not null`
- `connected_at timestamptz`
- `last_synced_at timestamptz`
- `last_history_id text` (for incremental sync)
- `status text` ('active' | 'revoked' | 'error')
- `last_error text`

Plus an `oauth_states` table (short-lived CSRF tokens, 10-min TTL):
- `state text pk`, `user_id uuid`, `expires_at timestamptz`

RLS: user can read their own connection row (but never the encrypted token — exclude via a view), service_role full access. GRANTs on both.

### Phase 2 — OAuth endpoints (server routes)
- `src/routes/api/public/google/start.ts` (GET) — authenticated user, generates state, redirects to Google.
  - Actually: needs to be on a non-`public` authenticated server function path since it requires the Nyvlo user session. Use a `createServerFn` that returns the URL, client navigates to it.
- `src/routes/api/public/google/callback.ts` (GET) — Google calls this. Exchanges code → tokens, looks up user via state, encrypts + stores refresh token, redirects to `/settings/integrations?gmail=connected`.

### Phase 3 — Token refresh + Gmail client helper
`src/lib/gmail/client.server.ts`:
- `getAccessToken(userId)` — fetch refresh token, swap for access token, cache in-memory with TTL.
- `gmailFetch(userId, path, init)` — wrapper that auto-refreshes on 401, returns parsed JSON.
- `disconnectGmail(userId)` — POST to revoke endpoint, delete row.

### Phase 4 — UI
- `src/routes/_authenticated/settings.integrations.tsx` — "Connect Gmail" button, connection status, disconnect button, last sync timestamp.
- Server function `getGmailConnectionStatus` — returns { connected, gmail_address, last_synced_at, status }.

### Phase 5 — First feature: inbox backfill (the value moment)
`scanInboxForPromises` server function (callable post-connect):
- Calls Gmail `users.messages.list?q=from:me newer_than:30d&maxResults=100`.
- For each message, fetch full body, run existing promise-extraction LLM prompt, insert into `promises` table with `source='gmail'`, `evidence_snippet=<quoted text>`, embedding (reuses the embedding pipeline we just shipped).
- Updates `last_synced_at` and `last_history_id`.
- UI: progress bar "Scanning your sent mail… found 14 promises so far."

This is the wow moment. User connects → 30 seconds later sees 14 things they forgot they committed to.

### Phase 6 (later, not in this plan) — Background sync via Gmail watch/history
- Pubsub push notifications or a 5-min cron polling `history.list?startHistoryId=...`.
- Verification submission to Google + CASA.
- Send drafts via `users.messages.send`.

### Scope of THIS plan
Phases 0–5. Phase 0 you do manually in Google Cloud. Phases 1–5 are roughly **2–3 days of build work**: ~1 migration, 2 server routes, 1 settings UI, 1 backfill server function, integration with existing extraction + embedding pipeline.

### Technical details (collapsed for non-technical readers)
- Encryption: Node `crypto.createCipheriv('aes-256-gcm', ...)` with a 32-byte key from `GMAIL_TOKEN_ENC_KEY` secret (we'll add via `add_secret` in build mode). IV per row, stored alongside ciphertext.
- State cookie: httpOnly, secure, SameSite=Lax, 10-min expiry.
- Redirect URI must match exactly what's registered in Google Cloud — including protocol and trailing slash behavior. Plan adds both prod + preview URIs upfront.
- Reuse the existing `LOVABLE_API_KEY` Gemini pipeline for extraction (no new model wiring).

### What I'll need from you before building
1. Confirm Google Cloud project access (you'll need to create the OAuth client and paste the secret).
2. Confirm whether the existing `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` secrets are for Nyvlo's production project or for "Sign in with Google" — if the latter, we add new secrets (e.g. `GMAIL_OAUTH_CLIENT_ID`) to keep auth and Gmail-data scopes on separate clients (recommended — different consent screens, easier verification path).

Approve this plan and I'll start with the migration + secret setup.
