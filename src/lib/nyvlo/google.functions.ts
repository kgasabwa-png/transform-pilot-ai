import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";

function siteOrigin() {
  const fwdProto = getRequestHeader("x-forwarded-proto");
  const host = getRequestHost();
  const proto = fwdProto ?? (host?.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const startGoogleOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { googleAuthUrl } = await import("./google.server");
    const origin = siteOrigin();
    const redirectUri = `${origin}/api/oauth/google/callback`;
    const url = googleAuthUrl(redirectUri, context.userId);
    return { url };
  });

export const disconnectGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("connections")
      .delete()
      .eq("provider", "google");
    if (error) throw error;
    return { ok: true };
  });

export const runSyncNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { syncAndExtractForUser } = await import("./google.server");
    const stats = await syncAndExtractForUser(context.userId);
    return {
      synced: stats.calendar,
      promises: stats.promises,
      memories: stats.memories,
    };
  });
