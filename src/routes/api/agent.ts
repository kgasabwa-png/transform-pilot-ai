import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildSystemPrompt, type AgentPromise, type AgentMemory } from "@/lib/agent/context";
import { buildAgentTools } from "@/lib/agent/tools.server";
import { selectRelevantContext, turnsFromUIMessages } from "@/lib/agent/retrieve";
import { selectByEmbedding, queryFromTurns } from "@/lib/agent/embeddings.server";

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
            .limit(200),
          supabase
            .from("memory_items")
            .select("id, title, snippet, kind, occurred_at")
            .eq("user_id", userId)
            .order("occurred_at", { ascending: false })
            .limit(200),
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

        // Relevance pass: prefer semantic (embedding) retrieval; fall back to
        // keyword scoring when the query is empty or embeddings are unavailable.
        const turns = turnsFromUIMessages(
          messages as Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>,
        );
        const totals = { promises: promises.length, memory: memory.length };
        const query = queryFromTurns(turns);

        let selectedPromises: AgentPromise[];
        let selectedMemory: AgentMemory[];

        const semantic = await selectByEmbedding({
          supabase,
          userId,
          apiKey,
          query,
          promiseLimit: 12,
          memoryLimit: 10,
          totals,
        });

        if (semantic && (semantic.promises.length || semantic.memory.length)) {
          selectedPromises = semantic.promises;
          selectedMemory = semantic.memory;
        } else {
          const keyword = selectRelevantContext({
            turns,
            promises,
            memory,
            promiseLimit: 12,
            memoryLimit: 10,
          });
          selectedPromises = keyword.promises;
          selectedMemory = keyword.memory;
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: buildSystemPrompt({
            userName,
            promises: selectedPromises,
            memory: selectedMemory,
            totals,
          }),
          messages: await convertToModelMessages(messages),
          // Tools see the full pool so search_memory / research_person can find
          // anything the system prompt didn't surface.
          tools: buildAgentTools({ supabase, userId, promises, memory }),
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
