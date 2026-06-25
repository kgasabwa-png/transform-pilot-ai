-- Companion product tables: post-meeting actions, reminders, and approval ledger.

CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My workspace',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON public.workspaces (owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own workspaces" ON public.workspaces;
CREATE POLICY "Users manage own workspaces" ON public.workspaces
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS workspaces_updated_at ON public.workspaces;
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.companion_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account text NOT NULL,
  title text NOT NULL,
  ended text NOT NULL DEFAULT 'Just now',
  status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready','processing','done','snoozed')),
  urgency text NOT NULL DEFAULT 'normal'
    CHECK (urgency IN ('high','normal')),
  urgency_label text NOT NULL DEFAULT '',
  attendees jsonb NOT NULL DEFAULT '[]'::jsonb,
  account_meta jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS companion_meetings_user_sort_idx
  ON public.companion_meetings (user_id, sort_order, created_at DESC);
CREATE INDEX IF NOT EXISTS companion_meetings_user_status_idx
  ON public.companion_meetings (user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_meetings TO authenticated;
GRANT ALL ON public.companion_meetings TO service_role;
ALTER TABLE public.companion_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own companion meetings" ON public.companion_meetings;
CREATE POLICY "Users manage own companion meetings" ON public.companion_meetings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS companion_meetings_updated_at ON public.companion_meetings;
CREATE TRIGGER companion_meetings_updated_at
  BEFORE UPDATE ON public.companion_meetings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.companion_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.companion_meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email','reminder','crm_note')),
  status text NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested','edited','sent','scheduled','copied','done','snoozed')),
  recipient text,
  cc text,
  subject text,
  sub_line text,
  body text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone_variants jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS companion_actions_meeting_sort_idx
  ON public.companion_actions (meeting_id, sort_order);
CREATE INDEX IF NOT EXISTS companion_actions_user_status_idx
  ON public.companion_actions (user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_actions TO authenticated;
GRANT ALL ON public.companion_actions TO service_role;
ALTER TABLE public.companion_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own companion actions" ON public.companion_actions;
CREATE POLICY "Users manage own companion actions" ON public.companion_actions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS companion_actions_updated_at ON public.companion_actions;
CREATE TRIGGER companion_actions_updated_at
  BEFORE UPDATE ON public.companion_actions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.approval_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  action_id uuid NOT NULL REFERENCES public.companion_actions(id) ON DELETE CASCADE,
  approved_version jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS approval_record_user_action_idx
  ON public.approval_record (user_id, action_id, created_at DESC);
GRANT SELECT, INSERT ON public.approval_record TO authenticated;
GRANT ALL ON public.approval_record TO service_role;
ALTER TABLE public.approval_record ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own approval records" ON public.approval_record;
CREATE POLICY "Users read own approval records" ON public.approval_record
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own approval records" ON public.approval_record;
CREATE POLICY "Users insert own approval records" ON public.approval_record
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
