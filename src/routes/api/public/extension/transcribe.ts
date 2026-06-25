import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, optionsHandler } from "@/lib/api/cors";

const cors = corsHeaders("POST", "OPTIONS");

export const Route = createFileRoute("/api/public/extension/transcribe")({
  server: {
    handlers: {
      OPTIONS: optionsHandler(cors),
      POST: async ({ request }) => {
        const { resolveExtensionAuth } = await import("@/lib/nyvlo/extension-auth.server");
        const auth = await resolveExtensionAuth(request.headers.get("authorization"));
        if (!auth) {
          return Response.json({ error: "Not signed in" }, { status: 401, headers: cors });
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
