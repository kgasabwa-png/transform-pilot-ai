-- 1. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Auto-grant admin to founder email
CREATE OR REPLACE FUNCTION public.grant_founder_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'keila@nyvloai.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_grant_founder ON auth.users;
CREATE TRIGGER on_auth_user_grant_founder
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_founder_admin();

-- Backfill if founder already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'keila@nyvloai.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Page events / analytics
CREATE TABLE IF NOT EXISTS public.page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_name text NOT NULL,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_events_created_at_idx ON public.page_events (created_at DESC);
CREATE INDEX IF NOT EXISTS page_events_event_name_idx ON public.page_events (event_name);
CREATE INDEX IF NOT EXISTS page_events_visitor_id_idx ON public.page_events (visitor_id);
CREATE INDEX IF NOT EXISTS page_events_user_id_idx ON public.page_events (user_id);
CREATE INDEX IF NOT EXISTS page_events_utm_source_idx ON public.page_events (utm_source);

GRANT INSERT ON public.page_events TO anon, authenticated;
GRANT SELECT ON public.page_events TO authenticated;
GRANT ALL ON public.page_events TO service_role;
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert events" ON public.page_events;
CREATE POLICY "Anyone can insert events" ON public.page_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read events" ON public.page_events;
CREATE POLICY "Admins read events" ON public.page_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));