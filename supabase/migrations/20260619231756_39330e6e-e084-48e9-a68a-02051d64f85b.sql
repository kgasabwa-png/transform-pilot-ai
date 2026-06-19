-- Remove any smoke-test artifacts from earlier verification
DELETE FROM public.promises WHERE summary = 'Send Sarah the Q3 pricing deck' AND channel = 'capture';
DELETE FROM public.capture_sessions WHERE label IN ('smoke-test', 'smoke');

-- Granola-style structured meeting notes (markdown)
ALTER TABLE public.capture_sessions
  ADD COLUMN IF NOT EXISTS notes_md text;