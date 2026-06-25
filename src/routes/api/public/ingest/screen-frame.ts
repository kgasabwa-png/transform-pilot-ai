import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Multipart fields:
//   file         — JPEG or PNG screenshot (<= 4 MiB)
//   sessionId    — capture session uuid
//   sequence     — integer
//   capturedAt   — ISO timestamp
//   appName, windowTitle, url — optional context
export const Route = createFileRoute("/api/public/ingest/screen-frame")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const { resolveExtensionAuth } = await import("@/lib/nyvlo/extension-auth.server");
        const auth = await resolveExtensionAuth(request.headers.get("authorization"));
        if (!auth) return Response.json({ error: "Not signed in" }, { status: 401, headers: cors });

        const ctype = request.headers.get("content-type") || "";
        if (!ctype.startsWith("multipart/form-data")) {
          return Response.json(
            { error: "multipart/form-data required" },
            { status: 400, headers: cors },
          );
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
        const capturedAt = String(form.get("capturedAt") ?? new Date().toISOString());
        const appName = (form.get("appName") as string) || null;
        const windowTitle = (form.get("windowTitle") as string) || null;
        const url = (form.get("url") as string) || null;

        if (!(file instanceof File) || !sessionId) {
          return Response.json(
            { error: "file and sessionId required" },
            { status: 400, headers: cors },
          );
        }
        if (file.size === 0 || file.size > 4 * 1024 * 1024) {
          return Response.json({ error: "image 1B–4MiB" }, { status: 400, headers: cors });
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();
        const { data: session, error: sessionErr } = await supabase
          .from("capture_sessions")
          .select("id")
          .eq("id", sessionId)
          .eq("user_id", auth.userId)
          .maybeSingle();
        if (sessionErr) {
          console.error("[screen-frame] session lookup failed", sessionErr.message);
          return Response.json({ error: "Session lookup failed" }, { status: 500, headers: cors });
        }
        if (!session) {
          return Response.json({ error: "Session not found" }, { status: 404, headers: cors });
        }

        const { data: frame, error: frameInsErr } = await supabase
          .from("screen_frames")
          .insert({
            session_id: sessionId,
            user_id: auth.userId,
            sequence,
            captured_at: capturedAt,
            app_name: appName,
            window_title: windowTitle,
            url,
            status: "processing",
          })
          .select("id")
          .single();
        if (frameInsErr || !frame) {
          return Response.json(
            { error: frameInsErr?.message ?? "insert failed" },
            { status: 500, headers: cors },
          );
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ error: "Missing AI key" }, { status: 500, headers: cors });

        try {
          const buf = new Uint8Array(await file.arrayBuffer());
          const b64 = btoa(String.fromCharCode(...buf));
          const mime = file.type || "image/jpeg";
          const dataUrl = `data:${mime};base64,${b64}`;

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content:
                    'You describe what the user is doing on their screen so a productivity agent can pick up commitments and context. Reply with JSON only: { "summary": "1 sentence of what\'s on screen", "ocr": "all readable on-screen text, concise" }. Skip personal/sensitive content (passwords, credit cards).',
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `App: ${appName ?? "?"} · Window: ${windowTitle ?? "?"}${url ? " · URL: " + url : ""}`,
                    },
                    { type: "image_url", image_url: { url: dataUrl } },
                  ],
                },
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (!res.ok) {
            const t = await res.text().catch(() => "");
            const msg = `Vision ${res.status}: ${t.slice(0, 200)}`;
            const { error: updErr } = await supabase
              .from("screen_frames")
              .update({ status: "failed", error: msg })
              .eq("id", frame.id);
            if (updErr)
              console.error("[screen-frame] failed to mark frame as failed", updErr.message);
            const { logIngestionError } = await import("@/lib/nyvlo/ingestion-log.server");
            await logIngestionError({
              endpoint: "screen-frame",
              userId: auth.userId,
              statusCode: res.status,
              error: msg,
              context: { sessionId, sequence },
            });
            return Response.json(
              { error: `vision failed ${res.status}` },
              { status: 502, headers: cors },
            );
          }
          const json = (await res.json()) as any;
          const raw = json.choices?.[0]?.message?.content ?? "{}";
          let parsed: { summary?: string; ocr?: string } = {};
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { summary: raw };
          }

          const { error: updErr2 } = await supabase
            .from("screen_frames")
            .update({
              status: "done",
              vision_summary: parsed.summary ?? null,
              ocr_text: parsed.ocr ?? null,
            })
            .eq("id", frame.id);
          if (updErr2)
            console.error("[screen-frame] failed to update vision result", updErr2.message);

          return Response.json(
            { frameId: frame.id, summary: parsed.summary, ocr: parsed.ocr },
            { headers: cors },
          );
        } catch (e) {
          const msg = (e instanceof Error ? e.message : String(e)).slice(0, 200);
          const { error: updErr3 } = await supabase
            .from("screen_frames")
            .update({ status: "failed", error: msg })
            .eq("id", frame.id);
          if (updErr3)
            console.error("[screen-frame] failed to mark frame as failed", updErr3.message);
          const { logIngestionError } = await import("@/lib/nyvlo/ingestion-log.server");
          await logIngestionError({
            endpoint: "screen-frame",
            userId: auth.userId,
            statusCode: 502,
            error: msg,
            context: { sessionId, sequence },
          });
          return Response.json({ error: msg }, { status: 502, headers: cors });
        }
      },
    },
  },
});
