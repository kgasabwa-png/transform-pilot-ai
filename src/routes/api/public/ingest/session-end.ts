import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const Route = createFileRoute("/api/public/ingest/session-end")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const { resolveExtensionAuth } = await import("@/lib/nyvlo/extension-auth.server");
        const auth = await resolveExtensionAuth(request.headers.get("authorization"));
        if (!auth) return Response.json({ error: "Not signed in" }, { status: 401, headers: cors });

        const body = (await request.json().catch(() => ({}))) as { sessionId?: string };
        if (!body.sessionId) {
          return Response.json({ error: "sessionId required" }, { status: 400, headers: cors });
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();
        const endedAt = new Date().toISOString();
        const { data: existing } = await supabase
          .from("capture_sessions")
          .select("started_at")
          .eq("id", body.sessionId)
          .eq("user_id", auth.userId)
          .maybeSingle();
        if (!existing) {
          return Response.json({ error: "Session not found" }, { status: 404, headers: cors });
        }
        const duration = Math.max(
          0,
          Math.round(
            (new Date(endedAt).getTime() - new Date(existing.started_at).getTime()) / 1000,
          ),
        );
        const { error: updateErr } = await supabase
          .from("capture_sessions")
          .update({ status: "ended", ended_at: endedAt, duration_seconds: duration })
          .eq("id", body.sessionId)
          .eq("user_id", auth.userId);
        if (updateErr) {
          console.error("[session-end] failed to update session", updateErr.message);
          return Response.json(
            { ok: false, error: updateErr.message },
            { status: 500, headers: cors },
          );
        }

        // Extract promises from session
        try {
          const { extractPromisesFromSession } = await import("@/lib/nyvlo/capture-extract.server");
          const result = await extractPromisesFromSession(body.sessionId, auth.userId);
          return Response.json({ ok: true, ...result }, { headers: cors });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[session-end] extraction failed", msg);
          return Response.json({ ok: false, error: msg }, { status: 500, headers: cors });
        }
      },
    },
  },
});
