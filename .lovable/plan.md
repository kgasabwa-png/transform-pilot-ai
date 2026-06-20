## Goal

Two things, shipped together:

1. **`/try` becomes a real demo account.** Visitors land in the actual app with realistic seeded data — every screen works because it *is* the app, not a static mockup.
2. **Action agents.** Introduce the "Chief of Staff" surface: a chat that can draft, research, and (with permission) execute, plus one-click action buttons on every promise.

This is the wedge vs Granola/Reader/Attention: they *capture*, we *act*.

---

## Part 1 — Real demo account

### Behavior
- `/try` button on the landing page → signs the visitor into a shared `demo@nyvlo.app` account → drops them at `/today`.
- A persistent "You're in the demo. Sign up to use your own inbox →" banner across every authenticated page when the active user is the demo user.
- Demo account has seeded: 12 promises (mix overdue/today/upcoming/kept), 8 memory items, 3 fake connector "connections" (Gmail, Calendar, Notes — marked as demo), 30 days of reliability history, sample agent chat thread.
- Demo writes are allowed (mark done, dismiss, send a draft) but a nightly reset restores the seed.

### Why this approach
The "expand static demo" path means maintaining a parallel UI forever. Real-account demos scale: every feature we build is automatically in the demo.

### Safety
- Demo user role = `demo` (new enum value), checked server-side to block: connecting real OAuth, sending real email, paying.
- All "Execute" tier actions short-circuit in demo with a toast: "Demo mode — this would send the email in your real account."

---

## Part 2 — Action agents

### Action catalog (server-side tools)

| Tool | Tier | Description |
|---|---|---|
| `draft_email_reply` | Draft | Generates a reply to a promise/thread. Returns text + subject. |
| `draft_meeting_brief` | Draft | Pulls context for an upcoming meeting → markdown pre-read. |
| `draft_status_update` | Draft | Summarizes progress on a project/person → posts to chat. |
| `research_person` | Research | Internal: all email/notes/promises involving X. Optional web enrich. |
| `research_topic` | Research | Cross-source query: "what did we agree with Acme on pricing?" |
| `prep_for_event` | Research | Calendar event → people, last threads, open promises both ways. |
| `web_research` | Research | Lovable AI + search: "Marcus Lee Linear funding" → structured brief. |
| `send_email` | Execute | Sends drafted email via Gmail (requires write scope, per-action confirm). |
| `create_calendar_event` | Execute | Same, calendar.events scope. |
| `mark_promise_done` | Execute | Internal, always available. |

Built with AI SDK `tool` + `inputSchema` + `execute`, called from a `streamText` agent loop with `stopWhen: stepCountIs(50)`. `send_email` and `create_calendar_event` use `needsApproval`.

### Two UI surfaces

**A. Chief of Staff chat (`/agent`)**
- New route, added to the sidebar.
- Persistent thread per user (one conversation per user for v1 — we can add threading later).
- AI Elements composer + message list, renders tool calls + results inline.
- System prompt includes: user name, today's date, open promises summary, recent memory items.
- All action-catalog tools available.

**B. Per-promise action menu**
- Every `DemoRow` / `PromiseRow` gets: `Draft reply` · `Prep` · `Research` · overflow menu.
- Clicking runs the tool inline, expands the row with the result, lets user edit and approve.

### Backend

- Server route `src/routes/api/agent.ts` — `useChat` transport for `/agent`.
- Server function `src/lib/agent/run-tool.functions.ts` — single-tool invocations from row buttons.
- Tools live in `src/lib/agent/tools/` — one file each, all imported by both surfaces.
- Lovable AI Gateway, default model `google/gemini-3-flash-preview` for chat, `google/gemini-2.5-pro` for research-heavy tools.

---

## Part 3 — Fix the immediate bugs

- `/try` sidebar tabs are non-clickable `<div>`s — replaced by the real sidebar once /try is the real app.
- Hydration error on `DemoRow` (server renders "Monday", client renders "Tuesday") — caused by `toLocaleDateString(weekday)` evaluating in different timezones. Replaced with deterministic relative labels computed from a server-stable timestamp.

---

## Build order

1. Hydration fix on `/try` (10 min, unblocks current preview).
2. Demo account: seed migration, `demo` role, server-side guards, `/try` → sign-in-and-redirect, demo banner.
3. Action tool catalog (just `draft_email_reply`, `research_person`, `prep_for_event`, `mark_promise_done` for v1).
4. Per-promise action buttons wired to single-tool server fn.
5. `/agent` Chief of Staff chat surface.
6. Execute-tier tools (`send_email`, `create_calendar_event`) gated behind real Gmail write scope + per-action approval — last because they need OAuth scope expansion.

Steps 1–5 are this turn's scope. Step 6 is its own follow-up because adding Gmail write scope requires user-visible OAuth consent changes.

---

## Out of scope this turn

- Threaded conversations in `/agent` (one thread per user for v1).
- Background/scheduled agent runs ("every morning, draft my top 3 follow-ups").
- Multi-user shared agent context.
- Execute-tier tools (deferred to next turn — needs OAuth scope decision).

---

## Open question before I start

The plan above ships **steps 1–5 in one turn**. That's a lot. Two alternatives if you'd rather slice smaller:

- **Slice A (recommended):** Steps 1 + 3 + 4 only. Fix /try bugs, add the action tool catalog, wire row buttons. Skip the real demo account *and* the chat surface this turn. Smallest unit that demonstrates "we action things."
- **Slice B:** Steps 1 + 2 only. Real demo account, no agents yet. Demo first, agents next turn.
- **Full plan:** Everything 1–5.

Tell me which slice and I build it.
