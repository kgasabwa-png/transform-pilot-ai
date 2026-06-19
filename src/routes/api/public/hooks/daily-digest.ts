import { createFileRoute } from "@tanstack/react-router";

// Called by pg_cron once per day. Inserts one "daily digest" notification per
// user with at least one open promise due in the next 24h. Idempotent via the
// notifications dedup_key (`digest:YYYY-MM-DD`).
export const Route = createFileRoute("/api/public/hooks/daily-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        if (!apiKey || apiKey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();
        const now = new Date();
        const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        const day = now.toISOString().slice(0, 10);

        const { data: rows, error } = await supabase
          .from("promises")
          .select("user_id, id, summary, due_at")
          .eq("status", "open")
          .lte("due_at", horizon)
          .order("due_at", { ascending: true });

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        // Group by user
        const byUser = new Map<string, typeof rows>();
        for (const r of rows ?? []) {
          if (!r.user_id) continue;
          const list = byUser.get(r.user_id) ?? [];
          list.push(r);
          byUser.set(r.user_id, list);
        }

        let inserted = 0;
        for (const [userId, list] of byUser) {
          const top = list.slice(0, 3).map((p) => `• ${p.summary}`).join("\n");
          const body =
            list.length > 3
              ? `${top}\n…and ${list.length - 3} more`
              : top;
          const { error: insErr } = await supabase
            .from("notifications")
            .upsert(
              {
                user_id: userId,
                kind: "daily_digest",
                title: `${list.length} promise${list.length === 1 ? "" : "s"} due in the next 24h`,
                body,
                dedup_key: `digest:${day}`,
              },
              { onConflict: "user_id,dedup_key", ignoreDuplicates: true },
            );
          if (!insErr) inserted++;
        }

        return Response.json({ ok: true, users: byUser.size, inserted, day });
      },
    },
  },
});
