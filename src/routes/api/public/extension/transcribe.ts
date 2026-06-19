import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const Route = createFileRoute("/api/public/extension/transcribe")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token || !token.startsWith("nyv_")) {
          return Response.json({ error: "Missing or invalid token" }, { status: 401, headers: cors });
        }

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();
        const { data: tokenRow } = await supabase
          .from("extension_tokens")
          .select("user_id")
          .eq("token", token)
          .maybeSingle();
        if (!tokenRow) {
          return Response.json({ error: "Invalid token" }, { status: 401, headers: cors });
        }

        const ctype = request.headers.get("content-type") || "";
        if (!ctype.startsWith("multipart/form-data")) {
          return Response.json({ error: "Expected multipart/form-data" }, { status: 400, headers: cors });
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "Invalid form data" }, { status: 400, headers: cors });
        }

        const file = form.get("file");
        if (!(file instanceof File)) {
          return Response.json({ error: "file required" }, { status: 400, headers: cors });
        }
        if (file.size === 0 || file.size > 25 * 1024 * 1024) {
          return Response.json({ error: "audio must be 1B–25MiB" }, { status: 400, headers: cors });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json({ error: "Server missing AI key" }, { status: 500, headers: cors });
        }

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-mini-transcribe");
        upstream.append("file", file, file.name || "recording.webm");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return Response.json({ error: `Transcription failed: ${res.status} ${t}` }, { status: 502, headers: cors });
        }

        const json = (await res.json().catch(() => ({}))) as { text?: string };
        return Response.json({ text: json.text ?? "" }, { headers: cors });
      },
    },
  },
});
