import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, optionsHandler } from "@/lib/api/cors";

const cors = corsHeaders("POST", "OPTIONS");

export const Route = createFileRoute("/api/public/ingest/session-start")({
  server: {
    handlers: {
      OPTIONS: optionsHandler(cors),
      POST: async ({ request }) => {
        const { resolveExtensionAuth } = await import("@/lib/nyvlo/extension-auth.server");
        const auth = await resolveExtensionAuth(request.headers.get("authorization"));
        if (!auth) return Response.json({ error: "Not signed in" }, { status: 401, headers: cors });

        const body = (await request.json().catch(() => ({}))) as {
          label?: string;
          source?: string;
          metadata?: Record<string, unknown>;
        };

        const { adminClient } = await import("@/lib/nyvlo/google.server");
        const supabase = adminClient();

        // Free-tier quota gate
        const { data: quota } = await supabase.rpc("get_capture_quota", { _user_id: auth.userId });
        const q = quota as { allowed?: boolean; used?: number; limit?: number; is_pro?: boolean } | null;
        if (q && q.allowed === false) {
          return Response.json(
            {
              error: "free_tier_limit",
              message: `You've used ${q.used}/${q.limit} captures this month. Upgrade to Pro for unlimited.`,
              quota: q,
            },
            { status: 402, headers: cors },
          );
        }

        const { data, error } = await supabase
          .from("capture_sessions")
          .insert({
            user_id: auth.userId,
            label: body.label ?? null,
            source: body.source ?? "desktop",
            status: "active",
            metadata: (body.metadata ?? {}) as any,
          })
          .select("id, started_at")
          .single();
        if (error || !data) {
          return Response.json({ error: error?.message ?? "insert failed" }, { status: 500, headers: cors });
        }
        return Response.json({ session: data }, { headers: cors });
      },
    },
  },
});
