import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const PromiseSchema = z.object({
  id: z.string(),
  summary: z.string(),
  owed_to: z.string().nullable(),
  channel: z.enum(["email", "meeting", "note"]),
  due_at: z.string(),
  evidence_snippet: z.string(),
});

const ActionInput = z.object({
  action: z.enum(["draft_reply", "prep_brief", "research_person"]),
  promise: PromiseSchema,
});

const SYSTEM_PROMPTS: Record<z.infer<typeof ActionInput>["action"], string> = {
  draft_reply:
    "You are nyvlo, an executive assistant. Draft a concise, warm follow-up email reply that honors the commitment the user made. 3-5 sentences. No greeting line beyond the recipient's name. No sign-off — just the body. Plain text.",
  prep_brief:
    "You are nyvlo, an executive assistant. Produce a tight pre-meeting brief in markdown for the user. Include: (1) Context — one sentence on why this matters. (2) What you owe — the commitment. (3) Talking points — 3 bullets. (4) Risks — one bullet. Keep it under 120 words.",
  research_person:
    "You are nyvlo, an executive assistant. Produce a short dossier in markdown about the person involved in this promise, based only on the evidence provided. Include: (1) Who they are (inferred). (2) Open commitments between you. (3) Suggested next move. Mark inferences with 'inferred:'. Under 100 words.",
};

export const runPromiseAction = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ActionInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = [
      `Promise: ${data.promise.summary}`,
      data.promise.owed_to ? `Owed to: ${data.promise.owed_to}` : null,
      `Channel: ${data.promise.channel}`,
      `Source evidence: "${data.promise.evidence_snippet}"`,
    ]
      .filter(Boolean)
      .join("\n");

    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPTS[data.action],
      prompt,
    });

    return { action: data.action, text };
  });
