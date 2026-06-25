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

        const body = (await request.json().catch(() => ({}))) as {
          sessionId?: string;
          notes?: string;
        };
        if (!body.sessionId) {
          return Response.json({ error: "sessionId required" }, { status: 400, headers: cors });
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();
        const endedAt = new Date().toISOString();
        const { data: existing } = await supabase
          .from("capture_sessions")
          .select("started_at, label")
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
        await supabase
          .from("capture_sessions")
          .update({
            status: "ended",
            ended_at: endedAt,
            duration_seconds: duration,
            metadata: { companion_notes: body.notes ?? "" },
          })
          .eq("id", body.sessionId)
          .eq("user_id", auth.userId);

        try {
          const { data: chunks } = await supabase
            .from("audio_chunks")
            .select("sequence, transcript")
            .eq("session_id", body.sessionId)
            .order("sequence", { ascending: true });
          const transcript = (chunks ?? [])
            .map((chunk) => chunk.transcript)
            .filter(Boolean)
            .join("\n")
            .trim();
          const blended = [
            body.notes?.trim() ? `- MY NOTES DURING THE MEETING -\n${body.notes.trim()}\n` : "",
            transcript ? `- TRANSCRIPT -\n${transcript}` : "",
          ]
            .filter(Boolean)
            .join("\n")
            .trim();
          if (blended.length < 20) {
            return Response.json(
              { ok: true, meeting_id: null, reason: "no-transcript", duration_seconds: duration },
              { headers: cors },
            );
          }
          const { runCompanionExtraction } = await import("@/lib/nyvlo/companion-extract.server");
          const result = await runCompanionExtraction(supabase, auth.userId, {
            title: existing.label ?? undefined,
            transcript: blended,
          });
          return Response.json(
            {
              ok: true,
              meeting_id: result.meetingId,
              action_count: result.actionCount,
              duration_seconds: duration,
            },
            { headers: cors },
          );
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Extraction failed";
          return Response.json(
            { ok: true, extractError: message, duration_seconds: duration },
            { headers: cors },
          );
        }
      },
    },
  },
});
