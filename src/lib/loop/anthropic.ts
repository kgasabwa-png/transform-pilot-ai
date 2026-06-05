// Live mode: call Anthropic directly from the browser with a user-provided key.
// The key never touches our server. Returns a ClosePackage with citations.

import type { ClosePackage } from "./synthetic";

const SYSTEM = `You are Loop, an execution agent for customer-success teams.
You receive a raw conversation transcript (numbered lines) and return a strictly-JSON
"close package" that a CSM can review in ~90 seconds. Every claim you make must cite
the 1-indexed line numbers it came from. NEVER fabricate. If a section has no
evidence, return an empty array for it.

Return ONLY valid JSON matching this TypeScript type, no prose, no markdown fences:

type Citation = { line: number; quote: string };
type ClosePackage = {
  recordUpdates: { field: string; before: string; after: string; citations: Citation[] }[];
  email: {
    to: string;
    subject: string;
    bodyParagraphs: { text: string; citations: Citation[] }[];
  };
  crmChanges: { object: string; field: string; before: string; after: string; citations: Citation[] }[];
  risks: { title: string; severity: "low"|"medium"|"high"; rationale: string; recommendedPlay: string; citations: Citation[] }[];
};

Rules:
- "before" reflects the prior account state if known, otherwise "—".
- Email is in the CSM's voice: short, direct, ordered by customer priority. No emojis.
- Citations: { line, quote } where quote is a short verbatim snippet from that line.
- 3–6 record updates, 3–6 CRM changes, 2–4 risks. Email: 3–6 short paragraphs.`;

export async function runLiveClose(opts: {
  apiKey: string;
  transcript: { speaker: string; text: string }[];
  model?: string;
}): Promise<ClosePackage> {
  const numbered = opts.transcript
    .map((l, i) => `[${i + 1}] ${l.speaker}: ${l.text}`)
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: opts.model ?? "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `TRANSCRIPT (1-indexed lines):\n\n${numbered}\n\nReturn the close package as raw JSON.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string =
    data?.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Model did not return JSON.");
  }
  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  return parsed as ClosePackage;
}
