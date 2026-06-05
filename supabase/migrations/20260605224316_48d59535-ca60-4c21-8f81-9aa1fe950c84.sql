DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.waitlist_signups;

CREATE POLICY "Anyone can join the waitlist"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 3 AND 254
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (source IS NULL OR length(source) <= 64)
  AND (note IS NULL OR length(note) <= 1000)
);