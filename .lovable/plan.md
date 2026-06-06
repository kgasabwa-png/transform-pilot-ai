# Rebrand Compound → Ledgerline + landing rewrite

Turn Compound into Ledgerline and apply the feedback from the review. Keep Compound's stronger voice and the Proof Ledger interaction (which Ledgerline doesn't have); fold in Ledgerline's stronger moat (verbatim-quote pinning) and its sharper "score vs. do the work" framing.

## 1. Rebrand (mechanical)

- `src/components/brand/Logo.tsx` — rename wordmark / aria labels if any
- `src/routes/index.tsx` — every "Compound" → "Ledgerline", page title + og tags
- `src/routes/__root.tsx` — site-wide `og:site_name`, JSON-LD Organization name
- `src/routes/waitlist.tsx`, `src/routes/app.tsx`, `src/routes/try.tsx` — visible "Compound" strings, page titles, og tags
- Footer email `founders@compound.dev` → `founders@ledgerline.dev`
- Ledger row currently labeled "Compound" → "Ledgerline"
- No file renames, no route changes, no schema changes

## 2. Landing rewrite (`src/routes/index.tsx`)

Apply the critique directly:

**Hero** — keep Compound's rhythm, fold in Ledgerline's moat:
- H1: **"The save, already shipped."** (keep — strongest line we have)
- Sub-promise reframed around the actual moat: every drafted line pinned to the verbatim quote it came from. One signature ships it.
- Cut the 90-word marketing paragraph; two short lines max.
- Eyebrow stays specific ("For CSMs carrying a renewal book").

**Kill the AI/corporate tells flagged in the review:**
- No "post-sale execution layer", no "auditable", no "renewal grade", no "defend to the CFO"
- Break up three-noun lists ("retention, adoption, and expansion")
- Tighten every paragraph to 2–3 sentences

**Proof section** — the differentiator. Keep the ledger interaction (tools + window filters), but:
- Add a verbatim-quote line under entries that have one ("Stage staged" → quote: *"…we'd want to lock pricing before the board meeting"*). This IS the Ledgerline moat made visible.
- Eyebrow → "Every line pinned to the call"
- Headline tightened.

**Why-now section** — keep the "score vs. do" frame (it's sharper than Compound's current "every CS tool tells you the customer is at risk"):
- New H2: **"Your dashboard scores the account. We do the work."**
- Two short paragraphs, no fabricated stats.

**Stats handling** — the review flagged uncited "2 of 3 hours" and "+8 to 18 NRR points" as trust-erosive. We don't add them. The Proof ledger numbers (tools touched / actions staged / 1 signature) stay — those are real because they're computed from the on-page data.

**Header nav** — rename if ambiguous; current "Proof / Why now / Partners" is fine, keep.

**Partner quote** — keep the structure, keep "Illustrative" disclaimer (honest), light copy edit.

## 3. What we deliberately do NOT do

- No new sections, no new routes, no backend changes
- No new stats with fake citations
- No design system overhaul — typography, colors, layout stay
- Don't touch `/app`, `/waitlist`, `/try` beyond the brand-name swap
- No em-dashes in user-facing copy (your standing rule)

## Files touched

- `src/routes/index.tsx` (main rewrite + rebrand)
- `src/routes/__root.tsx` (site name / JSON-LD)
- `src/routes/waitlist.tsx`, `src/routes/app.tsx`, `src/routes/try.tsx` (brand strings only)
- `src/components/brand/Logo.tsx` (if it carries the wordmark text)

## Out of scope (ask if you want them next)

- Domain / package.json name change
- Database table renames
- Generating an `og:image` for Ledgerline
- Building a `/cascade`-style "watch it run on a real call" page like Ledgerline has
