import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getGmailConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("gmail_connections")
      .select("email, status, scopes, connected_at, last_sync_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return { connection: data };
  });

export const startGmailOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    // Phase 2: build Nylas hosted-auth URL with signed state = userId,
    // redirect_uri = `${siteOrigin()}/api/public/nylas/callback`.
    // Requires NYLAS_CLIENT_ID + NYLAS_API_KEY secrets.
    if (!process.env.NYLAS_CLIENT_ID) {
      throw new Error(
        "Gmail connect is not configured yet. Add NYLAS_CLIENT_ID and NYLAS_API_KEY to enable.",
      );
    }
    throw new Error("Phase 2 not implemented yet.");
  });

export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Phase 2: also call Nylas DELETE /v3/grants/{grant_id} before removing.
    const { error } = await context.supabase
      .from("gmail_connections")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
