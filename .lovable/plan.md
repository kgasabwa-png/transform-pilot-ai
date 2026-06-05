
# The honest 360° on Receipts

You asked for the truth. Here it is, from two specialists I ran in parallel: a market analyst and a CTO who actually read the codebase. Then a concrete pivot.

---

## 1. Is the problem real?

**Yes. 9/10.** This is not the issue.

- Median SaaS NRR fell from ~105% (2021) to ~101% (2024). SMB segment is at ~97% — net contraction. (ChartMogul, SBI, Cust 2026)
- 58% of SaaS companies report lower NRR than 2 years ago. Renewals are now board-level scrutiny.
- CS teams were decimated 2022–2024 (SaaStr: "The End of Customer Success as We Knew It"). CSMs carry 40–150 accounts. Every missed signal is lost ARR.
- Bain (2024): most CS motions are still reactive — CSMs hear about churn *from the customer*.

The pain is acute, worsening, and budgeted. Not the problem.

## 2. Is the market open?

**Crowded but with one genuinely unoccupied corner.**

Already in the room:
- **Incumbents:** Gainsight (launched Atlas AI agents May 2025, acquired Staircase AI + UpdateAI), ChurnZero (agentic teammates Oct 2025), Totango/Catalyst, Vitally, Planhat.
- **Revenue intelligence creeping in:** Gong, Clari.
- **AI-native direct competitors:** **Agency (Elias Torres, $20M Series A Nov 2025)** — this is the real threat, same pitch, much better funded. Cust.co (bootstrapped, draft-and-approve, closest workflow match). Pollen (YC W26, very early).

What none of them have:
- **Citations.** Nobody shows "we flagged this risk because the CFO said *exactly this* at 14:32 on the Oct 3 call." Every competitor surfaces a score or a recommendation. None shows the receipt.

**That's the only genuine white space.** "Agentic renewal desk" is now table-stakes marketing. "Every action carries the exact quote that triggered it" is unoccupied — and it's the one thing that makes CSMs trust AI-drafted CRM updates enough to approve them.

## 3. What did we actually build?

CTO review of the codebase, brutally honest:

- **100% synthetic.** `portfolio.ts`, `brief.ts`, `agents.ts`, `backtest.ts` are hand-authored TypeScript objects. The "47 renewals, 82% precision" backtest stats are hardcoded constants.
- **The "connected" Gong/Slack/Gmail/Salesforce green dots are string literals.** Theater.
- **No backend** beyond a `waitlist_signups` table. No queue, no cron, no auth wired, no RLS, no audit log, no multi-tenancy.
- **All the "Approve / Open drafted email / Log to Salesforce" buttons have no onClick handlers.** Visual only.
- **One thing actually works:** `src/lib/loop/anthropic.ts` — paste your Anthropic key + a transcript, get a real cited close-package back. The system prompt is genuinely good. **This is the only live AI in the product, and it is also the most valuable thing in the repo.**

CTO verdict: a designed prototype with no product underneath. UI quality and domain model are real (6/10 buildability). The full vision is a Series A product, not a solo-founder MVP.

## 4. Honest verdict

| Dimension | Score |
|---|---|
| Market need | 9/10 |
| Differentiation (as currently pitched) | 6/10 |
| Defensibility | 5/10 |
| Solo-founder feasibility (full vision) | 5/10 |
| **Overall** | **6.3/10 — narrow hard, don't kill** |

**This is not wasted work.** The UI is good. The domain model is correct. The Anthropic wedge actually works. The waitlist captures real signups. What's broken is the *scope of the pitch* — "four agents reading every channel overnight" is a Series A product you cannot ship solo and that Agency will out-fund you on.

**You haven't built the wrong thing. You've built the right thing's marketing site.** Now you need to put a working product behind one tile of it.

## 5. The pivot — narrow, ship, sell

One sentence: **"The renewal tool that shows its work."**

Drop "agentic renewal desk." Lead with **Receipts** — the trust mechanic — as the brand, not the agents.

ONE channel, ONE action, ONE buyer, ONE differentiator:

| Decision | What |
|---|---|
| Channel | Call transcripts (paste or upload — no Gong API yet) |
| Action | Drafted renewal/risk follow-up email + CRM update note (copy-to-clipboard, no SFDC API yet) |
| Buyer | VP CS at $5M–$30M ARR SaaS with 5–15 CSMs |
| Differentiator | Every sentence in the draft links back to the exact quote that justified it |
| Price | $500–$800/CSM/month — target $60–150K ARR per logo |

Kill from the surface: the four-agent narrative, the fabricated 47-renewal backtest, the fake "connected" integrations, the Manager/VP screens. Keep them as the roadmap, not the product. Investors and design partners get a real working thing instead of a deck.

## 6. What I'd actually build (4–6 weeks, solo, on Lovable)

This fits inside Lovable Cloud + TanStack Start. No Gong partner agreement, no SFDC ISV cert, no SOC 2 blocker.

1. **Auth + workspace** — Supabase Auth (email + Google). One `workspaces` table, `members`, `packages`. RLS from day one.
2. **Server-side Anthropic proxy** — move `anthropic.ts` from browser to a `createServerFn`. Project owns the key. Adds rate-limit + cost control + the ability to swap models. Keeps the BYOK fallback for the public `/try`.
3. **The core loop:**
   - Paste transcript text (or paste a Zoom/Gong share URL → server-side scrape).
   - Returns a persisted `ClosePackage` keyed to the user/workspace.
   - Every claim renders with an inline citation chip → click expands to the quoted line in the transcript pane. (This already half-exists as `ReceiptModal`.)
4. **Approve / edit / reject** — real buttons that mutate state.
   - "Approve & copy email" → puts the edited draft on the clipboard + logs `approved_at`.
   - "Copy CRM update" → formatted note for paste into SFDC/HubSpot manually (no API needed for v1).
   - "Reject + why" → captures a reason. This is the proprietary feedback loop that becomes the moat.
5. **History** — list of past packages per workspace. "Did this renewal close?" outcome toggle. This becomes your backtest data (real, not fabricated).
6. **Landing page cleanup** — kill the fake numbers, the four-agent framing, the "connected" green dots. New headline: *"The renewal tool that shows its work."* Sub: *"Paste a call. Get a draft renewal email where every line cites the exact moment that justified it. Approve in 90 seconds."*
7. **Em-dash sweep** — replace `—` with `,` or `.` across all user-facing copy (you flagged this).

## 7. What we explicitly DON'T build now

- Four agents. Manager Coaching Room. VP Forecast Floor. (Roadmap, not product.)
- Gong / Salesforce / Slack / Gmail API integrations. (Each is a 4–8 week third-party process. Validate the wedge first.)
- SOC 2, SSO, multi-region, audit log UI. (Will block enterprise; mid-market design partners don't need it yet.)
- The fabricated backtest. Replace with: *"Send us 5 closed renewals from the last 12 months. We'll show you, with citations, what we'd have caught."* (Real concierge offer, no synthetic numbers.)

## 8. Will this be successful?

**Honest answer: it can be a real $1–3M ARR business in 18 months if you move fast and stay narrow.** It will not be the next Lovable or Cursor — the category is too vertical for that. The window is real but closing: Agency has the funding to crowd you out within 12 months. Your only asymmetric advantage is shipping a working "show your work" loop to 5 paying mid-market CSM teams before Agency or Gainsight Atlas can copy the citation UX.

If you're not willing to narrow this hard, my honest recommendation is to pause and pick a different problem — because you cannot out-engineer Gainsight or out-raise Agency on the full vision as a solo founder.

If you are willing to narrow — this is shippable in 4–6 weeks and demonstrably differentiated.

---

## What I need from you to proceed

1. **Approve the narrowing?** (Kill 3-persona desk, kill fake integrations, kill fabricated backtest, lead with "Receipts — shows its work.")
2. **Approve the MVP scope above** (auth + server-side Anthropic + persisted close packages + approve/edit/reject + history + cleaned landing)?
3. **Anything you want to keep** that I've proposed cutting?

Once you confirm, I'll switch to build mode and execute in focused passes — landing/positioning first, then auth + persistence, then the real approval loop.
