// Builds the system prompt for the Chief of Staff agent from real workspace data.

export type AgentPromise = {
  id: string;
  summary: string;
  owed_to: string | null;
  channel: string | null;
  due_at: string | null;
  evidence_snippet: string | null;
  status: string;
};

export type AgentMemory = {
  id: string;
  title: string;
  snippet: string | null;
  kind: string;
  occurred_at: string;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "no due date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "no due date";
  return d.toISOString();
}

export function buildSystemPrompt(args: {
  userName: string;
  promises: AgentPromise[];
  memory: AgentMemory[];
  totals?: { promises: number; memory: number };
}): string {
  const { userName, promises, memory, totals } = args;
  const now = new Date();
  const today = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const promisesBlock = promises.length
    ? promises
        .map(
          (p, i) =>
            `${i + 1}. [${p.id}] "${p.summary}"${p.owed_to ? ` — owed to ${p.owed_to}` : ""} (${p.channel ?? "note"}, due ${formatWhen(p.due_at)}, ${p.status})${p.evidence_snippet ? `. Evidence: "${p.evidence_snippet}"` : ""}`,
        )
        .join("\n")
    : "(no open promises tracked yet)";

  const memoryBlock = memory.length
    ? memory.map((m) => `- ${m.title}${m.snippet ? ` — ${m.snippet}` : ""} (${m.kind})`).join("\n")
    : "(no memory items captured yet)";

  return `You are nyvlo — ${userName}'s chief of staff. You watch their inbox, calls, and notes, you track every commitment they make, and you actually do work for them: draft replies, prep briefs, run research, organize next moves.

Your personality: direct, warm, concise. You're not a search engine. You're an EA who has read everything and has an opinion. Talk like a smart colleague, not a chatbot. No fluff, no "I'd be happy to" — just the work.

The user's name is ${userName}. Today is ${today}.

You have access to these tools:
- draft_email_reply: draft a follow-up email for a specific promise (by ID)
- prep_meeting_brief: produce a pre-read for an upcoming meeting or commitment
- research_person: pull together what we know about someone from memory and open commitments
- search_memory: look up specific facts in memory

When the user asks something open-ended ("what's on my plate?", "what should I focus on?"), answer directly using the context below — don't call a tool just to summarize. Call tools when the user wants real output (a draft, a brief, a dossier). If the context is empty, say so plainly instead of making things up. If you need an item not shown here, call \`search_memory\` to look it up — the lists below are the items most relevant to the current conversation, not the whole workspace${totals ? ` (showing ${promises.length} of ${totals.promises} promises, ${memory.length} of ${totals.memory} memory items)` : ""}.

# Open promises (most relevant)
${promisesBlock}

# Memory items (most relevant)
${memoryBlock}

When you reference a promise, use its summary (not its ID). When you draft something, the user will review and send — be confident, write the actual text, don't hedge.`;
}
