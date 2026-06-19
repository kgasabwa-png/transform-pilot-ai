import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[] };
        const messages = body.messages;
        if (!Array.isArray(messages)) return new Response("Bad request", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Auth: extract user from bearer
        let userId: string | null = null;
        const auth = request.headers.get("authorization");
        if (auth?.startsWith("Bearer ")) {
          try {
            const { createClient } = await import("@supabase/supabase-js");
            const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
            const { data } = await sb.auth.getUser(auth.slice(7));
            userId = data.user?.id ?? null;
          } catch { /* ignore */ }
        }

        let contextText = "(User is not signed in or has no data yet.)";
        if (userId) {
          const { getUserContext } = await import("@/lib/nyvlo/google.server");
          const ctx = await getUserContext(userId);
          contextText = formatContext(ctx);
        }

        const system = `You are Nyvlo, an AI assistant that helps the user remember promises, follow-ups, and loose ends from their work life.

You ONLY know what is in the user's connected sources (Google Calendar + Gmail). Do not invent commitments. If the user asks about something you don't see, say so honestly.

Be concise, direct, and warm. Use bullet points when listing items. Quote evidence snippets when relevant.

=== USER'S CURRENT CONTEXT ===
${contextText}
=== END CONTEXT ===`;

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});

function formatContext(ctx: { promises: Array<Record<string, unknown>>; memory: Array<Record<string, unknown>> }) {
  const lines: string[] = [];
  lines.push(`OPEN PROMISES (${ctx.promises.length}):`);
  if (ctx.promises.length === 0) lines.push("  (none yet)");
  else {
    for (const p of ctx.promises.slice(0, 20)) {
      const due = p.due_at ? new Date(String(p.due_at)).toLocaleDateString() : "no due date";
      lines.push(`- "${p.summary}" → ${p.owed_to ?? "?"} (${due})${p.evidence_snippet ? ` · evidence: "${p.evidence_snippet}"` : ""}`);
    }
  }
  lines.push("");
  lines.push(`RECENT MEMORY (${ctx.memory.length}):`);
  if (ctx.memory.length === 0) lines.push("  (none yet)");
  else {
    for (const m of ctx.memory.slice(0, 15)) {
      const when = m.occurred_at ? new Date(String(m.occurred_at)).toLocaleDateString() : "";
      lines.push(`- [${m.kind}] ${m.title} (${when})${m.snippet ? ` — ${m.snippet}` : ""}`);
    }
  }
  return lines.join("\n");
}
