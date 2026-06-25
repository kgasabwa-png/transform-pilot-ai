import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ActionType, Attendee, Evidence, AccountMetaRow } from "./companion.types";

const EXTRACT_MODEL_DEFAULT = "gpt-4o-mini";
const ALLOWED_TYPES: ActionType[] = ["email", "reminder", "crm_note"];
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

type DbClient = SupabaseClient<Database>;

type ExtractedAction = {
  type?: string;
  subject?: string;
  recipient?: string;
  subLine?: string;
  body?: string;
  evidence?: Evidence[];
};

type ExtractedPayload = {
  account?: string;
  title?: string;
  summary?: string;
  attendees?: Attendee[];
  accountMeta?: AccountMetaRow[];
  urgency?: "high" | "normal";
  urgencyLabel?: string;
  actions?: ExtractedAction[];
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function hasAiKey() {
  return Boolean((process.env.AI_GATEWAY_API_KEY || process.env.LOVABLE_API_KEY || "").trim());
}

export function companionAiConfigured() {
  return hasAiKey();
}

function aiHeaders() {
  const key = (process.env.AI_GATEWAY_API_KEY || process.env.LOVABLE_API_KEY || "").trim();
  const headerName = (process.env.AI_GATEWAY_API_KEY_HEADER || "Lovable-API-Key").trim();
  if (!key) throw new Error("AI gateway key missing");
  return {
    "Content-Type": "application/json",
    [headerName]: headerName.toLowerCase() === "authorization" ? `Bearer ${key}` : key,
  };
}

function aiBaseUrl() {
  return (process.env.AI_GATEWAY_BASE_URL || "https://ai.gateway.lovable.dev/v1").replace(
    /\/$/,
    "",
  );
}

function parseModelJson(raw: string): ExtractedPayload {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(text) as ExtractedPayload;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as ExtractedPayload;
      } catch {
        return {};
      }
    }
    return {};
  }
}

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function groundedEvidence(evidence: unknown, haystack: string): Evidence[] {
  if (!Array.isArray(evidence)) return [];
  return evidence
    .filter((item): item is Evidence => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return (
        typeof record.speaker === "string" &&
        typeof record.time === "string" &&
        typeof record.quote === "string"
      );
    })
    .filter((item) => {
      const quote = normalizeForMatch(item.quote);
      return quote.length >= 8 && haystack.includes(quote);
    })
    .slice(0, 4)
    .map((item) => ({
      speaker: item.speaker.slice(0, 80),
      time: item.time.slice(0, 20),
      quote: item.quote.slice(0, 500),
    }));
}

function sanitizeActions(actions: unknown, transcript: string) {
  if (!Array.isArray(actions)) return [];
  const haystack = normalizeForMatch(transcript);
  return actions
    .filter((item): item is ExtractedAction => Boolean(item && typeof item === "object"))
    .map((action) => {
      const type = ALLOWED_TYPES.includes(action.type as ActionType)
        ? (action.type as ActionType)
        : null;
      const body = typeof action.body === "string" ? action.body.trim() : "";
      if (!type || !body) return null;
      const evidence = groundedEvidence(action.evidence, haystack);
      if (evidence.length === 0) return null;
      const recipient =
        typeof action.recipient === "string" && EMAIL_RE.test(action.recipient.trim())
          ? action.recipient.trim()
          : null;
      return {
        type,
        subject: typeof action.subject === "string" ? action.subject.slice(0, 200) : null,
        recipient,
        subLine: typeof action.subLine === "string" ? action.subLine.slice(0, 180) : null,
        body: body.slice(0, 10_000),
        evidence,
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function clampAttendees(attendees: unknown): Attendee[] {
  if (!Array.isArray(attendees)) return [];
  return attendees
    .filter((item): item is Attendee => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return typeof record.n === "string" && record.n.trim().length > 0;
    })
    .map((item) => ({
      i: String(item.i || item.n.slice(0, 2))
        .slice(0, 3)
        .toUpperCase(),
      n: item.n.slice(0, 120),
      r: String(item.r || "").slice(0, 120),
    }))
    .slice(0, 12);
}

function clampAccountMeta(meta: unknown): AccountMetaRow[] {
  if (!Array.isArray(meta)) return [];
  return meta
    .filter((item): item is AccountMetaRow => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return typeof record.label === "string" && typeof record.value === "string";
    })
    .map((item) => ({ label: item.label.slice(0, 80), value: item.value.slice(0, 160) }))
    .slice(0, 8);
}

async function extractPayload(input: { title?: string; transcript: string }) {
  const system = `You are Nyvlo's meeting companion. You read a single customer call transcript and turn it into a structured recap plus grounded follow-up actions for the account owner.

Return only a JSON object with this exact shape:
{
  "account": "the customer or company name discussed",
  "title": "short meeting title",
  "summary": "2 to 4 sentence plain English recap of what happened and what was committed",
  "attendees": [{ "i": "MR", "n": "Maria Reyes", "r": "VP Operations" }],
  "accountMeta": [{ "label": "Plan", "value": "Pro · 40 seats" }],
  "urgency": "high|normal",
  "urgencyLabel": "short tag like Renewal or Expansion, empty string if normal",
  "actions": [
    {
      "type": "email|reminder|crm_note",
      "subject": "email subject for email type",
      "recipient": "single clean email address if known",
      "subLine": "one line context",
      "body": "drafted email, reminder text, or account note",
      "evidence": [{ "speaker": "Maria Reyes", "time": "11:18", "quote": "verbatim quote from the transcript" }]
    }
  ]
}

Rules:
- Produce 2 to 4 actions.
- Each action must be grounded in at least one verbatim evidence quote pulled directly from the transcript.
- Prefer one email recap action when the rep made commitments.
- Add reminder actions for time-bound follow-ups and crm_note actions for copy-ready account updates.
- Set urgency high only for renewal, churn risk, escalation, or deadline.
- Never fabricate facts not supported by the transcript.
- Email bodies are clean and human.
- Do not use em dashes. Do not use the words delve, leverage, seamless, robust, elevate, or unlock.`;

  const suggestedTitle = input.title?.trim() ? `Suggested title: ${input.title.trim()}\n\n` : "";
  const res = await fetch(`${aiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: aiHeaders(),
    body: JSON.stringify({
      model: (process.env.AI_EXTRACT_MODEL || EXTRACT_MODEL_DEFAULT).trim(),
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `${suggestedTitle}- TRANSCRIPT -\n${input.transcript.slice(0, 60_000)}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Companion extraction failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as ChatCompletionResponse;
  return parseModelJson(json.choices?.[0]?.message?.content ?? "{}");
}

export async function runCompanionExtraction(
  db: DbClient,
  userId: string,
  input: { title?: string; transcript: string },
): Promise<{ meetingId: string; actionCount: number }> {
  const transcript = input.transcript.trim();
  if (!transcript) throw new Error("A non-empty transcript is required.");
  if (!hasAiKey()) throw new Error("AI extraction is not configured.");

  const parsed = await extractPayload({ title: input.title, transcript });
  const actions = sanitizeActions(parsed.actions, transcript);
  if (actions.length === 0) {
    throw new Error("Extraction produced no grounded actions from this transcript.");
  }

  const urgency = parsed.urgency === "high" ? "high" : "normal";
  const meetingInsert = {
    user_id: userId,
    account: (parsed.account || "Untitled account").slice(0, 200),
    title: (input.title || parsed.title || "Meeting recap").slice(0, 200),
    ended: "Just now",
    status: "ready",
    urgency,
    urgency_label: urgency === "high" ? (parsed.urgencyLabel || "").slice(0, 60) : "",
    attendees: clampAttendees(parsed.attendees),
    account_meta: clampAccountMeta(parsed.accountMeta),
    summary: (parsed.summary || "Meeting extracted from transcript.").slice(0, 2500),
    sort_order: 0,
  };

  const meetingResult = await db
    .from("companion_meetings" as never)
    .insert(meetingInsert as never)
    .select("id")
    .single();
  if (meetingResult.error) throw meetingResult.error;
  const meeting = meetingResult.data as { id: string } | null;
  if (!meeting?.id) throw new Error("Could not create companion meeting.");

  const actionRows = actions.map((action, index) => ({
    meeting_id: meeting.id,
    user_id: userId,
    type: action.type,
    status: "suggested",
    recipient: action.recipient,
    cc: null,
    subject: action.subject,
    sub_line: action.subLine,
    body: action.body,
    evidence: action.evidence,
    tone_variants: null,
    steps: [],
    warnings: [],
    sort_order: index,
  }));
  const actionResult = await db.from("companion_actions" as never).insert(actionRows as never);
  if (actionResult.error) throw actionResult.error;

  return { meetingId: meeting.id, actionCount: actionRows.length };
}
