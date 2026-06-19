import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, timezone")
      .eq("id", userId)
      .maybeSingle();

    const { data: connection } = await supabase
      .from("connections")
      .select("id, provider, google_email, last_synced_at, status")
      .eq("provider", "google")
      .maybeSingle();

    return { profile, connection };
  });
