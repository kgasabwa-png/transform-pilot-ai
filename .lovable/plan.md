# Ledgerline /console revamp — autonomy, signals, personas

Goal: turn `/console` from a generic stat dashboard into the renewal early-warning system YC-grade reviewers will recognize as a company, not a feature. Three concurrent moves: a real autonomy model, a "world layer" of external signals, and persona-aware views.

---

## 1. Autonomy: blast-radius decides what CAN auto, confidence decides what DOES

Two-axis model on every drafted action.

**Blast radius** (set by action type, not editable per-action):
- `internal` — CRM field updates, internal Slack notes, CSM tasks, manager alerts → eligible for auto
- `customer-facing` — emails, calendar invites to customers, recap docs shared with champion → always human approval
- `money` — discount offers, renewal-quote changes, contract edits → always human approval + manager co-sign over a $ threshold

**Confidence** (assigned by the agent, 0–100):
- `>90` "high" — ships automatically if blast radius is `internal`. Logged with 1-click revert.
- `60–90` "medium" — batched into a Quick Review (swipe approve/skip, ~90s for 20 items).
- `<60` "low" — individual card with full evidence, "the agent isn't sure, here's why."

Rule: an action only auto-ships when BOTH `internal` AND `high`. Everything else queues for the right review lane. This is the pitch line: **"Autonomous on the inside. Human on the outside. The agent gets more autonomous as it learns your bar."**

Reverts feed back into confidence calibration (already hinted at by the existing override toast — make it the headline mechanic).

---

## 2. The world layer — external signals

Add a third signal source alongside calls and CRM. Each signal becomes a Watch item that the agent can promote into an action when paired with internal evidence.

Signals to wire (server-side only, never from the browser):
- **LinkedIn champion/buyer changes** — title changes, "former," new role at competitor. Source: Firecrawl scrape of public LinkedIn profile URLs the user adds per account (no LinkedIn API auth required for public pages).
- **Acquisitions / funding / layoffs** — Firecrawl `search` with `tbs: 'qdr:w'` over customer company names, filtered to news domains. Summarized via Lovable AI Gateway.
- **Hiring signals** — job posts mentioning competitor products (optional v1.1).

Storage: a `world_signals` table keyed by `account_id`, with `kind`, `headline`, `source_url`, `detected_at`, `severity`, `raw_json`. Read-only from the client via a server fn.

UI: signals appear in a new "Watch" lane (see §3). When a signal correlates with an existing call-derived risk, the agent bundles them into a single Motion ("Champion left + procurement pushback on the 4/18 call → exec-to-exec by Friday").

Pitch upgrade: **"Three signal layers — the call (what they said), the system (what they did), the world (what's happening to them). Pinned together, with citations."**

---

## 3. Review UX: confidence lanes, persona-aware

Replace the current `/console` body with three lanes. Lane content varies by persona (toggle wired in this pass).

```text
┌─────────────────────────────────────────────────┐
│  [ CSM ]  [ Manager ]  [ Leader ]      autonomy │ ← persona toggle + dial summary
├─────────────────────────────────────────────────┤
│  SHIPPED WHILE YOU SLEPT   (high-conf, internal)│
│  • 14 CRM updates · 6 Slack notes · 3 tasks     │
│  • each row: action · account · revert (30d)    │
├─────────────────────────────────────────────────┤
│  QUICK REVIEW                       (medium)    │
│  swipe deck · approve / skip / open             │
│  "20 items, ~90 seconds"                        │
├─────────────────────────────────────────────────┤
│  NEEDS YOUR JUDGMENT                (low + $$)  │
│  full cards: evidence, why not sure, options    │
├─────────────────────────────────────────────────┤
│  WATCH                          (world signals) │
│  not actions yet — promotable to motions        │
└─────────────────────────────────────────────────┘
```

**Persona variations** (use existing `src/lib/loop/personas.ts`):
- **CSM view** — lanes show only the CSM's book. Header reads "3 saves waiting on you." No org-wide $ stats. Watch lane shows per-account signals.
- **Manager view** — adds a team strip on top ("4 CSMs · 12 saves shipped · 2 escalations"). Lanes aggregate across the team. Override toast surfaces "your team corrected the agent 8× this week — bar drift?"
- **Leader view** — the current `/console` framing belongs here ($ARR protected, capacity returned, coverage). Confidence-lane summary collapses to a single audit log; the headline is the trend graph ("87% → 94% auto-ship rate this quarter").

---

## 4. Concrete file changes

### New
- `src/lib/loop/autonomy.ts` — types for `BlastRadius`, `Confidence`, helper `canAutoShip(action)`.
- `src/lib/loop/worldSignals.ts` — client-safe types + sample data shaping.
- `src/lib/loop/worldSignals.functions.ts` — `createServerFn` wrappers: `listWorldSignals(accountId?)`, `refreshWorldSignals()` (calls Firecrawl + AI Gateway server-side).
- `src/lib/loop/worldSignals.server.ts` — Firecrawl + AI Gateway logic, reads `FIRECRAWL_API_KEY` / `LOVABLE_API_KEY` from `process.env` inside the handler.
- `src/components/loop/ConfidenceLanes.tsx` — the three-lane shell.
- `src/components/loop/lanes/ShippedLane.tsx` — auto-shipped log + revert.
- `src/components/loop/lanes/QuickReviewLane.tsx` — swipe deck for medium confidence.
- `src/components/loop/lanes/JudgmentLane.tsx` — full evidence cards for low / money.
- `src/components/loop/lanes/WatchLane.tsx` — world signals, promote-to-motion button.
- `src/components/loop/PersonaToggle.tsx` — CSM / Manager / Leader segmented control.
- `src/components/loop/AutonomyDial.tsx` — compact summary chip in the header ("Auto-ship rate: 87% · 2 reverts this week").
- DB migration: `world_signals` table with proper grants + RLS (auth required, scoped by `org_id`).

### Modified
- `src/lib/loop/actions.ts` / `src/lib/loop/motions.ts` — add `blastRadius` and `confidence` fields to sample data; categorize existing actions correctly.
- `src/routes/console.tsx` (or wherever `/console` lives) — replace body with `<PersonaToggle />` + `<ConfidenceLanes />`. Keep current Leader-style stats but only render them under the Leader persona.
- `src/lib/loop/personas.ts` — extend to drive lane visibility/labels per persona.

### Untouched this pass
- `/` landing page (separate pass)
- `SaveRoom` / `ApprovalQueue` (will be folded into the new lanes in a follow-up; left intact so nothing breaks during this revamp)
- Brand, typography, color tokens

---

## 5. Connectors / secrets needed

- **Firecrawl** connector — for LinkedIn public profiles + news search. Server-side only; injects `FIRECRAWL_API_KEY`. Will request linking when build mode starts.
- **Lovable AI Gateway** — already provisioned (`LOVABLE_API_KEY`). Used to summarize raw scrape/search results into structured `WorldSignal` rows.
- No LinkedIn OAuth connector (public-page scraping only, avoids per-user auth complexity in v1).

---

## 6. What this buys, in one sentence per audience

- **YC reviewer:** "Three signal layers, graduated autonomy, every action revertible and cited — that's a company, not a Gainsight feature."
- **VP of CS (buyer):** "I can see the auto-ship rate climb week over week. My team stops doing post-call admin. Renewals stop surprising me."
- **CSM (user):** "I open Monday morning, swipe through 20 things in 90 seconds, then spend real time on the 3 saves that need me."

---

## 7. Out of scope for this plan (call out so we don't sneak it in)

- Rewriting the `/` landing hero (separate pass — already discussed)
- Real LinkedIn OAuth / Sales Navigator integration (v2)
- Manager co-sign workflow on money actions (stub the gate now, build the second-approver flow next pass)
- Replacing the existing `SaveRoom` route (deprecate after lanes prove out)
