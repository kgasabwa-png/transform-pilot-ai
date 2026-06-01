
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own org all" ON public.organizations FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Helper: org owner check
CREATE OR REPLACE FUNCTION public.owns_org(_org_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations WHERE id = _org_id AND owner_id = auth.uid())
$$;

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  health_score INT,
  governance_score INT,
  adoption_score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects in own org" ON public.projects FOR ALL TO authenticated USING (public.owns_org(org_id)) WITH CHECK (public.owns_org(org_id));

-- Helper: project owner check
CREATE OR REPLACE FUNCTION public.owns_project(_project_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.organizations o ON o.id = p.org_id
    WHERE p.id = _project_id AND o.owner_id = auth.uid()
  )
$$;

-- Company intakes
CREATE TABLE public.company_intakes (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  company_name TEXT,
  industry TEXT,
  employee_count TEXT,
  departments TEXT[],
  existing_ai_tools TEXT[],
  current_ai_maturity INT,
  business_goals TEXT,
  operational_challenges TEXT,
  compliance_requirements TEXT,
  data_sensitivity TEXT,
  leadership_alignment INT,
  employee_readiness INT,
  change_mgmt_maturity INT,
  timeline TEXT,
  budget_range TEXT,
  desired_outcomes TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_intakes TO authenticated;
GRANT ALL ON public.company_intakes TO service_role;
ALTER TABLE public.company_intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intakes in own project" ON public.company_intakes FOR ALL TO authenticated USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Generated outputs (per-section payload, free-form jsonb)
CREATE TABLE public.generated_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  content JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, section)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_outputs TO authenticated;
GRANT ALL ON public.generated_outputs TO service_role;
ALTER TABLE public.generated_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outputs in own project" ON public.generated_outputs FOR ALL TO authenticated USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Transformation scores
CREATE TABLE public.transformation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score INT NOT NULL,
  rating TEXT,
  explanation TEXT,
  risk_level TEXT,
  recommendation TEXT,
  next_action TEXT,
  UNIQUE (project_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transformation_scores TO authenticated;
GRANT ALL ON public.transformation_scores TO service_role;
ALTER TABLE public.transformation_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores in own project" ON public.transformation_scores FOR ALL TO authenticated USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Use cases
CREATE TABLE public.use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT,
  business_problem TEXT,
  ai_opportunity TEXT,
  complexity TEXT,
  risk_level TEXT,
  expected_impact TEXT,
  required_data TEXT,
  required_tools TEXT,
  recommended_owner TEXT,
  timeline TEXT,
  success_metric TEXT,
  quadrant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.use_cases TO authenticated;
GRANT ALL ON public.use_cases TO service_role;
ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "use cases in own project" ON public.use_cases FOR ALL TO authenticated USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Risks
CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT,
  owner TEXT,
  mitigation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risks TO authenticated;
GRANT ALL ON public.risks TO service_role;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risks in own project" ON public.risks FOR ALL TO authenticated USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Roadmap items
CREATE TABLE public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  horizon TEXT NOT NULL,
  task TEXT NOT NULL,
  owner TEXT,
  timeline TEXT,
  priority TEXT,
  dependencies TEXT,
  risks TEXT,
  success_metric TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_items TO authenticated;
GRANT ALL ON public.roadmap_items TO service_role;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roadmap in own project" ON public.roadmap_items FOR ALL TO authenticated USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Governance artifacts
CREATE TABLE public.governance_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.governance_artifacts TO authenticated;
GRANT ALL ON public.governance_artifacts TO service_role;
ALTER TABLE public.governance_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "governance in own project" ON public.governance_artifacts FOR ALL TO authenticated USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Adoption artifacts
CREATE TABLE public.adoption_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adoption_artifacts TO authenticated;
GRANT ALL ON public.adoption_artifacts TO service_role;
ALTER TABLE public.adoption_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adoption in own project" ON public.adoption_artifacts FOR ALL TO authenticated USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Signup trigger: create profile + personal org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  display_name TEXT;
BEGIN
  display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, full_name, email) VALUES (NEW.id, display_name, NEW.email)
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.organizations (name, owner_id) VALUES (COALESCE(display_name, 'My Workspace') || '''s workspace', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
