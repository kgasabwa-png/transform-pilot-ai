import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, optionsHandler } from "@/lib/api/cors";

const cors = corsHeaders("POST", "OPTIONS");

type CaptureBody = {
  url?: unknown;
  title?: unknown;
  selected_text?: unknown;
  note?: unknown;
};

export const Route = createFileRoute("/api/public/extension/capture")({
  server: {
    handlers: {
      OPTIONS: optionsHandler(cors),
      POST: async ({ request }) => {
        const { resolveExtensionAuth } = await import("@/lib/nyvlo/extension-auth.server");
        const auth = await resolveExtensionAuth(request.headers.get("authorization"));
        if (!auth) {
          return Response.json({ error: "Not signed in" }, { status: 401, headers: cors });
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

        const { captureWebSnippet } = await import("@/lib/nyvlo/google.server");
        try {
          const result = await captureWebSnippet(auth.userId, {
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
