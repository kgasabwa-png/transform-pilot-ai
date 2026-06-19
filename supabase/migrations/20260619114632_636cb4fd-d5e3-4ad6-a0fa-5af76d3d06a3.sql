-- capture_sessions
CREATE TABLE IF NOT EXISTS public.capture_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  source text NOT NULL DEFAULT 'desktop',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  summary text,
  transcript text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.capture_sessions TO authenticated;
GRANT ALL ON public.capture_sessions TO service_role;
ALTER TABLE public.capture_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON public.capture_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS capture_sessions_user_idx
  ON public.capture_sessions (user_id, started_at DESC);

CREATE TRIGGER capture_sessions_updated_at
  BEFORE UPDATE ON public.capture_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- audio_chunks
CREATE TABLE IF NOT EXISTS public.audio_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.capture_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  started_at timestamptz NOT NULL,
  duration_ms integer,
  transcript text,
  speaker text,
  source_channel text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audio_chunks TO authenticated;
GRANT ALL ON public.audio_chunks TO service_role;
ALTER TABLE public.audio_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own audio chunks" ON public.audio_chunks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS audio_chunks_session_idx
  ON public.audio_chunks (session_id, sequence);

-- screen_frames
CREATE TABLE IF NOT EXISTS public.screen_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.capture_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  captured_at timestamptz NOT NULL,
  app_name text,
  window_title text,
  url text,
  ocr_text text,
  vision_summary text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.screen_frames TO authenticated;
GRANT ALL ON public.screen_frames TO service_role;
ALTER TABLE public.screen_frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own screen frames" ON public.screen_frames
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS screen_frames_session_idx
  ON public.screen_frames (session_id, sequence);

-- Link promises back to a capture session (optional)
ALTER TABLE public.promises
  ADD COLUMN IF NOT EXISTS capture_session_id uuid REFERENCES public.capture_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS promises_capture_session_idx
  ON public.promises (capture_session_id);