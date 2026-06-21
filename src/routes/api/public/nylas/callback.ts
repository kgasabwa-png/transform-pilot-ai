import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/nylas/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        const origin = `${url.protocol}//${url.host}`;
        const settings = `${origin}/app/settings`;

        if (err || !code || !state) {
          return Response.redirect(`${settings}?gmail=error`, 302);
        }

        try {
          const { verifyState, exchangeCodeForGrant } = await import(
            "@/lib/nyvlo/nylas.server"
          );
          const verified = verifyState(state);
          if (!verified) {
            return Response.redirect(`${settings}?gmail=bad_state`, 302);
          }

          const redirectUri = `${origin}/api/public/nylas/callback`;
          const grant = await exchangeCodeForGrant(code, redirectUri);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error: upsertErr } = await supabaseAdmin
            .from("gmail_connections")
            .upsert(
              {
                user_id: verified.userId,
                provider: "nylas",
                grant_id: grant.grant_id,
                email: grant.email,
                scopes: grant.scope ? grant.scope.split(/\s+/).filter(Boolean) : null,
                status: "connected",
                connected_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
          if (upsertErr) throw upsertErr;

          return Response.redirect(`${settings}?gmail=connected`, 302);
        } catch (e) {
          console.error("[nylas callback]", e);
          return Response.redirect(`${settings}?gmail=failed`, 302);
        }
      },
    },
  },
});
