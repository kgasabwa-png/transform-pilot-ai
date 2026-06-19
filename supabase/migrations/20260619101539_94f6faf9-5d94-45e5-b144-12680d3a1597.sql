CREATE TABLE public.muted_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mute_key TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mute_key)
);
CREATE INDEX muted_sources_user_idx ON public.muted_sources (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.muted_sources TO authenticated;
GRANT ALL ON public.muted_sources TO service_role;
ALTER TABLE public.muted_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mutes" ON public.muted_sources
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);