import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";

// Falls back to the published origin when the request is from a transient
// preview iframe — Google only accepts pre-registered redirect URIs.
const DEFAULT_REDIRECT_ORIGIN = "https://transform-pilot-ai.lovable.app";

function siteOrigin() {
  const host = getRequestHost();
  if (!host || host.includes("lovableproject.com") || host.includes("id-preview--")) {
    return DEFAULT_REDIRECT_ORIGIN;
  }
  const fwdProto = getRequestHeader("x-forwarded-proto");
  const proto = fwdProto ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

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
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        "Gmail connect is not configured. Missing GOOGLE_OAUTH_CLIENT_ID.",
      );
    }

    const { signGmailState } = await import("@/lib/nyvlo/gmail.server");
    const origin = siteOrigin();
    const redirectUri = `${origin}/api/public/google/gmail-callback`;
    const state = signGmailState(context.userId);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
      ].join(" "),
      state,
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return { url };
  });

export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: row } = await context.supabase
      .from("gmail_connections")
      .select("refresh_token, access_token")
      .eq("user_id", context.userId)
      .maybeSingle();

    const token = row?.refresh_token ?? row?.access_token;
    if (token) {
      try {
        // Best-effort token revoke at Google.
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch (e) {
        console.error("[gmail disconnect] revoke failed", e);
      }
    }

    const { error } = await context.supabase
      .from("gmail_connections")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
