// Embedding-based retrieval for /agent context.
// Lazily backfills embeddings for new/updated rows, then ranks via pgvector.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentPromise, AgentMemory } from "./context";

const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
const EMBED_DIMS = 1536;
const BACKFILL_LIMIT_PER_REQUEST = 50;

function promiseText(p: {
  summary: string;
  owed_to: string | null;
  channel: string | null;
  evidence_snippet: string | null;
}): string {
  return [
    p.summary,
    p.owed_to ? `owed to ${p.owed_to}` : null,
    p.channel ? `channel: ${p.channel}` : null,
    p.evidence_snippet ? `evidence: ${p.evidence_snippet}` : null,
  ]
    .filter(Boolean)
    .join(". ");
}

function memoryText(m: { title: string; snippet: string | null; kind: string }): string {
  return [m.title, m.snippet ?? "", `kind: ${m.kind}`].filter(Boolean).join(". ");
}

async function embedBatch(apiKey: string, inputs: string[]): Promise<number[][]> {
  if (!inputs.length) return [];
  const res = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Embedding request failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    data?: Array<{ index: number; embedding: number[] }>;
  };
  const data = json.data ?? [];
  // Provider guarantees order but sort defensively.
  const sorted = [...data].sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}

/** Convert a number[] embedding to the pgvector text literal Supabase expects. */
function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

type EmbedRow = { id: string; text: string };

/**
 * Embed rows that don't yet have a vector and persist them. Capped per request
 * so cold-start cost is bounded — the rest backfill across subsequent turns.
 */
async function backfillEmbeddings(
  supabase: SupabaseClient,
  table: "promises" | "memory_items",
  apiKey: string,
  rows: EmbedRow[],
): Promise<number> {
  const targets = rows.slice(0, BACKFILL_LIMIT_PER_REQUEST);
  if (!targets.length) return 0;
  const vectors = await embedBatch(
    apiKey,
    targets.map((r) => r.text.slice(0, 4000)),
  );
  if (vectors.length !== targets.length) return 0;
  await Promise.all(
    targets.map((r, i) =>
      supabase.from(table).update({ embedding: toVectorLiteral(vectors[i]) }).eq("id", r.id),
    ),
  );
  return targets.length;
}

export type SemanticSelection = {
  promises: AgentPromise[];
  memory: AgentMemory[];
  totals: { promises: number; memory: number };
  used: "embeddings" | "keyword" | "none";
};

export async function selectByEmbedding(args: {
  supabase: SupabaseClient;
  userId: string;
  apiKey: string;
  query: string;
  promiseLimit?: number;
  memoryLimit?: number;
  totals: { promises: number; memory: number };
}): Promise<SemanticSelection | null> {
  const { supabase, userId, apiKey, query, totals } = args;
  const promiseLimit = args.promiseLimit ?? 12;
  const memoryLimit = args.memoryLimit ?? 10;

  if (!query.trim()) return null;

  // 1) Backfill any rows missing embeddings so the search pool grows over time.
  const [missingPromisesRes, missingMemoryRes] = await Promise.all([
    supabase
      .from("promises")
      .select("id, summary, owed_to, channel, evidence_snippet")
      .eq("user_id", userId)
      .is("embedding", null)
      .limit(BACKFILL_LIMIT_PER_REQUEST),
    supabase
      .from("memory_items")
      .select("id, title, snippet, kind")
      .eq("user_id", userId)
      .is("embedding", null)
      .limit(BACKFILL_LIMIT_PER_REQUEST),
  ]);

  try {
    await Promise.all([
      backfillEmbeddings(
        supabase,
        "promises",
        apiKey,
        (missingPromisesRes.data ?? []).map((p) => ({ id: p.id, text: promiseText(p) })),
      ),
      backfillEmbeddings(
        supabase,
        "memory_items",
        apiKey,
        (missingMemoryRes.data ?? []).map((m) => ({ id: m.id, text: memoryText(m) })),
      ),
    ]);
  } catch (err) {
    // Backfill failure shouldn't block retrieval — the rest of the pool may still
    // have embeddings from prior turns. Log and continue.
    console.warn("[agent] embedding backfill failed:", (err as Error).message);
  }

  // 2) Embed the query, then run pgvector matches via RPC.
  let queryVec: number[];
  try {
    const [vec] = await embedBatch(apiKey, [query.slice(0, 4000)]);
    if (!vec || vec.length !== EMBED_DIMS) return null;
    queryVec = vec;
  } catch (err) {
    console.warn("[agent] query embed failed:", (err as Error).message);
    return null;
  }

  const queryLiteral = toVectorLiteral(queryVec);
  const [promisesMatchRes, memoryMatchRes] = await Promise.all([
    supabase.rpc("match_promises", {
      _user_id: userId,
      query_embedding: queryLiteral,
      match_count: promiseLimit,
    }),
    supabase.rpc("match_memory_items", {
      _user_id: userId,
      query_embedding: queryLiteral,
      match_count: memoryLimit,
    }),
  ]);

  if (promisesMatchRes.error) {
    console.warn("[agent] match_promises rpc error:", promisesMatchRes.error.message);
  }
  if (memoryMatchRes.error) {
    console.warn("[agent] match_memory_items rpc error:", memoryMatchRes.error.message);
  }

  const promiseRows = (promisesMatchRes.data ?? []) as Array<{
    id: string;
    summary: string;
    owed_to: string | null;
    channel: string | null;
    due_at: string | null;
    evidence_snippet: string | null;
    status: string;
  }>;
  const memoryRows = (memoryMatchRes.data ?? []) as Array<{
    id: string;
    title: string;
    snippet: string | null;
    kind: string;
    occurred_at: string;
  }>;

  if (!promiseRows.length && !memoryRows.length) {
    return { promises: [], memory: [], totals, used: "embeddings" };
  }

  const promises: AgentPromise[] = promiseRows
    .filter((r) => r.status === "open") // surface only actionable items in the prompt
    .map((r) => ({
      id: r.id,
      summary: r.summary,
      owed_to: r.owed_to,
      channel: r.channel,
      due_at: r.due_at,
      evidence_snippet: r.evidence_snippet,
      status: r.status,
    }));
  const memory: AgentMemory[] = memoryRows.map((r) => ({
    id: r.id,
    title: r.title,
    snippet: r.snippet,
    kind: r.kind,
    occurred_at: r.occurred_at,
  }));

  return { promises, memory, totals, used: "embeddings" };
}

/** Build a query string from recent conversation turns, latest weighted highest. */
export function queryFromTurns(
  turns: Array<{ role: string; text: string }>,
): string {
  // Latest user message dominates; include a couple of earlier turns for context.
  const recent = turns.slice(-5);
  const latestUser = [...recent].reverse().find((t) => t.role === "user");
  const earlier = recent.filter((t) => t !== latestUser).map((t) => t.text);
  return [latestUser?.text ?? "", ...earlier].filter(Boolean).join("\n");
}
