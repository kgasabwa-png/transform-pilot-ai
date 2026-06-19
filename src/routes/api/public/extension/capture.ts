import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CaptureBody = {
  url?: unknown;
  title?: unknown;
  selected_text?: unknown;
  note?: unknown;
};

export const Route = createFileRoute("/api/public/extension/capture")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token || !token.startsWith("nyv_")) {
          return Response.json({ error: "Missing or invalid token" }, { status: 401, headers: cors });
        }

        let body: CaptureBody;
        try {
          body = (await request.json()) as CaptureBody;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
        }

        const url = typeof body.url === "string" ? body.url.slice(0, 2000) : "";
        const title = typeof body.title === "string" ? body.title.slice(0, 500) : null;
        const selected = typeof body.selected_text === "string" ? body.selected_text.trim() : "";
        const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 1000) : null;

        if (!selected || selected.length < 3) {
          return Response.json({ error: "selected_text required" }, { status: 400, headers: cors });
        }
        if (selected.length > 8000) {
          return Response.json({ error: "selected_text too long (max 8000 chars)" }, { status: 400, headers: cors });
        }

        const { adminClient, captureWebSnippet } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();

        const { data: tokenRow } = await supabase
          .from("extension_tokens")
          .select("user_id")
          .eq("token", token)
          .maybeSingle();

        if (!tokenRow) {
          return Response.json({ error: "Invalid token" }, { status: 401, headers: cors });
        }

        await supabase
          .from("extension_tokens")
          .update({ last_used_at: new Date().toISOString() })
          .eq("token", token);

        try {
          const result = await captureWebSnippet(tokenRow.user_id, {
            url,
            title,
            selected_text: selected,
            note,
          });
          return Response.json(
            {
              ok: true,
              source_id: result.source_id,
              promises: result.promises,
              extracted_count: result.promises.length,
            },
            { headers: cors },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Capture failed";
          return Response.json({ error: msg }, { status: 500, headers: cors });
        }
      },
    },
  },
});
