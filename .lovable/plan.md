## Goal

Remove every trace of the old "Fluent AI Transformation" template so this project is only Receipts, and replace the broken Sign in flow with a clean pre-launch waitlist.

## What's leftover from Fluent (confirmed)

- Routes: `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/routes/_authenticated.tsx`, `src/routes/_authenticated/dashboard.tsx`, `src/routes/_authenticated/projects/$projectId.tsx`, `src/routes/_authenticated/projects/new.tsx`
- Server fns: `src/lib/transformation.functions.ts` (Fluent intake/scoring schema)
- DB tables (public): `organizations`, `projects`, `company_intakes`, `transformation_scores`, `use_cases`, `roadmap_items`, `risks`, `governance_artifacts`, `adoption_artifacts`, `generated_outputs`, `profiles`
- Index header links `to="/login"` ("Sign in") and `to="/signup"` ("Request access") — both land in Fluent's dashboard, which is what the user just hit

## Changes

### 1. Delete Fluent code
- Remove the 6 route files above. After deletion the only routes are `/` (landing), `/app` (workspace demo), `__root`, plus the new waitlist route.
- Remove `src/lib/transformation.functions.ts`.
- `src/routeTree.gen.ts` regenerates automatically.

### 2. Drop Fluent DB tables (migration)
Drop all 11 tables above with `CASCADE`. Also drop any Fluent-specific enums/functions/triggers they created (e.g. `handle_new_user` trigger that auto-inserts a profile row). This kills the "Unauthorized: No authorization header" runtime error too, since nothing will call protected server fns anymore.

Note: `profiles` is part of the Fluent scaffold, not Receipts. Receipts has no user data yet, so dropping it is safe. We can add a Receipts-shaped profiles table later when real auth ships.

### 3. Replace Sign in with Waitlist
- New route `src/routes/waitlist.tsx` — single email capture, branded as Receipts ("Become a design partner"), success state inline.
- New table `public.waitlist_signups` (email, source, note, ts) with RLS: anon `INSERT` only, no `SELECT` for anyone except `service_role`. Standard GRANT block.
- New server fn `src/lib/waitlist.functions.ts` — `joinWaitlist({ email, note? })`, no auth middleware, uses `supabaseAdmin` to insert. Validates email with zod, rate-limit-friendly (unique constraint on lower(email)).
- Update `src/routes/index.tsx`:
  - Header: remove the `to="/login"` Sign in link. Keep a single `to="/waitlist"` "Request access" CTA.
  - Footer: same swap.
  - The existing `mailto:founders@receipts.dev` "Become a design partner" button on the Wedge section → point to `/waitlist` instead (keeps everything in-product).

### 4. Auth posture
No login/signup, no `_authenticated` gate. `/app` stays publicly viewable as the interactive demo (matches the "no login" promise already in the hero copy). `attachSupabaseAuth` middleware in `src/start.ts` stays — harmless without protected fns.

### 5. Rename the Lovable project
I can't rename the Lovable project from code. After this ships: click the project name in the top-left of the editor → **Rename project** → enter `Receipts`. That changes the dashboard label and the stable preview URL slug. The codebase, routes, and copy are already Receipts.

## Out of scope (not touching)

- The `auth`, `storage`, `realtime`, `supabase_functions`, `vault` schemas.
- `src/integrations/supabase/*` auto-generated files.
- `src/integrations/lovable/index.ts` (matched on "login" string, not Fluent-specific).

## Result

Zero Fluent references. Sign in is gone. Header CTA → `/waitlist`. Database is Receipts-only. No more 401 errors in the preview.
