import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const Route = createFileRoute("/api/public/extension/today")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token || !token.startsWith("nyv_")) {
          return Response.json(
            { error: "Missing or invalid token" },
            { status: 401, headers: cors },
          );
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();

        const { data: tokenRow } = await supabase
          .from("extension_tokens")
          .select("user_id")
          .eq("token", token)
          .maybeSingle();

        if (!tokenRow) {
          return Response.json(
            { error: "Invalid token" },
            { status: 401, headers: cors },
          );
        }

        const userId = tokenRow.user_id;
        await supabase
          .from("extension_tokens")
          .update({ last_used_at: new Date().toISOString() })
          .eq("token", token);

        const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const [promisesRes, snapRes, profileRes] = await Promise.all([
          supabase
            .from("promises")
            .select("id, summary, due_at, status, owed_to")
            .eq("user_id", userId)
            .eq("status", "open")
            .lte("due_at", in24h)
            .order("due_at", { ascending: true })
            .limit(10),
          supabase
            .from("reliability_snapshots")
            .select("score, kept, missed")
            .eq("user_id", userId)
            .order("snapshot_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", userId)
            .maybeSingle(),
        ]);

        return Response.json(
          {
            user: {
              name: profileRes.data?.full_name ?? null,
              email: profileRes.data?.email ?? null,
            },
            promises: promisesRes.data ?? [],
            reliability: snapRes.data
              ? {
                  score: snapRes.data.score,
                  kept: snapRes.data.kept,
                  missed: snapRes.data.missed,
                }
              : null,
          },
          { headers: cors },
        );
      },
    },
  },
});
