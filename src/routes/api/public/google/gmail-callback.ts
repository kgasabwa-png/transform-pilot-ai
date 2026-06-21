import { createFileRoute } from "@tanstack/react-router";

const DEFAULT_REDIRECT_ORIGIN = "https://transform-pilot-ai.lovable.app";

function callbackOrigin(url: URL) {
  const host = url.host;
  if (host.includes("lovableproject.com") || host.includes("id-preview--")) {
    return DEFAULT_REDIRECT_ORIGIN;
  }
  return `${url.protocol}//${host}`;
}

export const Route = createFileRoute("/api/public/google/gmail-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        const origin = callbackOrigin(url);
        const settings = `${origin}/app/settings`;

        if (err || !code || !state) {
          return Response.redirect(`${settings}?gmail=error`, 302);
        }

        try {
          const { verifyGmailState, exchangeGmailCode, fetchGoogleUserEmail } =
            await import("@/lib/nyvlo/gmail.server");

          const verified = verifyGmailState(state);
          if (!verified) {
            return Response.redirect(`${settings}?gmail=bad_state`, 302);
          }

          const redirectUri = `${origin}/api/public/google/gmail-callback`;
          const tokens = await exchangeGmailCode(code, redirectUri);
          const email = await fetchGoogleUserEmail(tokens.access_token);

          const expiresAt = new Date(
            Date.now() + tokens.expires_in * 1000,
          ).toISOString();

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { error: upsertErr } = await supabaseAdmin
            .from("gmail_connections")
            .upsert(
              {
                user_id: verified.userId,
                provider: "google",
                grant_id: null,
                email,
                scopes: tokens.scope
                  ? tokens.scope.split(/\s+/).filter(Boolean)
                  : [],
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token ?? null,
                token_expires_at: expiresAt,
                status: "connected",
                connected_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
          if (upsertErr) throw upsertErr;

          return Response.redirect(`${settings}?gmail=connected`, 302);
        } catch (e) {
          console.error("[google gmail callback]", e);
          return Response.redirect(`${settings}?gmail=failed`, 302);
        }
      },
    },
  },
});
