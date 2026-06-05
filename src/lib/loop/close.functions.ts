import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Line = z.object({
  speaker: z.string().min(1).max(120),
  text: z.string().min(1).max(4000),
});

const Input = z.object({
  transcript: z.array(Line).min(2).max(400),
  accountName: z.string().min(1).max(200).optional(),
});

const SYSTEM = `You are Receipts, an execution agent for B2B SaaS customer-success teams.
You receive a raw call transcript (numbered lines) and return a strictly-JSON
"close package" that a CSM reviews in under 90 seconds. Every claim you make MUST cite
the 1-indexed line numbers it came from. NEVER fabricate. If a section has no
evidence in the transcript, return an empty array.

Return ONLY valid JSON matching this shape, no prose, no markdown fences:

{
  "headline": string,                              // one sentence summary
  "renewalSignal": "expand" | "renew" | "at_risk" | "churn_risk" | "unknown",
  "recordUpdates": [
    { "field": string, "before": string, "after": string,
      "citations": [{ "line": number, "quote": string }] }
  ],
  "email": {
    "to": string,                                  // best-guess recipient name
    "subject": string,
    "bodyParagraphs": [
      { "text": string, "citations": [{ "line": number, "quote": string }] }
    ]
  },
  "crmUpdate": string,                             // a single paste-ready CRM note
  "risks": [
    { "title": string, "severity": "low"|"medium"|"high",
      "rationale": string, "recommendedPlay": string,
      "citations": [{ "line": number, "quote": string }] }
  ]
}

Rules:
- "before" is the prior account state if known, otherwise "unknown".
- Email is in the CSM's voice: short, direct, ordered by customer priority. No emojis. No em-dashes.
- Every paragraph and every risk MUST include at least one citation.
- 2-5 record updates, 2-4 risks. Email: 2-4 short paragraphs.
- Never invent names, numbers, dates, or commitments that are not in the transcript.`;

export const runClose = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("AI gateway not configured. Add LOVABLE_API_KEY.");
    }

    const numbered = data.transcript.map((l, i) => `[${i + 1}] ${l.speaker}: ${l.text}`).join("\n");

    const userPrompt =
      (data.accountName ? `Account: ${data.accountName}\n\n` : "") +
      `TRANSCRIPT (1-indexed lines):\n\n${numbered}\n\nReturn the close package as raw JSON.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) {
        throw new Error("Rate limit reached. Try again in a moment.");
      }
      if (res.status === 402) {
        throw new Error("AI credits exhausted on this workspace.");
      }
      throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content ?? "";

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("Model did not return JSON.");
    }
    const parsed = JSON.parse(text.slice(start, end + 1));
    return parsed as ClosePackage;
  });

export type Citation = { line: number; quote: string };
export type RecordUpdate = {
  field: string;
  before: string;
  after: string;
  citations: Citation[];
};
export type EmailDraft = {
  to: string;
  subject: string;
  bodyParagraphs: { text: string; citations: Citation[] }[];
};
export type RiskItem = {
  title: string;
  severity: "low" | "medium" | "high";
  rationale: string;
  recommendedPlay: string;
  citations: Citation[];
};
export type ClosePackage = {
  headline: string;
  renewalSignal: "expand" | "renew" | "at_risk" | "churn_risk" | "unknown";
  recordUpdates: RecordUpdate[];
  email: EmailDraft;
  crmUpdate: string;
  risks: RiskItem[];
};
