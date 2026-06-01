# Fluent — Build Plan

A production-ready SaaS for AI transformation execution. Landing → auth → dashboard → intake → AI-generated execution package with 8 output tabs.

## Design System (locked from "Executive Editorial")

- Palette: background `#fcfcfc`, foreground `#121212`, primary `#0047ff`, muted `#666`, border `rgba(18,18,18,0.08)`.
- Typography: Inter Tight (display), Inter (body), JetBrains Mono (labels/metrics).
- Motion: subtle `slideUp` reveal on scroll; restrained.
- Components: large rounded cards (rounded-2xl/3xl), shadow-2xl panels on white, mono uppercase eyebrow labels, score cards with thin progress bars, status pill badges.
- Tokens go verbatim into `src/styles.css` as oklch equivalents + raw hex CSS vars; fonts loaded via `<link>` in `__root.tsx`.

## Backend (Lovable Cloud + AI Gateway)

Enable Lovable Cloud (Supabase) and Lovable AI Gateway. Tables (all with RLS scoped to `auth.uid()` via `organization_id` ownership):

- `profiles` (id=auth.users.id, full_name, role, org_id)
- `organizations` (id, name, owner_id)
- `projects` (id, org_id, name, status, created_at)
- `company_intakes` (project_id PK, all 17 intake fields as jsonb + typed columns)
- `generated_outputs` (project_id, section enum, content jsonb, version, updated_at)
- `transformation_scores` (project_id, category, score, rating, explanation, risk_level, recommendation, next_action)
- `use_cases` (project_id, name, department, problem, opportunity, complexity, risk_level, impact, data, tools, owner, timeline, metric, quadrant)
- `risks` (project_id, title, severity, owner, mitigation)
- `roadmap_items` (project_id, horizon[30/60/90/365], task, owner, timeline, priority, dependencies, risks, metric)
- `governance_artifacts` (project_id, kind, content_md)
- `adoption_artifacts` (project_id, kind, content_md)

Trigger: auto-create profile + personal org on signup.

Edge function `generate-transformation`: takes `project_id`, loads intake, calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with tool-calling to extract structured JSON per section, persists into the appropriate tables. One function with `section` param to allow per-section regeneration. Handles 429/402 with clean errors.

## Routes (TanStack Start, file-based)

Public:
- `/` — landing (executive editorial layout from prototype)
- `/login`, `/signup`, `/reset-password`

Authenticated (`/_authenticated/`):
- `/dashboard` — project list + aggregate scores
- `/projects/new` — multi-step intake wizard (17 fields, 5 steps)
- `/projects/$id` — output package shell with 8 tabs:
  - A. Executive Summary
  - B. Maturity Assessment (10 scored categories with cards)
  - C. Use Case Discovery (list + filters)
  - D. Prioritization Matrix (2x2 quadrants)
  - E. Governance Package (collapsible artifacts)
  - F. Adoption Package
  - G. Roadmap (30/60/90/365 horizons)
  - H. Metrics (score cards)

Each tab: edit-in-place (rich text via textarea+markdown render), Regenerate button (calls edge fn with `section`), Copy-to-clipboard per artifact.

## Intake Wizard (5 steps, 17 fields)

1. Company: name, industry, employee count, departments (multi-select)
2. Current AI state: tools, maturity (slider), data sensitivity, compliance reqs
3. Goals & challenges: business goals, operational challenges, desired outcomes
4. People: leadership alignment, employee readiness, change management maturity (sliders)
5. Constraints: timeline, budget range

On submit: insert `projects` + `company_intakes` → invoke `generate-transformation` for all sections → navigate to `/projects/$id` with loading skeletons → realtime/poll for completed rows.

## AI Behavior

System prompt frames the model as transformation consultant + governance advisor + change-mgmt expert. Every generated item enforces the 8-question schema (What/Why/Who/When/Risks/Measure/Artifact/Next Action) via tool-calling JSON schemas. Outputs are structured (not freeform markdown blobs) so the UI can render score cards, matrices, and timeline rows natively.

## Out of scope for v1 (per chosen scope)

- PDF export, Markdown file download — only clipboard copy ships in v1.
- Team/multi-user org invites — single owner per org for v1.
- Real OAuth providers — email/password + Google sign-in only.

## Files (high level)

- `src/styles.css` — design tokens
- `src/routes/__root.tsx` — font links, auth state listener, query invalidation
- `src/routes/index.tsx` — landing
- `src/routes/login.tsx`, `signup.tsx`, `reset-password.tsx`
- `src/routes/_authenticated.tsx` — auth gate
- `src/routes/_authenticated/dashboard.tsx`
- `src/routes/_authenticated/projects.new.tsx`
- `src/routes/_authenticated/projects.$id.tsx` + tab components in `src/components/output/`
- `src/components/intake/` — wizard steps
- `src/components/ui/score-card.tsx`, `status-badge.tsx`, `artifact-card.tsx`
- `src/lib/transformation.functions.ts` — server fns calling edge function + reads
- `supabase/functions/generate-transformation/index.ts`
- Migrations for all tables + RLS + GRANTs + signup trigger

## Build order

1. Tokens + fonts + landing page
2. Enable Lovable Cloud, migrations, auth pages, `_authenticated` gate
3. Dashboard shell
4. Intake wizard + project create
5. Edge function + AI generation (all sections in parallel)
6. Output page with 8 tabs, edit/regenerate/copy
7. QA the flow end-to-end
