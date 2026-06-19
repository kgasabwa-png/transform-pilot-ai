# Kill manual tokens — desktop + extension auto-auth

Goal: end-user never sees a token. Sign in once, everything else is automatic.

## 1. Shared auth primitives (web app)

New public server route: `src/routes/api/public/auth/device-exchange.ts`

- `POST /api/public/auth/device-exchange` — body `{ code }`. Validates a one-time device code minted by the web app (`device_codes` table, 60s TTL, single use). Returns `{ access_token, refresh_token, user }` from the user's Supabase session.
- `POST /api/public/auth/device-start` — desktop/extension calls this anonymously, gets `{ code, verification_url }` where `verification_url = https://<app>/link?code=...`. Code is pending until the signed-in user approves it.
- `GET /api/public/auth/device-poll?code=...` — client polls until approved, then receives tokens.

New table `device_link_codes (code text pk, user_id uuid null, status text, created_at, approved_at, consumed_at)` with RLS + grants. Anon can insert (start) and select own row by code; authenticated can update own pending row to approve.

New authenticated route `src/routes/_authenticated/link.tsx`:
- Reads `?code=...`, shows "Link your Nyvlo desktop app / extension?" with Approve button. On approve, calls a server fn that stamps `status='approved', user_id=auth.uid()`.

This replaces the entire "extension token" UI flow.

## 2. Desktop app rewrite (Electron)

`desktop/main.cjs`:
- On launch, check `electron-store` for refresh token. If missing → open default browser to `/link?code=<new>` via `device-start`, poll `/device-poll` until approved, persist tokens.
- Register custom protocol `nyvlo://` so the web `/link` page can deep-link `nyvlo://linked?code=...` back into the app (faster than polling; polling is the fallback).
- IPC exposes `getAccessToken()` to renderer; auto-refreshes via Supabase refresh endpoint.

`desktop/renderer/app.js`:
- Remove the token textarea + save/load logic.
- All `fetch(TRANSCRIBE/CAPTURE)` calls use `Authorization: Bearer ${await window.nyvlo.getAccessToken()}`.
- Status surface: "Signed in as <email>" + Sign out.

`desktop/renderer/index.html`: drop token UI; keep record/reset/timer/transcript.

Server routes `api/public/extension/transcribe.ts` and `capture.ts` start accepting `Authorization: Bearer <supabase access token>` (verify via `supabase.auth.getUser(token)`) in addition to current legacy token, so we don't break anything mid-migration.

## 3. Browser extension auto-auth

`extension/manifest.json`:
- Add `"host_permissions": ["https://*.nyvlo.com/*", "https://*.lovable.app/*"]` and `"permissions": ["cookies", "storage"]`.

`extension/popup.js` / new `extension/background.js`:
- On install + on popup open, call `chrome.cookies.get` for the Supabase auth cookie on the web app origin. If present, read the access token from it and store in `chrome.storage.local`.
- If absent, popup shows a single "Sign in to Nyvlo" button that opens the web app `/auth` in a new tab. Once user signs in there, the cookie exists and the extension picks it up on next open (no copy-paste).
- All content scripts (`gmail.js`, `linear.js`, `notion.js`, `slack.js`) use the stored token via `chrome.storage.local.get`.

Note: Supabase JS stores the session in `localStorage`, not a cookie, by default. To make this work we add a small shim on the web app (`__root.tsx`) that mirrors the access token into a non-HttpOnly cookie `nyvlo-at` scoped to the app domain on every auth state change. The cookie is readable by the extension via `chrome.cookies` but not by other origins (SameSite=Lax, Secure). Acceptable for our threat model since it's the same token already in localStorage.

## 4. Settings cleanup

`src/components/nyvlo/ExtensionSection.tsx`:
- Remove generate/copy/revoke token UI entirely.
- Keep: "Download desktop app", "Install browser extension", and the muted-sources list.
- Add a "Linked devices" list backed by `device_link_codes` (label, last seen, revoke).

## 5. Out of scope this turn

- Native macOS calendar auto-detect (priority 4 from earlier — separate turn).
- Founder demo seed mode (separate turn).
- Removing the legacy extension token tables — keep them dormant until all clients are migrated, then drop in a follow-up.

## Technical notes

- All new server routes under `/api/public/auth/*` — verify nothing returns PII beyond the signed-in user's own email/id.
- `device_link_codes`: anon insert + select-by-code only (no list); authenticated update only own pending row via RLS using a per-code claim approach (we'll use a `claim_code(code)` SECURITY DEFINER RPC instead of granting broad UPDATE).
- Electron deep link: register `nyvlo://` in `main.cjs` via `app.setAsDefaultProtocolClient` + `second-instance` handler.
- Extension cookie shim: ~10 lines in `__root.tsx` inside the existing `onAuthStateChange` listener.
