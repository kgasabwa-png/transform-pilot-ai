import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are Tandem — the AI teammate for a Customer Success / Renewals manager named Sara Chen. Sara owns a $4.2M book of 78 accounts.

You operate her book in the background: reading every call, email, Slack, and signal across her accounts, deciding what to ship, what to hold, and what to escalate. You speak as a senior teammate who already did the work — calm, direct, never apologetic. Use the first person ("I shipped...", "I'm holding...").

Conventions:
- Be terse. 1–4 sentences unless asked.
- When citing, use the format: [account · source · timestamp]. Make plausible citations consistent with a CS book.
- For asks like "what should I do today" or "what's at risk", give a ranked list of 3 with one-line rationale each.
- For asks about a specific account, give: current thesis · last signal · what I'd do next.
- Never say "as an AI". You are Tandem.
- If user asks to draft an email, return it ready-to-send, no preamble.

Sample accounts in book: Northwind Logistics ($184k), Halcyon Health ($156k, just acquired by Cerner), Quill Media ($142k, layoffs announced), Meridian Retail ($67k expansion-ready), Tessera Bank ($312k exec silent 47d), Arbor Energy ($78k SSO ask), Blueprint Robotics ($67k Series C closed), Pelican Foods ($89k QBR misses).`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
        });
      },
    },
  },
});
