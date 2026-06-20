import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildSystemPrompt, type AgentPromise, type AgentMemory } from "@/lib/agent/context";
import { buildAgentTools } from "@/lib/agent/tools.server";

export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("messages required", { status: 400 });
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabasePublishable = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        if (!supabaseUrl || !supabasePublishable) {
          return new Response("Supabase not configured", { status: 500 });
        }

        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient<Database>(supabaseUrl, supabasePublishable, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        if (claimsError || !claimsData?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = claimsData.claims.sub as string;

        // Pull real workspace data via RLS.
        const [promisesRes, memoryRes, profileRes] = await Promise.all([
          supabase
            .from("promises")
            .select("id, summary, owed_to, channel, due_at, evidence_snippet, status")
            .eq("user_id", userId)
            .eq("status", "open")
            .order("due_at", { ascending: true, nullsFirst: false })
            .limit(40),
          supabase
            .from("memory_items")
            .select("id, title, snippet, kind, occurred_at")
            .eq("user_id", userId)
            .order("occurred_at", { ascending: false })
            .limit(40),
          supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
        ]);

        const promises: AgentPromise[] = (promisesRes.data ?? []).map((p) => ({
          id: p.id,
          summary: p.summary,
          owed_to: p.owed_to,
          channel: p.channel,
          due_at: p.due_at,
          evidence_snippet: p.evidence_snippet,
          status: p.status,
        }));
        const memory: AgentMemory[] = (memoryRes.data ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          snippet: m.snippet,
          kind: m.kind,
          occurred_at: m.occurred_at,
        }));
        const userName =
          profileRes.data?.full_name?.split(" ")[0] ||
          profileRes.data?.email?.split("@")[0] ||
          "there";

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: buildSystemPrompt({ userName, promises, memory }),
          messages: await convertToModelMessages(messages),
          tools: buildAgentTools({ supabase, userId, promises, memory }),
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
