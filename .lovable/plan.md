## Honest self-rating (where I think we are)

**Landing: 7/10.** The hero promise lands ("night-shift research desk") but the page asks too much before it earns it. 9 sections, ~530 lines. A first-time CSM scrolls past 3 stat blocks, an agent ticker, an interactive sandbox, a persona switcher, agent roster, social proof, and a wedge — and still hasn't seen one concrete artifact (the brief, the receipt, the override). Positioning is text-heavy where it should be product-heavy.

**Workspace (`/app`): 6/10.** It's where the user's "crowded" comment hits hardest. Today's Brief, persona hero, leader/manager rollup, portfolio table, controls bar, signal drawer, autopilot ticker, agent roster, overnight feed, footer — stacked vertically with no visual rhythm. The thing that should be the *hero* of the workspace (the brief) gets ~one screen, then the page becomes a research paper. The B&W is fine and on-strategy (austere, "we're not selling you a dashboard"), but density is the real problem, not color.

**Integration story: 3/10.** We claim to read calls, Slack, and email — but no logos, no "connect Gong / Slack / Salesforce" surface anywhere. For a VC pitch this is the first thing they ask about. We need a visible integrations row (even if it's brand marks + "connected" status) and one screen that shows the data sources behind a receipt.

**Trust/security: 4/10.** Single "SOC 2 in progress" footnote. CS leaders sign procurement. Need a posture strip.

## Target: 9/10

Three moves, in order:

### 1. Reposition the landing around one product moment, not nine sections

Cut to **four sections** (from nine):
- **Hero** — same headline, but replace the 4-stat row underneath with the actual 90-second brief artifact (the same one from `/app`'s "Today's Brief"), rendered inline as if it were Tuesday morning. The product becomes the proof.
- **How it works** — three steps with one screenshot each: ① agents read overnight, ② brief lands at 7:42a, ③ every claim cites the source (clickable receipt). Replace the prose-heavy "Augment, never replace" + "Personas" sections.
- **Integrations + trust strip** — logos row (Gong, Chorus, Salesforce, HubSpot, Slack, Zendesk, Intercom, Gmail, Notion) + posture chips (SOC 2 in progress, data isolation, no shared training, EU residency on request). One band. Earns the procurement conversation.
- **Wedge + CTA** — keep the design-partner pitch, slim it to ~6 lines. Single CTA: Request access.

Delete from landing: AutopilotTicker, AgentRoster (move to /app only), the interactive sandbox section, the persona switcher (move to /app), social proof block (replace with 1 founder quote inline in wedge). Net: ~530 lines → ~280 lines.

### 2. Restructure `/app` into a two-pane "desk" instead of a 10-section scroll

Today the workspace is a marketing page wearing a product costume. Rebuild as a real product surface:

```text
┌─ Top bar: Receipts · CSM/Mgr/Leader switch ─────────────┐
├─ Left rail (240px)         │  Right pane                │
│  • Today's brief (3)        │                            │
│  • Watchlist (8)            │   [Selected item view]     │
│  • Overnight feed (47)      │                            │
│  • Agents (4)               │   Hero state: today's #1   │
│  • Integrations             │   play, expanded, with     │
│                             │   receipts + draft email   │
└─────────────────────────────┴────────────────────────────┘
```

- Default right-pane state = the #1 play of the day, fully expanded (brief + receipts + draft action + "Send to Gong / Salesforce" affordance). The thing users came to see is on screen at load.
- Everything else (full portfolio table, overnight feed, agent roster) lives behind left-rail clicks. The page no longer scrolls forever; it behaves like Linear/Superhuman.
- Persona switch in top bar (not a separate hero section per persona — same shell, different prioritized list).
- Keep B&W. The density problem isn't color; austere monochrome is part of the "we don't sell dashboards" wedge. Add ONE accent (the existing green status dot) and use it sparingly for live/active state only.

### 3. Make integrations a first-class object, not a claim

- New `src/lib/loop/integrations.ts` — 9 connectors with status (`connected`, `available`, `coming-soon`), data type they pull, last sync time.
- Left-rail "Integrations" view in `/app` shows the grid with connect/disconnect affordances (mocked — clicking "Connect" flips state in local component state, no real OAuth yet; we wire real OAuth when a design partner picks their stack).
- Every receipt in the drawer gets a source chip: `Gong · Aug 14 call · 23:14`. Already partially there; make it consistent and clickable (opens a modal with the cited quote highlighted in transcript).
- Landing integrations strip pulls from the same data, so the claim and the product agree.

## What I'm NOT changing

- Color system (stays monochrome + one green dot). User explicitly left this to me; the wedge benefits from austerity.
- Brand voice / hero copy. It's working.
- The four agents, persona system, brief/portfolio/backtest data files in `src/lib/loop/*`. The data layer is fine; we're restructuring the surface.
- Waitlist flow. Already clean.

## Technical sketch

- `src/routes/index.tsx` rewritten down to ~280 lines, four sections, inline brief artifact (extracted into a shared `<TodaysBriefCard />` component used on both landing and `/app`).
- `src/routes/app.tsx` rebuilt as a two-pane shell. New: `src/components/workspace/LeftRail.tsx`, `RightPane.tsx`, `PlayDetail.tsx`. Existing `TodaysBrief`, `PortfolioTable`, `OvernightFeed`, `AgentRoster` survive as right-pane views, not stacked sections.
- New `src/lib/loop/integrations.ts` (9 connectors, ~80 lines).
- New `src/components/integrations/IntegrationsStrip.tsx` (logos band for landing) + `IntegrationsGrid.tsx` (workspace view).
- New `src/components/landing/TrustStrip.tsx` (SOC 2, data isolation, no shared training, EU residency).

## Out of scope (call them out so we don't pretend)

- Real OAuth into Gong/Salesforce/Slack — needs design partner + their tenant. Mocked for now with honest "Connect" affordance.
- Real auth on `/app` — still a public demo. Login goes in the moment we have a paying design partner.
- Email sending from the workspace ("Send to…" is a draft-only affordance until real integrations exist).

## Pitch positioning (the one line for YC/VCs)

> "Receipts is the night-shift research desk for CS teams. Four specialist agents read every call, Slack thread, and email on your book overnight, and leave each CSM a 90-second brief at 7:42a — with every claim cited back to the moment the customer said it."

We already have this on the landing. The work above is making the product *match* that sentence in one glance instead of nine.
