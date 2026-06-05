-- Drop Fluent trigger on auth.users if present
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop Fluent helper functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.owns_org(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.owns_project(uuid) CASCADE;

-- Drop Fluent tables
DROP TABLE IF EXISTS public.adoption_artifacts CASCADE;
DROP TABLE IF EXISTS public.governance_artifacts CASCADE;
DROP TABLE IF EXISTS public.generated_outputs CASCADE;
DROP TABLE IF EXISTS public.risks CASCADE;
DROP TABLE IF EXISTS public.roadmap_items CASCADE;
DROP TABLE IF EXISTS public.use_cases CASCADE;
DROP TABLE IF EXISTS public.transformation_scores CASCADE;
DROP TABLE IF EXISTS public.company_intakes CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Receipts waitlist
CREATE TABLE public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX waitlist_signups_email_lower_idx ON public.waitlist_signups (lower(email));

GRANT INSERT ON public.waitlist_signups TO anon, authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
