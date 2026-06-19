
-- 1. Table
CREATE TABLE public.device_link_codes (
  code text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_label text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | consumed | expired
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_link_codes TO authenticated;
GRANT ALL ON public.device_link_codes TO service_role;

-- 3. RLS
ALTER TABLE public.device_link_codes ENABLE ROW LEVEL SECURITY;

-- Signed-in user can see/approve their own codes (after they've claimed by visiting /link)
CREATE POLICY "Users see their own link codes"
  ON public.device_link_codes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users approve their own pending link codes"
  ON public.device_link_codes
  FOR UPDATE
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete their own link codes"
  ON public.device_link_codes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Helper RPCs (SECURITY DEFINER so anon can mint + poll without broad table access)
CREATE OR REPLACE FUNCTION public.start_device_link(_label text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _code text;
BEGIN
  _code := encode(gen_random_bytes(18), 'base64');
  _code := replace(replace(replace(_code, '+', ''), '/', ''), '=', '');
  _code := substr(_code, 1, 16);
  INSERT INTO public.device_link_codes (code, device_label) VALUES (_code, _label);
  RETURN _code;
END $$;

GRANT EXECUTE ON FUNCTION public.start_device_link(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.approve_device_link(_code text, _label text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.device_link_codes
     SET user_id = auth.uid(),
         status = 'approved',
         approved_at = now(),
         device_label = COALESCE(_label, device_label)
   WHERE code = _code
     AND status = 'pending'
     AND expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired code';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.approve_device_link(text, text) TO authenticated;

-- Poll: anon-safe, returns the linked user_id once approved. Marks consumed on read.
CREATE OR REPLACE FUNCTION public.consume_device_link(_code text)
RETURNS TABLE(user_id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.device_link_codes;
BEGIN
  SELECT * INTO _row FROM public.device_link_codes WHERE code = _code;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, 'not_found'::text;
    RETURN;
  END IF;
  IF _row.expires_at < now() AND _row.status = 'pending' THEN
    RETURN QUERY SELECT NULL::uuid, 'expired'::text;
    RETURN;
  END IF;
  IF _row.status = 'approved' THEN
    UPDATE public.device_link_codes
       SET status = 'consumed', consumed_at = now()
     WHERE code = _code;
    RETURN QUERY SELECT _row.user_id, 'approved'::text;
    RETURN;
  END IF;
  RETURN QUERY SELECT NULL::uuid, _row.status;
END $$;

GRANT EXECUTE ON FUNCTION public.consume_device_link(text) TO anon, authenticated;
