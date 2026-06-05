
# Rebuild the desk — from "dashboard with personas" to "agents that closed work for you while you slept"

You're right on every point. The current `/app` is a beautiful dashboard wearing a persona dropdown — same data, same layout, fake November dates, dead "Open drafted email" buttons, clicking an account does nothing. That's exactly what Gainsight/ChurnZero already are. We need to leave that lane.

This is a full rebuild of `/app`. Landing page stays untouched.

---

## The core reframe

**Stop showing the user *what the agents saw*. Show them *what the agents already did*, and ask them to approve, edit, or override.**

Every screen answers one question for that role:
- **CSM:** "What's about to ship in your name in the next hour? Approve or change it."
- **Manager:** "Where is one of your CSMs about to lose ARR? Coach the moment, not the metric."
- **VP:** "Which dollars in this quarter's forecast just moved, and what action did the agents take on them?"

Same engine. Three genuinely different first screens, three different action surfaces, three different success metrics.

---

## Rename

`Receipts — Night-shift Agents` → **`Receipts — the closing crew`**

Tagline: *"Four agents that closed your book overnight. You approve the ship."*

Drop "night-shift" everywhere (it's wrong — it runs continuously). Drop "Live" badge.

---

## New name for the screen

Not "desk". Not "dashboard". **`The Approval Queue`** for CSM, **`The Coaching Room`** for manager, **`The Forecast Floor`** for VP. Different names because they're different products sharing an engine.

---

## What changes by persona — concrete

### CSM → "The Approval Queue"
A vertical stack of **draft actions** the agents prepared overnight, each one a card:
- *"Send this re-engagement email to Devin Park at Halcyon Health"* → full email body shown inline, edit-in-place, **[Approve & Send]** / [Edit] / [Skip] / [Reject + tell us why]
- *"Update Halcyon renewal stage: Commit → Risk"* → CRM diff shown, [Approve] / [Override]
- *"Book a 15-min exec sync with Renee Okafor (new CFO at Northwind)"* → calendar slots pre-negotiated against her open times, [Confirm]
- *"Flag Blueprint as expansion — auto-draft proposal?"* → [Yes, draft it] / [Not yet]

Bottom of every card: **"Why" panel** — the 2-3 cited quotes that justify the action. Click any quote → ReceiptModal (already built).

Today metric at top: **"$340K in renewals advanced. 6 actions awaiting your approval. Avg time-to-approve: 47 sec."**

### Manager → "The Coaching Room"
Not "team rollup". A feed of **coachable moments** the agents flagged from this week's calls across the team:
- *"Maya missed a buying signal on the Tessera call (00:14:22) — here's the moment, here's what to say next time"* → 30-sec transcript clip + suggested coaching note, [Send to Maya] / [Discuss in 1:1]
- *"Dre is over-discounting — 3 deals this week dropped >15% in final stage without exec approval"* → pattern + raw evidence
- *"Team has a blind spot on procurement signals — 4 missed in 30d. Run a 20-min workshop? [Generate]"*

Top metric: **"3 coaching moments this week likely to add $84K ARR next quarter."**

### VP → "The Forecast Floor"
A single living number: **Q3 forecast: $4.82M ± $310K**, with a **changelog of every dollar that moved this week** and which agent moved it.
- *"Renewal-Risk downgraded Quill Media -$180K. Cite: procurement BCC'd competitor RFP."* → [Audit] / [Override forecast]
- *"Expansion-Scout promoted Blueprint +$240K. Cite: procurement standardization signal."*
- Toggleable: "Show me only the deltas your CSMs haven't seen yet." → highlight gap.

Bottom: **"Run concierge backtest on your last 15 closed renewals → see what we'd have caught."** (Carries Claude's idea forward.)

---

## The actions actually work

Today every CTA is dead. After this rebuild:
- **Send email** → opens a real send confirmation modal, the email body is editable, "Send" simulates send with a success toast + the action moves to "Shipped today" panel. (Real Gmail integration is a later sprint; for MVP, the *simulation feels real* — animation, toast, persistent shipped-today log.)
- **Override forecast / CRM diff** → opens an override modal asking "why" (one click reasons: *bad signal*, *missing context*, *wrong account*) — that "why" becomes training data displayed back as *"You've corrected Renewal-Risk 3x this week — it's learning your bar."*
- **Click an account name** → opens an account drawer with the timeline of agent actions on that account, every receipt clickable.

Every button does something visible. No dead ends.

---

## Make it real, not theatrical

- **Real current date** (Friday, June 5, 2026 — use `new Date()`, never hardcode "Nov 11").
- **Realistic relative timestamps**: "2h ago", "overnight", "this morning at 6:14a" — generated from `new Date()` so they're never stale.
- **Bigger type**. Minimum body 14px, metadata 12px (currently 10-11px). Eyebrow labels stay small but only as accents.
- **Sample-book honesty**: Keep the banner. Add a tiny "Sample data" tag on every fabricated number (the $340K, the 247 conversations, the testimonial). Removes the credibility bomb Claude flagged.

---

## What we keep
- The four agents (`AGENTS`) and their charters — they're good.
- The ReceiptModal — it's the right primitive.
- The portfolio data (`ACCOUNTS`, `briefAccount`) — feeds the new screens.
- The landing page — untouched.

## What gets removed/rebuilt
- The current 3-column desk layout in `/app` — replaced.
- The "Today's brief" left rail in current form — folded into the Approval Queue.
- The persona dropdown stays but it now genuinely switches *layout + actions + metrics*, not just copy.
- "Night-shift Live" pill — gone.

---

## Tech plan (for the technical reader)

**New files:**
- `src/lib/loop/actions.ts` — typed model of `DraftAction` (email | crm-update | meeting | flag | forecast-move), with status (`pending` | `approved` | `shipped` | `overridden`), evidence array, persona visibility, ARR impact.
- `src/lib/loop/coaching.ts` — `CoachingMoment` model for manager view.
- `src/lib/loop/forecast.ts` — `ForecastDelta` log + rolled-up number for VP view.
- `src/components/loop/ApprovalQueue.tsx` — CSM screen.
- `src/components/loop/CoachingRoom.tsx` — manager screen.
- `src/components/loop/ForecastFloor.tsx` — VP screen.
- `src/components/loop/ActionCard.tsx` — the universal "draft action with approve/edit/reject" card.
- `src/components/loop/SendConfirmModal.tsx` — animated simulated send.
- `src/components/loop/AccountDrawer.tsx` — opens on account-name click; timeline of agent actions per account.
- `src/components/loop/ShippedToday.tsx` — running log of what got approved/sent today.

**Rewritten:**
- `src/routes/app.tsx` — becomes a thin shell: top bar + persona switcher + renders one of the three persona screens. All logic moves into those components.
- `src/lib/loop/personas.ts` — extended with per-persona action filters and screen component reference.
- `src/lib/loop/brief.ts` — repurposed into source data for `actions.ts`, no longer rendered directly.

**Untouched:**
- `src/routes/index.tsx` (landing).
- `src/routes/try.tsx` (sample-book entry).
- `src/components/loop/ReceiptModal.tsx`.
- All `ACCOUNTS` / portfolio data.

**Date handling:** all "today/overnight" strings derived from `new Date()` at render time with a `relativeTime()` util — no hardcoded months ever.

**Typography pass:** raise body to `text-sm` (14px), data labels to `text-xs` (12px), keep `text-[10px]` only for `font-mono` eyebrow accents. Done in one sweep across the new components.

---

## Scope guard

This is a meaningful rebuild — roughly 8–10 new files, one big rewrite of `app.tsx`, and a typography sweep. The landing page is untouched. No backend changes, no Claude integration yet (still simulated, but the simulation now *feels real* because the buttons actually do things and shipped actions persist in component state).

If you approve, I'll execute the whole thing in build mode in one pass and walk you through the three screens when it's ready.

---

## One open question before I build

**The persona switcher** — today it's a dropdown in the top bar. Three options:

1. **Keep the dropdown** (lowest friction, but undersells the difference).
2. **Three tabs across the top** ("Approval Queue" / "Coaching Room" / "Forecast Floor") — makes the three products feel distinct, lets the demo viewer click through all three in 10 seconds.
3. **Three separate routes** (`/app/queue`, `/app/coaching`, `/app/forecast`) — most "real product" feel, separate URLs to share.

My recommendation: **#2 (tabs)** for the MVP demo. It maximizes the "wow, this isn't just three views of the same dashboard" moment without the routing complexity of #3. Tell me if you want a different one.
