# The rebuild

The current app shows three views of the same data. That's the bug. We rebuild around one wedge — **save the renewal** — with three surfaces that do *different jobs* in service of one number (NRR). Every agent ships motions on one click. Every screen makes the dollars saved visible in real time.

## Name

Drop "Receipts — the closing crew" and "Night-shift." Outcome-verb shortlist I'll bring back as the final pick:

- **Renew** — too generic alone, but **Renew.ai** or **Renew/CS** works.
- **Anchor** — "anchor every renewal." Strong, premium.
- **Hold** — "hold the line on NRR." Punchy, founder-y.
- **Compound** — the NRR math itself. My favorite for a Series-A pitch.
- **Tether** — agents tether the team to what the customer actually said.

I'll lead with **Compound** in the build (compound = NRR's whole job), tagline *"the agent team that compounds your renewal book."* If you hate it, one find-replace swaps it.

## The wedge: Save the Renewal

One concrete motion the product runs end-to-end, demoed on the landing → /app flow:

```text
Signal detected ──► Save play drafted ──► CSM approves (1 click)
   │                      │                       │
   │                  cited quotes            simulated ship:
   │                                          • email to 3 stakeholders
   │                                          • exec save-call invite
   │                                          • CRM stage + risk update
   │                                          • Slack brief to manager
   │
   └─► live ticker: "+$180k ARR pulled back from churn"
```

This is the "oh my god" moment. Nothing on the market does this end-to-end on one click today.

## Three surfaces, three jobs (not three dashboards)

| Surface | Persona | Job to be done | Primary object |
|---|---|---|---|
| **The Save Room** | CSM | Approve/edit/ship save plays | DraftedMotion (multi-step, not single email) |
| **The Pit** | Manager | Unblock CSMs, redistribute book, intervene on stuck saves | Bottleneck (stuck motion, overloaded CSM, missed signal) |
| **The Tape** | VP / CCO | Defend the forecast number with cited quotes | ForecastDelta (every dollar moved, with the moment that moved it) |

The Save Room is the demo hero. The Pit and The Tape are visibly *consuming the outputs* of the Save Room (not parallel views of the same data) — that's how we prove the personas are differentiated.

### CSM — The Save Room
Not an "approval queue of emails." A queue of **Motions**: a single card = a whole save play with 4-6 atomic steps (email Maya, email economic buyer, book exec call, update CRM, post Slack brief, schedule follow-up). One [Ship the save] button runs all of them in a simulated 2-second sequence ("Sending to Maya… Sent. Booking exec call… Booked. CRM updated. Manager notified."). Inline edit on any step. Override sends feedback to the agent.

The "open" action that's currently broken opens a **Motion Detail** drawer with: cited quotes (already wired to ReceiptModal), each step previewable, account context, and the dollar at stake. Clicking the account name opens AccountDrawer (already exists, needs to be wired from this surface too).

Header metric: **"$ pulled back from churn this week"** — increments live as motions ship.

### Manager — The Pit
Not "coaching moments." A **bottleneck board**: which saves are stuck and why, which CSMs are over capacity, which signals fired but no motion was generated (agent gap), which CSM commits the conversation grade contradicts. Every row has a one-click action: *reassign account*, *escalate to me*, *send the agent a stronger prompt*. Manager's job is unblocking, not coaching, so the surface unblocks.

Header metric: **"saves at risk of stalling"** + **"$ unblocked today"**.

### VP — The Tape
A single living NRR number with a scrubbable timeline of every dollar moved this quarter, agent-attributed and quote-cited. Click any delta → the call moment that caused it. A "what the CFO will ask" panel pre-answers the three audit questions (*how do you know? who said it? when?*). Concierge backtest CTA: *"Send us 10 closed renewals — we'll show which saves Compound would have run."*

Header metric: **the Q-end NRR number with ± uncertainty**, ticking as the Save Room ships.

## Things being fixed along the way

- All hard-coded `Nov 11` / `Tuesday` strings ripped out. Already have `src/lib/loop/time.ts` — just use it everywhere.
- Hydration error on the topbar timestamp (server vs. client tz). Fix: render the timestamp client-side only (suppressHydrationWarning + mount gate).
- "Open drafted email" and clicking account names — both made real (drawer + modal already exist, just unwired here).
- Body type baseline raised. Anything below `text-xs` for non-mono accents removed.
- Drop the live "4 agents working" chrome — replace with the live $ ticker, which is the actual product proof.

## What I touch

**Rewritten** — these become the new product:
- `src/routes/app.tsx` (thin shell, rename tabs to Save Room / Pit / Tape, fix hydration)
- `src/components/loop/ApprovalQueue.tsx` → renamed/rewritten as `SaveRoom.tsx`
- `src/components/loop/CoachingRoom.tsx` → rewritten as `Pit.tsx`
- `src/components/loop/ForecastFloor.tsx` → rewritten as `Tape.tsx`
- `src/lib/loop/actions.ts` → upgraded to **Motions** (multi-step, not single actions)
- `src/lib/loop/personas.ts` → trimmed, persona = surface, not framing copy

**New**:
- `src/lib/loop/motions.ts` — Motion = ordered steps + cited evidence + $ at stake
- `src/lib/loop/bottlenecks.ts` — Pit data model
- `src/components/loop/MotionCard.tsx` — the new hero card
- `src/components/loop/ShipSequence.tsx` — the 1-click multi-step simulated ship
- `src/components/loop/LiveTicker.tsx` — $ pulled back from churn, shared across surfaces
- `src/components/loop/MotionDetailDrawer.tsx` — what "open" actually opens

**Reused as-is**: `AccountDrawer.tsx`, `ReceiptModal.tsx`, `OverrideModal.tsx`, `time.ts`, `portfolio.ts`, `brief.ts`.

**Landing (`src/routes/index.tsx`)**: update copy to lead with "Save the Renewal" and rename Receipts → Compound. Same structure, different headline + tagline + agent block.

## What I'm NOT doing this turn

- No real LLM calls (that's its own build — the demo is fully scripted).
- No backend writes (everything is in-memory; "ship" is a 2-second simulated sequence).
- No pricing page, no /backtest route (those come after you've shown this to 3 design partners).

## Open question I'm deciding for you unless you object

Tab labels in the topbar. I'll ship them as **Save Room · Pit · Tape** with the persona name as the small eyebrow above each. Tell me to flip it if you want persona-first.
