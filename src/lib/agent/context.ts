// Shared demo context for the Chief of Staff agent.
// Mirrors the seed data shown on /try so the agent can reason over it.

export type AgentPromise = {
  id: string;
  summary: string;
  owed_to: string | null;
  channel: "email" | "meeting" | "note";
  due_at: string;
  evidence_snippet: string;
};

export type AgentMemory = {
  id: string;
  text: string;
  source: string;
};

// Stable epoch — matches /try
export const DEMO_EPOCH = Date.UTC(2026, 5, 20, 14, 0, 0);
const inHours = (h: number) => new Date(DEMO_EPOCH + h * 3600_000).toISOString();

export const DEMO_PROMISES: AgentPromise[] = [
  {
    id: "1",
    summary: "Send Q3 forecast to Priya",
    owed_to: "Priya Shah",
    channel: "email",
    due_at: inHours(-3),
    evidence_snippet: "I'll have the updated forecast over to you by Thursday EOD.",
  },
  {
    id: "2",
    summary: "Reply to Marcus with revised SOW",
    owed_to: "Marcus Lee",
    channel: "email",
    due_at: inHours(6),
    evidence_snippet: "Let me revise the SOW and circle back later today.",
  },
  {
    id: "3",
    summary: "Share Figma file with design team",
    owed_to: "Design team",
    channel: "meeting",
    due_at: inHours(22),
    evidence_snippet: "I'll drop the Figma link in the channel after this call.",
  },
  {
    id: "4",
    summary: "Intro Sara to the recruiter at Linear",
    owed_to: "Sara Chen",
    channel: "email",
    due_at: inHours(48),
    evidence_snippet: "Happy to make the intro — let me ping them this week.",
  },
  {
    id: "5",
    summary: "Send refund for order #4821",
    owed_to: "support@acme.co",
    channel: "email",
    due_at: inHours(72),
    evidence_snippet: "We'll process that refund within 3 business days.",
  },
];

export const DEMO_MEMORY: AgentMemory[] = [
  { id: "m1", text: "Priya prefers Thursday updates by 4pm PT.", source: "Email · 12 days ago" },
  { id: "m2", text: "Acme renewal lands in October — Marcus is lead.", source: "Meeting note · 1 mo ago" },
  { id: "m3", text: "Sara is between roles, open to early-stage intros.", source: "Note · 2 weeks ago" },
  { id: "m4", text: "Design team channel is #design-launches, not #design.", source: "Slack pin · 3 days ago" },
  { id: "m5", text: "Internal SLA on refunds is 3 business days.", source: "Doc · 6 months ago" },
];

export function buildSystemPrompt(): string {
  const promisesBlock = DEMO_PROMISES.map(
    (p, i) =>
      `${i + 1}. [${p.id}] "${p.summary}"${p.owed_to ? ` — owed to ${p.owed_to}` : ""} (${p.channel}, due ${p.due_at}). Evidence: "${p.evidence_snippet}"`,
  ).join("\n");
  const memoryBlock = DEMO_MEMORY.map((m) => `- ${m.text} (${m.source})`).join("\n");

  return `You are nyvlo — the user's chief of staff. You watch their inbox, calls, and notes, you track every commitment they make, and you actually do work for them: draft replies, prep briefs, run research, organize next moves.

Your personality: direct, warm, concise. You're not a search engine. You're an EA who has read everything and has an opinion. Talk like a smart colleague, not a chatbot. No fluff, no "I'd be happy to" — just the work.

The user's name is Alex. Today is Saturday, June 20, 2026.

You have access to these tools:
- draft_email_reply: draft a follow-up email for a specific promise
- prep_meeting_brief: produce a pre-read for an upcoming meeting or commitment
- research_person: pull together what we know about someone from email/notes/memory
- search_memory: look up specific facts in memory

When the user asks something open-ended ("what's on my plate?", "what should I focus on?"), answer directly using the context below — don't call a tool just to summarize. Call tools when the user wants real output (a draft, a brief, a dossier).

# Open promises
${promisesBlock}

# Memory items
${memoryBlock}

When you reference a promise, use its summary (not its ID). When you draft something, the user will review and send — be confident, write the actual text, don't hedge.`;
}
