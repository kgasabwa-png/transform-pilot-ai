import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Multipart fields:
//   file        — audio blob (webm/m4a/wav/mp3)
//   sessionId   — capture session uuid
//   sequence    — integer (order within session)
//   startedAt   — ISO timestamp when chunk recording started
//   speaker     — optional ("self" | "other" | speaker label)
//   sourceChannel — optional ("mic" | "system" | "mixed")
export const Route = createFileRoute("/api/public/ingest/audio-chunk")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const { resolveExtensionAuth } = await import("@/lib/nyvlo/extension-auth.server");
        const auth = await resolveExtensionAuth(request.headers.get("authorization"));
        if (!auth) return Response.json({ error: "Not signed in" }, { status: 401, headers: cors });

        const ctype = request.headers.get("content-type") || "";
        if (!ctype.startsWith("multipart/form-data")) {
          return Response.json({ error: "multipart/form-data required" }, { status: 400, headers: cors });
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "Invalid form" }, { status: 400, headers: cors });
        }

        const file = form.get("file");
        const sessionId = String(form.get("sessionId") ?? "");
        const sequence = Number(form.get("sequence") ?? 0);
        const startedAt = String(form.get("startedAt") ?? new Date().toISOString());
        const speaker = (form.get("speaker") as string) || null;
        const sourceChannel = (form.get("sourceChannel") as string) || null;
        const durationMs = Number(form.get("durationMs") ?? 0) || null;

        if (!(file instanceof File) || !sessionId) {
          return Response.json({ error: "file and sessionId required" }, { status: 400, headers: cors });
        }
        if (file.size === 0 || file.size > 25 * 1024 * 1024) {
          return Response.json({ error: "audio 1B–25MiB" }, { status: 400, headers: cors });
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();

        // Verify session belongs to user
        const { data: session } = await supabase
          .from("capture_sessions")
          .select("id")
          .eq("id", sessionId)
          .eq("user_id", auth.userId)
          .maybeSingle();
        if (!session) {
          return Response.json({ error: "Session not found" }, { status: 404, headers: cors });
        }

        const { data: chunk, error: insErr } = await supabase
          .from("audio_chunks")
          .insert({
            session_id: sessionId,
            user_id: auth.userId,
            sequence,
            started_at: startedAt,
            duration_ms: durationMs,
            speaker,
            source_channel: sourceChannel,
            status: "transcribing",
          })
          .select("id")
          .single();
        if (insErr || !chunk) {
          return Response.json({ error: insErr?.message ?? "insert failed" }, { status: 500, headers: cors });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json({ error: "Server missing AI key" }, { status: 500, headers: cors });
        }

        try {
          const upstream = new FormData();
          upstream.append("model", "openai/gpt-4o-mini-transcribe");
          upstream.append("file", file, file.name || `chunk-${sequence}.webm`);
          const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}` },
            body: upstream,
          });
          if (!res.ok) {
            const t = await res.text().catch(() => "");
            await supabase
              .from("audio_chunks")
              .update({ status: "failed", error: `STT ${res.status}: ${t.slice(0, 200)}` })
              .eq("id", chunk.id);
            return Response.json({ error: `STT failed ${res.status}` }, { status: 502, headers: cors });
          }
          const j = (await res.json().catch(() => ({}))) as { text?: string };
          const text = j.text ?? "";

          await supabase
            .from("audio_chunks")
            .update({ status: "done", transcript: text })
            .eq("id", chunk.id);

          return Response.json({ chunkId: chunk.id, transcript: text }, { headers: cors });
        } catch (e: any) {
          await supabase
            .from("audio_chunks")
            .update({ status: "failed", error: String(e.message ?? e).slice(0, 200) })
            .eq("id", chunk.id);
          return Response.json({ error: String(e.message ?? e) }, { status: 502, headers: cors });
        }
      },
    },
  },
});
