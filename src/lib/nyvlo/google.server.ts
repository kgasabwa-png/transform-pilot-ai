// Server-only Google + AI helpers. Never import from client code.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText, Output } from "ai";
import { z } from "zod";

// --- Admin client (service role; bypasses RLS) ------------------------------
export function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server env missing");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// --- Google OAuth ------------------------------------------------------------
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

function requireGoogleEnv() {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error(
      "Google OAuth not configured. Add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in Project Settings.",
    );
  }
  return { id, secret };
}

export function googleAuthUrl(redirectUri: string, state: string) {
  const { id } = requireGoogleEnv();
  const p = new URLSearchParams({
    client_id: id,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const { id, secret } = requireGoogleEnv();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: id,
      client_secret: secret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    id_token?: string;
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const { id, secret } = requireGoogleEnv();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return (await res.json()) as { access_token: string; expires_in: number };
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const admin = adminClient();
  const { data: conn, error } = await admin
    .from("connections")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();
  if (error) throw error;
  if (!conn?.refresh_token) throw new Error("No Google connection. Connect Google in Settings.");

  const exp = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;
  if (conn.access_token && exp > Date.now() + 60_000) return conn.access_token;

  const refreshed = await refreshAccessToken(conn.refresh_token);
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  const { error: updateErr } = await admin
    .from("connections")
    .update({ access_token: refreshed.access_token, token_expires_at: newExpiry })
    .eq("user_id", userId)
    .eq("provider", "google");
  if (updateErr) {
    console.error("[getValidAccessToken] failed to persist refreshed token", updateErr.message);
  }
  return refreshed.access_token;
}

// --- Google API fetchers -----------------------------------------------------
export async function fetchCalendarEvents(accessToken: string) {
  const now = new Date();
  const past = new Date(now.getTime() - 30 * 86400000);
  const future = new Date(now.getTime() + 14 * 86400000);
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "50");
  url.searchParams.set("timeMin", past.toISOString());
  url.searchParams.set("timeMax", future.toISOString());

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Calendar fetch failed: ${await res.text()}`);
  const data = (await res.json()) as { items?: Array<Record<string, unknown>> };
  return data.items ?? [];
}

// --- AI extraction -----------------------------------------------------------
const ExtractionSchema = z.object({
  promises: z
    .array(
      z.object({
        summary: z.string(),
        owed_to: z.string().nullable(),
        due_at: z.string().nullable().describe("ISO date if mentioned, else null"),
        confidence: z.number().min(0).max(1),
        draft_reply: z.string().nullable(),
        evidence_snippet: z.string(),
      }),
    )
    .default([]),
  memory: z
    .object({
      title: z.string(),
      snippet: z.string(),
    })
    .nullable(),
});

export async function extractFromSource(source: {
  kind: "calendar_event" | "web_capture";
  subject: string | null;
  participants: string[] | null;
  body: string | null;
  occurred_at: string | null;
}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  const sourceLabel =
    source.kind === "calendar_event"
      ? "calendar event"
      : "snippet of text the user explicitly captured from a webpage (could be an email thread, doc, Slack, etc.)";
  const prompt = `You analyze a single ${sourceLabel} from the user's day.

Your ONLY job is to extract EXPLICIT commitments the USER made — statements where they said they would send, do, deliver, follow up, or get back to someone. Be conservative. If the text is vague, agenda-only, descriptive, or contains no first-person commitment, return promises: [].

DO NOT invent promises. DO NOT infer from titles alone. DO NOT extract promises made TO the user. DO NOT extract things that "could be done" — only things explicitly committed to.

Context:
- Subject/Title: ${source.subject ?? "(none)"}
- Participants: ${(source.participants ?? []).join(", ") || "(none)"}
- When: ${source.occurred_at ?? "unknown"}
- Body:
"""
${(source.body ?? "").slice(0, 3500)}
"""

For each promise:
- summary: 1 short sentence ("Send pricing deck to Sarah")
- owed_to: the person (or null)
- due_at: ISO timestamp if a deadline was mentioned (else null)
- confidence: 0-1. Only above 0.55 if the commitment is unambiguous and first-person.
- draft_reply: a 2-3 sentence draft message the user could send (or null)
- evidence_snippet: a VERBATIM substring copied from the body above that grounds the promise (<=200 chars). It MUST appear in the body word-for-word. If you cannot quote it verbatim, do not include the promise.

Also return a brief memory entry (title + 1-sentence snippet) summarizing what happened, or null if the text was too thin.`;

  try {
    const { experimental_output } = await generateText({
      model,
      prompt,
      experimental_output: Output.object({ schema: ExtractionSchema }),
    });

    // Anti-hallucination guard: drop low-confidence and quote-less promises.
    const haystack = (source.body ?? "").toLowerCase();
    const filtered = (experimental_output.promises ?? []).filter((p) => {
      if (!p.summary || !p.evidence_snippet) return false;
      if ((p.confidence ?? 0) < 0.55) return false;
      const needle = p.evidence_snippet.trim().toLowerCase();
      if (needle.length < 6) return false;
      const probe = needle.slice(0, Math.min(40, needle.length));
      return haystack.includes(probe);
    });

    return { promises: filtered, memory: experimental_output.memory };
  } catch (err) {
    console.error("[extractFromSource]", err);
    throw err;
  }
}

// --- Sync + extract pipeline -------------------------------------------------
export async function syncAndExtractForUser(userId: string) {
  const admin = adminClient();
  const runStarted = new Date().toISOString();
  const stats = { calendar: 0, promises: 0, memories: 0, errors: 0 };

  try {
    const accessToken = await getValidAccessToken(userId);

    // Calendar events
    const events = await fetchCalendarEvents(accessToken);
    for (const ev of events) {
      const e = ev as {
        id?: string;
        summary?: string;
        description?: string;
        start?: { dateTime?: string; date?: string };
        attendees?: Array<{ email?: string; displayName?: string }>;
      };
      if (!e.id) continue;
      const occurred = e.start?.dateTime ?? e.start?.date ?? null;
      const participants = (e.attendees ?? [])
        .map((a) => a.displayName || a.email || "")
        .filter(Boolean);
      const { data: upserted } = await admin
        .from("sources")
        .upsert(
          {
            user_id: userId,
            kind: "calendar_event",
            external_id: e.id,
            subject: e.summary ?? null,
            participants,
            body: e.description ?? null,
            raw: ev as never,
            occurred_at: occurred,
          },
          { onConflict: "user_id,kind,external_id", ignoreDuplicates: false },
        )
        .select("id, processed_at, subject, participants, body, occurred_at, kind")
        .maybeSingle();
      stats.calendar++;
      if (upserted && !upserted.processed_at) {
        try {
          await runExtractAndPersist(admin, userId, upserted, stats);
        } catch (extractErr) {
          console.error("[sync] extraction failed for source", upserted.id, extractErr);
          stats.errors++;
        }
      }
    }

    // Gmail sync intentionally disabled for MVP (pending Google verification).

    const { error: syncUpdateErr } = await admin
      .from("connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", "google");
    if (syncUpdateErr) {
      console.error("[sync] failed to update last_synced_at", syncUpdateErr.message);
    }

    await admin.from("agent_runs").insert({
      user_id: userId,
      kind: "sync",
      started_at: runStarted,
      finished_at: new Date().toISOString(),
      stats: stats as never,
    });
    return stats;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin.from("agent_runs").insert({
      user_id: userId,
      kind: "sync",
      started_at: runStarted,
      finished_at: new Date().toISOString(),
      stats: stats as never,
      error: msg,
    });
    throw err;
  }
}

type SourceRow = {
  id: string;
  kind: string;
  subject: string | null;
  participants: string[] | null;
  body: string | null;
  occurred_at: string | null;
};

async function runExtractAndPersist(
  admin: ReturnType<typeof adminClient>,
  userId: string,
  src: SourceRow,
  stats: { promises: number; memories: number; errors: number },
) {
  try {
    const result = await extractFromSource({
      kind: src.kind === "web_capture" ? "web_capture" : "calendar_event",
      subject: src.subject,
      participants: src.participants,
      body: src.body,
      occurred_at: src.occurred_at,
    });

    if (result.promises.length > 0) {
      const rows = result.promises.map((p) => ({
        user_id: userId,
        source_id: src.id,
        summary: p.summary,
        owed_to: p.owed_to,
        channel:
          src.kind === "calendar_event" ? "meeting" : src.kind === "web_capture" ? "web" : "email",
        due_at: p.due_at,
        confidence: p.confidence,
        draft_reply: p.draft_reply,
        evidence_snippet: p.evidence_snippet,
        status: "open" as const,
      }));
      const { error } = await admin.from("promises").insert(rows);
      if (error) {
        console.error("[extract] failed to insert promises", error.message);
        stats.errors++;
      } else {
        stats.promises += rows.length;
      }
    }

    if (result.memory) {
      const { error } = await admin.from("memory_items").insert({
        user_id: userId,
        source_id: src.id,
        kind:
          src.kind === "calendar_event" ? "meeting" : src.kind === "web_capture" ? "web" : "email",
        title: result.memory.title,
        snippet: result.memory.snippet,
        occurred_at: src.occurred_at ?? new Date().toISOString(),
      });
      if (error) {
        console.error("[extract] failed to insert memory item", error.message);
        stats.errors++;
      } else {
        stats.memories++;
      }
    }

    const { error: markErr } = await admin
      .from("sources")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", src.id);
    if (markErr) {
      console.error("[extract] failed to mark source as processed", markErr.message);
    }
  } catch (err) {
    console.error("[extract failed]", err);
    stats.errors++;
  }
}

// --- Context retrieval for Command Center chat -------------------------------
export async function getUserContext(userId: string) {
  const admin = adminClient();
  const [promisesRes, memoryRes] = await Promise.all([
    admin
      .from("promises")
      .select("summary, owed_to, due_at, status, evidence_snippet, draft_reply")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(40),
    admin
      .from("memory_items")
      .select("title, snippet, kind, occurred_at")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(30),
  ]);

  if (promisesRes.error) {
    console.error("[getUserContext] promises query failed", promisesRes.error.message);
  }
  if (memoryRes.error) {
    console.error("[getUserContext] memory query failed", memoryRes.error.message);
  }

  return {
    promises: promisesRes.data ?? [],
    memory: memoryRes.data ?? [],
  };
}

// --- Manual web capture from Chrome extension --------------------------------
export async function captureWebSnippet(
  userId: string,
  input: {
    url: string;
    title: string | null;
    selected_text: string;
    note: string | null;
  },
) {
  const admin = adminClient();

  // Per-source mute check (Phase 4): silence specific threads/channels/pages.
  const { deriveMuteKey } = await import("./mute-key");
  const { key: muteKey } = deriveMuteKey(input.url);
  const { data: muted } = await admin
    .from("muted_sources")
    .select("id")
    .eq("user_id", userId)
    .eq("mute_key", muteKey)
    .maybeSingle();
  if (muted) {
    return { source_id: null, promises: [], stats: { muted: true } };
  }

  const occurred = new Date().toISOString();
  const body = input.note
    ? `${input.selected_text}\n\n[User note: ${input.note}]`
    : input.selected_text;

  // Each capture is unique — use timestamp + url hash as external_id
  const externalId = `${Date.now()}_${input.url.slice(0, 200)}`;

  const { data: src, error: srcErr } = await admin
    .from("sources")
    .insert({
      user_id: userId,
      kind: "web_capture",
      external_id: externalId,
      subject: input.title ?? input.url,
      participants: [],
      body,
      raw: { url: input.url, note: input.note } as never,
      occurred_at: occurred,
    })
    .select("id, kind, subject, participants, body, occurred_at")
    .single();

  if (srcErr || !src) throw new Error(srcErr?.message ?? "Failed to save capture");

  const stats = { promises: 0, memories: 0, errors: 0 };
  await runExtractAndPersist(admin, userId, src, stats);

  // Return the newly created promises for the extension to show
  const { data: newPromises } = await admin
    .from("promises")
    .select("id, summary, owed_to, due_at, confidence, evidence_snippet")
    .eq("user_id", userId)
    .eq("source_id", src.id)
    .order("created_at", { ascending: false });

  return {
    source_id: src.id,
    promises: newPromises ?? [],
    stats,
  };
}
