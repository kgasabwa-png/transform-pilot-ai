import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/oauth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state"); // userId
        const err = url.searchParams.get("error");
        const origin = `${url.protocol}//${url.host}`;

        if (err || !code || !state) {
          return Response.redirect(`${origin}/app/settings?google=error`, 302);
        }

        try {
          const { exchangeCodeForTokens, adminClient } = await import("@/lib/nyvlo/google.server");
          const redirectUri = `${origin}/api/oauth/google/callback`;
          const tokens = await exchangeCodeForTokens(code, redirectUri);

          // Fetch email from userinfo
          let googleEmail: string | null = null;
          try {
            const ui = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            if (ui.ok) {
              const data = (await ui.json()) as { email?: string };
              googleEmail = data.email ?? null;
            } else {
              console.warn("[oauth callback] userinfo fetch failed", ui.status);
            }
          } catch (uiErr) {
            console.warn("[oauth callback] userinfo fetch error", uiErr);
          }

          const admin = adminClient();
          const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
          const { error: upsertErr } = await admin.from("connections").upsert(
            {
              user_id: state,
              provider: "google",
              google_email: googleEmail,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token ?? null,
              token_expires_at: expiry,
              scopes: tokens.scope,
              status: "connected",
            },
            { onConflict: "user_id,provider" },
          );
          if (upsertErr) throw upsertErr;

          // Trigger first sync in background (best-effort)
          try {
            const { syncAndExtractForUser } = await import("@/lib/nyvlo/google.server");
            void syncAndExtractForUser(state).catch((e) => console.error("[initial sync]", e));
          } catch (syncImportErr) {
            console.error("[oauth callback] failed to start initial sync", syncImportErr);
          }

          return Response.redirect(`${origin}/app/settings?google=connected`, 302);
        } catch (e) {
          console.error("[oauth callback]", e);
          return Response.redirect(`${origin}/app/settings?google=failed`, 302);
        }
      },
    },
  },
});
