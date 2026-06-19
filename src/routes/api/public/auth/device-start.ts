// Anonymous endpoint: a device (desktop app or extension) requests a fresh
// pairing code. The user then opens /link?code=... in the web app to approve.
import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const Route = createFileRoute("/api/public/auth/device-start")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        let body: { label?: unknown } = {};
        try {
          body = (await request.json()) as { label?: unknown };
        } catch {
          // empty body is fine
        }
        const label =
          typeof body.label === "string" ? body.label.slice(0, 80) : "Unnamed device";

        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) {
          return Response.json(
            { error: "Server misconfigured" },
            { status: 500, headers: cors },
          );
        }
        const sb = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await sb.rpc("start_device_link", { _label: label });
        if (error || !data) {
          return Response.json(
            { error: error?.message || "Could not start link" },
            { status: 500, headers: cors },
          );
        }
        const origin = new URL(request.url).origin;
        return Response.json(
          {
            code: data,
            verification_url: `${origin}/app/link?code=${encodeURIComponent(String(data))}`,
            expires_in: 600,
          },
          { headers: cors },
        );
      },
    },
  },
});
