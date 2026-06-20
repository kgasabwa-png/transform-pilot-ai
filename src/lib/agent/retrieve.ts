// Lightweight relevance scoring for agent context.
// No embeddings — keyword overlap + recency + status, fast enough per request.

import type { AgentPromise, AgentMemory } from "./context";

const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","else","for","to","of","in","on","at","by","with","from",
  "is","are","was","were","be","been","being","do","does","did","have","has","had","i","you","he","she",
  "it","we","they","them","my","your","his","her","its","our","their","this","that","these","those",
  "what","which","who","whom","whose","when","where","why","how","can","could","should","would","will",
  "just","about","me","mine","ours","yours","theirs","not","no","yes","up","down","out","over","into",
  "as","so","than","too","very","also","because","while","there","here","please","tell","know","need",
  "want","like","make","get","go","let","draft","send","reply","write","compose","prep","brief","research",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

type ChatTurn = { role: string; text: string };

/** Build a weighted query bag from the user's recent turns. Latest turn dominates. */
export function buildQueryTerms(turns: ChatTurn[]): Map<string, number> {
  const bag = new Map<string, number>();
  const recent = turns.slice(-6);
  recent.forEach((turn, i) => {
    const recencyWeight = (i + 1) / recent.length; // 0..1, latest = 1
    const roleBoost = turn.role === "user" ? 1.5 : 0.7;
    for (const tok of tokenize(turn.text)) {
      bag.set(tok, (bag.get(tok) ?? 0) + recencyWeight * roleBoost);
    }
  });
  return bag;
}

function scoreText(text: string, query: Map<string, number>): number {
  if (!query.size || !text) return 0;
  const toks = tokenize(text);
  if (!toks.length) return 0;
  let score = 0;
  for (const t of toks) {
    const w = query.get(t);
    if (w) score += w;
  }
  return score;
}

function recencyBoostFromNow(iso: string | null | undefined, halfLifeHours: number): number {
  if (!iso) return 0;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return 0;
  const hours = Math.abs(Date.now() - ts) / 3_600_000;
  return Math.exp(-hours / halfLifeHours); // 1 at now, decays
}

function dueBoost(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return 0;
  const hours = (ts - Date.now()) / 3_600_000;
  // Overdue gets the biggest boost; due within a week is high; far future tapers off.
  if (hours < 0) return 2.0;
  if (hours < 24) return 1.5;
  if (hours < 24 * 7) return 1.0;
  return 0.3;
}

export type RelevantContext = {
  promises: AgentPromise[];
  memory: AgentMemory[];
  totals: { promises: number; memory: number };
};

export function selectRelevantContext(args: {
  turns: ChatTurn[];
  promises: AgentPromise[];
  memory: AgentMemory[];
  promiseLimit?: number;
  memoryLimit?: number;
}): RelevantContext {
  const { turns, promises, memory } = args;
  const promiseLimit = args.promiseLimit ?? 12;
  const memoryLimit = args.memoryLimit ?? 10;
  const query = buildQueryTerms(turns);

  const hasQuery = query.size > 0;

  const scoredPromises = promises.map((p) => {
    const textScore = scoreText(
      [p.summary, p.owed_to ?? "", p.evidence_snippet ?? ""].join(" "),
      query,
    );
    const due = dueBoost(p.due_at);
    // Without a query, score by due alone so the system prompt still shows the most actionable items.
    const score = hasQuery ? textScore * 2 + due : due;
    return { item: p, score };
  });

  const scoredMemory = memory.map((m) => {
    const textScore = scoreText([m.title, m.snippet ?? ""].join(" "), query);
    const recency = recencyBoostFromNow(m.occurred_at, 24 * 14); // 2-week half-life
    const score = hasQuery ? textScore * 2 + recency * 0.5 : recency;
    return { item: m, score };
  });

  // Guarantee: always keep the top few overdue/soon promises regardless of query match.
  const mustInclude = new Set(
    [...promises]
      .filter((p) => p.status === "open")
      .sort((a, b) => dueBoost(b.due_at) - dueBoost(a.due_at))
      .slice(0, 3)
      .map((p) => p.id),
  );

  const topPromises = scoredPromises
    .sort((a, b) => {
      const aMust = mustInclude.has(a.item.id) ? 1 : 0;
      const bMust = mustInclude.has(b.item.id) ? 1 : 0;
      if (aMust !== bMust) return bMust - aMust;
      return b.score - a.score;
    })
    .slice(0, promiseLimit)
    .map((s) => s.item);

  const topMemory = scoredMemory
    .sort((a, b) => b.score - a.score)
    .slice(0, memoryLimit)
    .map((s) => s.item);

  return {
    promises: topPromises,
    memory: topMemory,
    totals: { promises: promises.length, memory: memory.length },
  };
}

/** Extract plain text from AI SDK UIMessage parts for retrieval scoring. */
export function turnsFromUIMessages(
  messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>,
): ChatTurn[] {
  return messages
    .map((m) => ({
      role: m.role,
      text: (m.parts ?? [])
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
        .join(" "),
    }))
    .filter((t) => t.text.trim().length > 0);
}
