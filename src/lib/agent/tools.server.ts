import { tool } from "ai";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { DEMO_PROMISES, DEMO_MEMORY } from "./context";

function makeModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI gateway not configured");
  const gateway = createLovableAiGatewayProvider(key);
  return gateway("google/gemini-3-flash-preview");
}

export function buildAgentTools() {
  return {
    draft_email_reply: tool({
      description:
        "Draft a follow-up email reply for a specific commitment the user made. Use when the user asks to draft, write, or compose a reply.",
      inputSchema: z.object({
        promise_id: z.string().describe("The ID of the open promise to draft a reply for. See system prompt for IDs."),
        tone: z
          .enum(["warm", "direct", "apologetic"])
          .default("warm")
          .describe("Tone of the reply."),
        extra_context: z
          .string()
          .optional()
          .describe("Any additional context or instructions the user gave for the draft."),
      }),
      execute: async ({ promise_id, tone, extra_context }) => {
        const p = DEMO_PROMISES.find((x) => x.id === promise_id);
        if (!p) {
          return { error: `No promise found with id ${promise_id}.` };
        }
        const { text } = await generateText({
          model: makeModel(),
          system: `You are drafting an email reply for nyvlo's user Alex. Tone: ${tone}. 3-5 sentences. No greeting line beyond the recipient's name. No sign-off. Plain text only — no markdown.`,
          prompt: [
            `Recipient: ${p.owed_to ?? "the recipient"}`,
            `Commitment Alex made: ${p.summary}`,
            `Original evidence: "${p.evidence_snippet}"`,
            extra_context ? `Extra context: ${extra_context}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        });
        return {
          recipient: p.owed_to,
          subject: `Re: ${p.summary}`,
          body: text,
          promise: p.summary,
        };
      },
    }),

    prep_meeting_brief: tool({
      description:
        "Produce a short pre-meeting brief for an upcoming meeting or specific commitment. Use when the user says 'prep me', 'brief me', 'what should I know'.",
      inputSchema: z.object({
        topic: z.string().describe("Who or what the brief is about (person, project, or promise summary)."),
        promise_id: z.string().optional().describe("Optional related promise ID."),
      }),
      execute: async ({ topic, promise_id }) => {
        const related = promise_id ? DEMO_PROMISES.find((x) => x.id === promise_id) : null;
        const relevantMemory = DEMO_MEMORY.filter((m) =>
          m.text.toLowerCase().includes(topic.toLowerCase().split(" ")[0] ?? ""),
        );
        const { text } = await generateText({
          model: makeModel(),
          system:
            "Produce a tight pre-meeting brief in markdown. Sections: **Context** (1 sentence), **What you owe** (1-2 bullets), **Talking points** (3 bullets), **Risk** (1 bullet). Under 130 words. Be specific, no fluff.",
          prompt: [
            `Topic: ${topic}`,
            related ? `Related open promise: "${related.summary}" owed to ${related.owed_to ?? "—"}. Evidence: "${related.evidence_snippet}".` : null,
            relevantMemory.length
              ? `Memory: ${relevantMemory.map((m) => m.text).join(" | ")}`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
        });
        return { topic, brief: text };
      },
    }),

    research_person: tool({
      description:
        "Pull together a dossier on a person based on memory and open commitments. Use when the user asks 'what do we know about X', 'tell me about X', 'research X'.",
      inputSchema: z.object({
        name: z.string().describe("Person's name."),
      }),
      execute: async ({ name }) => {
        const lower = name.toLowerCase();
        const promises = DEMO_PROMISES.filter((p) => p.owed_to?.toLowerCase().includes(lower));
        const memory = DEMO_MEMORY.filter((m) => m.text.toLowerCase().includes(lower.split(" ")[0] ?? ""));

        if (!promises.length && !memory.length) {
          return {
            name,
            summary: `No notes or open commitments involving ${name} in your workspace yet.`,
            promises: [],
            memory: [],
          };
        }

        const { text } = await generateText({
          model: makeModel(),
          system:
            "Produce a 3-4 sentence dossier in plain prose (no markdown headings). Lead with who they are based on context, then current state of relationship, then suggested next move. Mark inferences with '(inferred)'.",
          prompt: [
            `Person: ${name}`,
            promises.length ? `Open commitments: ${promises.map((p) => `"${p.summary}"`).join(", ")}` : "No open commitments.",
            memory.length ? `Memory: ${memory.map((m) => m.text).join(" | ")}` : "No memory items.",
          ].join("\n"),
        });

        return {
          name,
          summary: text,
          promises: promises.map((p) => ({ summary: p.summary, due_at: p.due_at })),
          memory: memory.map((m) => ({ text: m.text, source: m.source })),
        };
      },
    }),

    search_memory: tool({
      description: "Search the user's memory for a specific fact, preference, or note. Use for narrow factual lookups.",
      inputSchema: z.object({
        query: z.string().describe("What to look up. Keyword or short phrase."),
      }),
      execute: async ({ query }) => {
        const lower = query.toLowerCase();
        const hits = DEMO_MEMORY.filter(
          (m) => m.text.toLowerCase().includes(lower) || m.source.toLowerCase().includes(lower),
        );
        return {
          query,
          results: hits.map((m) => ({ text: m.text, source: m.source })),
          count: hits.length,
        };
      },
    }),
  };
}
