
-- 1. connections: explicit deny for client writes (defense-in-depth; service_role bypasses RLS)
DROP POLICY IF EXISTS "connections no client insert" ON public.connections;
DROP POLICY IF EXISTS "connections no client update" ON public.connections;
CREATE POLICY "connections no client insert" ON public.connections FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "connections no client update" ON public.connections FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

-- 2. device_link_codes: remove permissive UPDATE policy; claiming is done via SECURITY DEFINER RPC approve_device_link
DROP POLICY IF EXISTS "Users approve their own pending link codes" ON public.device_link_codes;

-- 3. page_events: tighten INSERT WITH CHECK
DROP POLICY IF EXISTS "Anyone can insert events" ON public.page_events;
CREATE POLICY "Anyone can insert events" ON public.page_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    event_name IS NOT NULL
    AND length(event_name) BETWEEN 1 AND 64
    AND event_name ~ '^[a-zA-Z0-9_.:-]+$'
    AND (visitor_id IS NULL OR length(visitor_id) <= 64)
    AND (session_id IS NULL OR length(session_id) <= 64)
    AND (path IS NULL OR length(path) <= 2048)
    AND (referrer IS NULL OR length(referrer) <= 2048)
    AND (user_agent IS NULL OR length(user_agent) <= 512)
    AND (utm_source IS NULL OR length(utm_source) <= 128)
    AND (utm_medium IS NULL OR length(utm_medium) <= 128)
    AND (utm_campaign IS NULL OR length(utm_campaign) <= 128)
    AND (utm_term IS NULL OR length(utm_term) <= 128)
    AND (utm_content IS NULL OR length(utm_content) <= 128)
    AND (properties IS NULL OR pg_column_size(properties) <= 4096)
  );

-- 4. Fix mutable search_path on email queue helpers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 5. Revoke EXECUTE on SECURITY DEFINER functions that should be server-only
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.start_device_link(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_device_link(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_founder_admin() FROM PUBLIC, anon, authenticated;

-- Keep approve_device_link callable by authenticated (it's the user-facing claim RPC)
-- has_role, has_active_subscription, get_capture_quota remain callable as they're used by RLS / RPC
