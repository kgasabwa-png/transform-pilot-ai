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
        const { resolveExtensionAuth } = await import("@/lib/nyvlo/extension-auth.server");
        const auth = await resolveExtensionAuth(request.headers.get("authorization"));
        if (!auth) {
          return Response.json({ error: "Not signed in" }, { status: 401, headers: cors });
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();
        const userId = auth.userId;

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
          supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
        ]);

        if (promisesRes.error) {
          console.error("[today] promises query failed", promisesRes.error.message);
        }
        if (snapRes.error) {
          console.error("[today] reliability query failed", snapRes.error.message);
        }
        if (profileRes.error) {
          console.error("[today] profile query failed", profileRes.error.message);
        }

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
