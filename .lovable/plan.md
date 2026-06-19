# Nyvlo capture roadmap

Goal: make Nyvlo trustworthy first, then make capture effortless without per‑user OAuth gymnastics. Everything below ships as one queued backlog — I'll work top-down and check in after each phase.

## Phase 1 — Trust (this turn)

The product can't be useful if users don't believe the promises it shows. Fix this before adding more capture surfaces.

1. **Anti-hallucination guard in extraction**
   - Change the Gemini prompt to return `null` (and nothing else) when the source text contains no concrete commitment from the user.
   - Reject low-confidence extractions (< 0.55) server-side instead of saving them.
   - Require every promise to carry a verbatim `evidence_snippet` copied from the source — if the model can't quote it, we don't save it.
2. **Show the source on every promise**
   - `PromiseRow` already has an evidence area; surface it inline (not only in Details) and add a "Source" link to the originating `sources` row (email, page URL, transcript).
   - Add a "Not a promise" button → marks `status='dismissed'` + writes a `feedback` row we can use to tune extraction later.
3. **Migration**: `promises.evidence_required = true` default; `extraction_feedback` table (promise_id, verdict, user_id).

Exit criteria: I can paste a vague paragraph and Nyvlo refuses to invent a promise; every shown promise has a visible quote.

## Phase 2 — Browser extension auto-capture (broadscope)

One extension, content scripts per site, no OAuth, no admin approval. Each script watches the DOM of a page the user already has open and POSTs structured text to `/api/public/extension/capture` (already built) with the existing token auth.

- **Gmail web** (`mail.google.com`): when a thread view opens, read sender/subject/body of the focused message, debounce, send once per thread-open. User sees a small Nyvlo pill in the thread header — click to confirm or mute that thread.
- **Slack web** (`app.slack.com`): on message hover, show a "Capture" affordance; auto-capture DMs sent *by* the user (those are the promises that matter) with channel + recipient context.
- **Notion** (`www.notion.so`): capture the current page title + selected block on a hotkey (⌘⇧K). Full-page auto-capture is too noisy.
- **Linear** (`linear.app`): on issue open, capture title + description + assignee; on comment-by-user, capture the comment.
- **Generic fallback**: existing "capture selection" already works everywhere else.

All five share one content-script framework + per-site adapter. Manifest gets `host_permissions` for those four domains. No background polling — strictly reactive to what the user is already looking at, which is what makes it not creepy and not an admin problem.

Exit criteria: open a Gmail thread → promise appears in inbox within 5s, with the email body as evidence and a link back to the thread.

## Phase 3 — Desktop app for meeting audio (Electron + local Whisper)

Browser extensions can't reliably capture system/mic audio across Zoom/Meet/Teams/Granola/in-person. A small Electron app can.

- **Electron shell** packaged via `@electron/packager` (per the desktop-app knowledge).
- **Audio capture**: `navigator.mediaDevices.getDisplayMedia({ audio: true })` for system audio + `getUserMedia` for mic, mixed locally. User picks "start recording" before a call.
- **Local transcription**: bundle `whisper.cpp` WASM (no cloud, no per-minute cost, runs on the user's machine). Falls back to Lovable AI `openai/gpt-4o-mini-transcribe` if WASM init fails.
- **Promise extraction**: transcript → existing extraction server function → promises appear in the same inbox tagged `channel='meeting'`.
- **Auth**: same extension token model; the desktop app is just another client.

Exit criteria: record a 5-minute call, get a transcript and 0–N promises with timestamped evidence.

## Phase 4 — Polish (after the above land)

- Per-source mute (don't capture this thread / this channel / this Notion page again).
- Daily digest email via the existing email infra to remind on the day's promises.
- Optional Gmail OAuth for users who want passive background capture without keeping the tab open — additive, not required.

## Technical notes

- Phase 1 touches: `src/lib/nyvlo/extension.functions.ts` (extraction prompt + guards), new `supabase/migrations/*_evidence_required.sql`, `src/components/nyvlo/PromiseRow.tsx`, new `extraction_feedback` table with GRANTs + RLS.
- Phase 2 touches: new `extension/content/` directory with `gmail.js`, `slack.js`, `notion.js`, `linear.js`, shared `core.js`; `extension/manifest.json` gets `content_scripts` + `host_permissions`; rebuild zip.
- Phase 3 touches: new `desktop/` directory with `main.cjs`, `renderer/`, `whisper-wasm/`; new `package.json` scripts; output to `/mnt/documents/Nyvlo-{platform}.zip`.
- No new secrets needed. No per-user OAuth in this roadmap.
- Cost shape: Phase 1 same as today. Phase 2 increases extraction calls — mitigated by the `null` guard and per-thread debounce. Phase 3 transcription is free (local Whisper).

## What I'll do after you approve

Build Phase 1 end-to-end, verify it, then start Phase 2 in the same session without stopping for confirmation between sub-steps. I'll check in when Phase 1 is shippable and again when the Gmail content script is working — those are the two moments where you'd want to course-correct.
