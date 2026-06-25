// Anonymous polling endpoint. Device polls with its code; once the user
// approves in the web app, this returns a fresh access + refresh token pair
// minted via Supabase Admin API (a one-time magic-link exchange).
import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, optionsHandler } from "@/lib/api/cors";

const cors = corsHeaders("GET", "OPTIONS");

export const Route = createFileRoute("/api/public/auth/device-poll")({
  server: {
    handlers: {
      OPTIONS: optionsHandler(cors),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        if (!code) {
          return Response.json({ error: "code required" }, { status: 400, headers: cors });
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();
        const { data: rpcData, error: rpcErr } = await supabase.rpc("consume_device_link", {
          _code: code,
        });
        if (rpcErr) {
          return Response.json({ error: rpcErr.message }, { status: 500, headers: cors });
        }
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        const status = row?.status ?? "pending";
        if (status !== "approved") {
          return Response.json({ status }, { headers: cors });
        }
        const userId: string | null = row?.user_id ?? null;
        if (!userId) {
          return Response.json({ status: "error" }, { status: 500, headers: cors });
        }

        // Mint a session for this user via Admin API → generateLink (magiclink),
        // then immediately verify the embedded OTP to receive access+refresh.
        const { data: userRow, error: userErr } = await supabase.auth.admin.getUserById(userId);
        if (userErr || !userRow?.user?.email) {
          return Response.json({ error: "User unavailable" }, { status: 500, headers: cors });
        }
        const email = userRow.user.email;

        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
        });
        if (linkErr || !linkData?.properties?.email_otp) {
          return Response.json(
            { error: linkErr?.message || "Could not mint session" },
            { status: 500, headers: cors },
          );
        }
        const otp = linkData.properties.email_otp;

        // Verify with a publishable-key client to obtain access+refresh
        const { createClient } = await import("@supabase/supabase-js");
        const pkey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const surl = process.env.SUPABASE_URL!;
        const sbPub = createClient(surl, pkey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: sess, error: vErr } = await sbPub.auth.verifyOtp({
          type: "email",
          email,
          token: otp,
        });
        if (vErr || !sess?.session) {
          return Response.json(
            { error: vErr?.message || "Session exchange failed" },
            { status: 500, headers: cors },
          );
        }

        return Response.json(
          {
            status: "approved",
            access_token: sess.session.access_token,
            refresh_token: sess.session.refresh_token,
            expires_at: sess.session.expires_at,
            user: { id: userId, email },
          },
          { headers: cors },
        );
      },
    },
  },
});
