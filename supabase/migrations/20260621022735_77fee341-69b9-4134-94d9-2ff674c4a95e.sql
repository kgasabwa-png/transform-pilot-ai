ALTER TABLE public.gmail_connections ALTER COLUMN grant_id DROP NOT NULL;
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS access_token text;
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS refresh_token text;
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;
ALTER TABLE public.gmail_connections ALTER COLUMN provider SET DEFAULT 'google';