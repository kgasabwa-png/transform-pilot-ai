CREATE TABLE IF NOT EXISTS public.ingestion_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  status_code int,
  error_message text,
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ingestion_errors TO authenticated;
GRANT ALL ON public.ingestion_errors TO service_role;

ALTER TABLE public.ingestion_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all ingestion errors" ON public.ingestion_errors
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own ingestion errors" ON public.ingestion_errors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS ingestion_errors_created_idx ON public.ingestion_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS ingestion_errors_endpoint_idx ON public.ingestion_errors (endpoint, created_at DESC);