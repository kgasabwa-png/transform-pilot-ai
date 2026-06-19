-- Free tier quota + waitlist invite tracking

-- 1. Track invites on waitlist
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_email_id text;

CREATE INDEX IF NOT EXISTS waitlist_signups_invited_idx ON public.waitlist_signups(invited_at);

-- Admins can read waitlist
DROP POLICY IF EXISTS "Admins read waitlist" ON public.waitlist_signups;
CREATE POLICY "Admins read waitlist" ON public.waitlist_signups
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Quota helper — counts captures in current calendar month
CREATE OR REPLACE FUNCTION public.get_capture_quota(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_pro boolean;
  _used integer;
  _limit integer := 10;
  _month_start timestamptz := date_trunc('month', now());
BEGIN
  SELECT public.has_active_subscription(_user_id, 'live')
      OR public.has_active_subscription(_user_id, 'sandbox')
    INTO _is_pro;

  SELECT count(*)::int INTO _used
    FROM public.capture_sessions
   WHERE user_id = _user_id
     AND started_at >= _month_start;

  RETURN jsonb_build_object(
    'is_pro', COALESCE(_is_pro, false),
    'used', _used,
    'limit', _limit,
    'allowed', COALESCE(_is_pro, false) OR _used < _limit,
    'period_start', _month_start
  );
END $$;

GRANT EXECUTE ON FUNCTION public.get_capture_quota(uuid) TO authenticated, service_role;