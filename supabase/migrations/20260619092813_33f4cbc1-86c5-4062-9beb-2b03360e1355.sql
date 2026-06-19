CREATE TABLE public.extension_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  label TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX extension_tokens_token_idx ON public.extension_tokens (token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_tokens TO authenticated;
GRANT ALL ON public.extension_tokens TO service_role;

ALTER TABLE public.extension_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ext tokens" ON public.extension_tokens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);