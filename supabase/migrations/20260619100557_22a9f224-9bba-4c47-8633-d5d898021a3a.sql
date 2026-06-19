
CREATE TABLE public.extraction_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id uuid NOT NULL REFERENCES public.promises(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verdict text NOT NULL CHECK (verdict IN ('not_a_promise','wrong_due_date','wrong_recipient','other')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.extraction_feedback TO authenticated;
GRANT ALL ON public.extraction_feedback TO service_role;

ALTER TABLE public.extraction_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own feedback select" ON public.extraction_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own feedback insert" ON public.extraction_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own feedback delete" ON public.extraction_feedback
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX extraction_feedback_promise_idx ON public.extraction_feedback(promise_id);
