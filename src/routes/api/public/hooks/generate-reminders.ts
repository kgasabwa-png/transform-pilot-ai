import { createFileRoute } from "@tanstack/react-router";

// Scans open promises and creates notification nudges for things due in the
// next 24h or already overdue. Dedup'd per promise per day so we don't spam.
export const Route = createFileRoute("/api/public/hooks/generate-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();

        const now = Date.now();
        const in24h = new Date(now + 24 * 60 * 60 * 1000).toISOString();

        // Open promises that are due within 24h or overdue
        const { data: promises, error } = await supabase
          .from("promises")
          .select("id, user_id, summary, due_at, status")
          .eq("status", "open")
          .not("due_at", "is", null)
          .lte("due_at", in24h);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const today = new Date().toISOString().slice(0, 10);
        let created = 0;

        for (const p of promises ?? []) {
          if (!p.due_at) continue;
          const dueMs = new Date(p.due_at).getTime();
          const overdue = dueMs < now;
          const kind = overdue ? "overdue" : "due_soon";
          const dedup_key = `${kind}:${p.id}:${today}`;

          const title = overdue
            ? `Overdue: ${p.summary}`
            : `Due soon: ${p.summary}`;
          const body = overdue
            ? `This was due ${formatRelative(dueMs, now)}.`
            : `Due ${formatRelative(dueMs, now)}.`;

          const { error: insErr } = await supabase
            .from("notifications")
            .insert({
              user_id: p.user_id,
              promise_id: p.id,
              kind,
              title,
              body,
              dedup_key,
            });

          // Unique-violation = already nudged today; ignore.
          if (!insErr) created++;
        }

        return Response.json({
          ok: true,
          scanned: promises?.length ?? 0,
          created,
        });
      },
    },
  },
});

function formatRelative(targetMs: number, nowMs: number): string {
  const diff = Math.abs(targetMs - nowMs);
  const past = targetMs < nowMs;
  const mins = Math.round(diff / 60000);
  const hours = Math.round(mins / 60);
  if (hours < 1) return past ? `${mins} min ago` : `in ${mins} min`;
  if (hours < 24) return past ? `${hours}h ago` : `in ${hours}h`;
  const days = Math.round(hours / 24);
  return past ? `${days}d ago` : `in ${days}d`;
}
