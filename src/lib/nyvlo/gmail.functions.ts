import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
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
  .handler(async ({ context }) => {
    if (!process.env.NYLAS_CLIENT_ID || !process.env.NYLAS_API_KEY) {
      throw new Error(
        "Gmail connect is not configured. Missing NYLAS_CLIENT_ID or NYLAS_API_KEY.",
      );
    }

    // Derive origin from the incoming request so preview + production both work.
    const host =
      getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? "";
    const proto =
      getRequestHeader("x-forwarded-proto") ??
      (host.includes("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;

    const { buildAuthUrl, signState } = await import("@/lib/nyvlo/nylas.server");
    const state = signState(context.userId);
    const url = buildAuthUrl({
      redirectUri: `${origin}/api/public/nylas/callback`,
      state,
    });
    return { url };
  });

export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Look up grant_id first so we can revoke at Nylas.
    const { data: row } = await context.supabase
      .from("gmail_connections")
      .select("grant_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (row?.grant_id) {
      try {
        const { deleteGrant } = await import("@/lib/nyvlo/nylas.server");
        await deleteGrant(row.grant_id);
      } catch (e) {
        console.error("[nylas disconnect] grant delete failed", e);
        // Continue anyway — we still want to remove the local row.
      }
    }

    const { error } = await context.supabase
      .from("gmail_connections")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
