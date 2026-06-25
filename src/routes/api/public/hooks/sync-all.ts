import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/sync-all")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Server misconfiguration", { status: 500 });
        }
        const apikey = request.headers.get("x-webhook-secret");
        if (!apikey || apikey !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { adminClient, syncAndExtractForUser } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();

        // Sync any connection not synced in the last 25 minutes.
        const cutoff = new Date(Date.now() - 25 * 60 * 1000).toISOString();
        const { data: conns, error } = await supabase
          .from("connections")
          .select("user_id, last_synced_at")
          .eq("provider", "google")
          .or(`last_synced_at.is.null,last_synced_at.lt.${cutoff}`);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const results: Array<{ userId: string; ok: boolean; error?: string }> = [];
        for (const c of conns ?? []) {
          try {
            await syncAndExtractForUser(c.user_id);
            results.push({ userId: c.user_id, ok: true });
          } catch (e) {
            results.push({
              userId: c.user_id,
              ok: false,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }

        return Response.json({
          ok: true,
          processed: results.length,
          results,
        });
      },
    },
  },
});
