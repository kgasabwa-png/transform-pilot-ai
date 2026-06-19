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
  await admin
    .from("connections")
    .update({ access_token: refreshed.access_token, token_expires_at: newExpiry })
    .eq("user_id", userId)
    .eq("provider", "google");
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

export async function fetchGmailSent(accessToken: string) {
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", "in:sent newer_than:30d");
  listUrl.searchParams.set("maxResults", "30");
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!listRes.ok) throw new Error(`Gmail list failed: ${await listRes.text()}`);
  const listData = (await listRes.json()) as { messages?: Array<{ id: string }> };
  const ids = (listData.messages ?? []).map((m) => m.id);

  const messages: Array<{ id: string; subject: string; to: string; snippet: string; body: string; date: string }> = [];
  for (const id of ids) {
    const detUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
    detUrl.searchParams.set("format", "full");
    const detRes = await fetch(detUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!detRes.ok) continue;
    const det = (await detRes.json()) as {
      snippet?: string;
      internalDate?: string;
      payload?: {
        headers?: Array<{ name: string; value: string }>;
        body?: { data?: string };
        parts?: Array<{ mimeType?: string; body?: { data?: string }; parts?: unknown }>;
      };
    };
    const headers = det.payload?.headers ?? [];
    const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value ?? "";
    const to = headers.find((h) => h.name.toLowerCase() === "to")?.value ?? "";
    const body = extractGmailText(det.payload).slice(0, 4000);
    messages.push({
      id,
      subject,
      to,
      snippet: det.snippet ?? "",
      body,
      date: det.internalDate ? new Date(Number(det.internalDate)).toISOString() : new Date().toISOString(),
    });
  }
  return messages;
}

function extractGmailText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as { mimeType?: string; body?: { data?: string }; parts?: unknown[] };
  if (p.mimeType === "text/plain" && p.body?.data) return decodeBase64Url(p.body.data);
  if (Array.isArray(p.parts)) {
    for (const part of p.parts) {
      const txt = extractGmailText(part);
      if (txt) return txt;
    }
  }
  if (p.body?.data) return decodeBase64Url(p.body.data);
  return "";
}

function decodeBase64Url(s: string): string {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    if (typeof Buffer !== "undefined") return Buffer.from(b64, "base64").toString("utf-8");
    return atob(b64);
  } catch {
    return "";
  }
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
  kind: "calendar_event" | "gmail_message";
  subject: string | null;
  participants: string[] | null;
  body: string | null;
  occurred_at: string | null;
}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  const prompt = `You analyze a single ${source.kind === "calendar_event" ? "calendar event" : "sent email"} from the user's day and extract any explicit promises or commitments the user made to other people.

Context:
- Subject/Title: ${source.subject ?? "(none)"}
- Participants: ${(source.participants ?? []).join(", ") || "(none)"}
- When: ${source.occurred_at ?? "unknown"}
- Body:
"""
${(source.body ?? "").slice(0, 3500)}
"""

A "promise" is a statement where the user said they would send something, do something, follow up, deliver, or get back to someone. Only extract things the USER promised — not promises made TO them.

If there are no promises, return promises: []. Always return a brief memory entry summarizing what happened (title + 1-sentence snippet) so the user can search it later.

For each promise:
- summary: 1 short sentence ("Send pricing deck to Sarah")
- owed_to: the person (or null)
- due_at: ISO timestamp if a deadline was mentioned (else null)
- confidence: 0-1 (how clearly was this promised?)
- draft_reply: a 2-3 sentence draft message the user could send to fulfill the promise (or null if not applicable)
- evidence_snippet: the exact phrase from the body that grounds this promise (<=200 chars)`;

  try {
    const { experimental_output } = await generateText({
      model,
      prompt,
      experimental_output: Output.object({ schema: ExtractionSchema }),
    });
    return experimental_output;
  } catch (err) {
    console.error("[extractFromSource]", err);
    return { promises: [], memory: null };
  }
}

// --- Sync + extract pipeline -------------------------------------------------
export async function syncAndExtractForUser(userId: string) {
  const admin = adminClient();
  const runStarted = new Date().toISOString();
  const stats = { calendar: 0, gmail: 0, promises: 0, memories: 0, errors: 0 };

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
      const participants = (e.attendees ?? []).map((a) => a.displayName || a.email || "").filter(Boolean);
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
        await runExtractAndPersist(admin, userId, upserted, stats);
      }
    }

    // Gmail sent
    const messages = await fetchGmailSent(accessToken);
    for (const m of messages) {
      const { data: upserted } = await admin
        .from("sources")
        .upsert(
          {
            user_id: userId,
            kind: "gmail_message",
            external_id: m.id,
            subject: m.subject,
            participants: [m.to],
            body: m.body || m.snippet,
            raw: m as never,
            occurred_at: m.date,
          },
          { onConflict: "user_id,kind,external_id", ignoreDuplicates: false },
        )
        .select("id, processed_at, subject, participants, body, occurred_at, kind")
        .maybeSingle();
      stats.gmail++;
      if (upserted && !upserted.processed_at) {
        await runExtractAndPersist(admin, userId, upserted, stats);
      }
    }

    await admin
      .from("connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", "google");

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
      kind: src.kind as "calendar_event" | "gmail_message",
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
        channel: src.kind === "calendar_event" ? "meeting" : "email",
        due_at: p.due_at,
        confidence: p.confidence,
        draft_reply: p.draft_reply,
        evidence_snippet: p.evidence_snippet,
        status: "open" as const,
      }));
      const { error } = await admin.from("promises").insert(rows);
      if (!error) stats.promises += rows.length;
    }

    if (result.memory) {
      const { error } = await admin.from("memory_items").insert({
        user_id: userId,
        source_id: src.id,
        kind: src.kind === "calendar_event" ? "meeting" : "email",
        title: result.memory.title,
        snippet: result.memory.snippet,
        occurred_at: src.occurred_at ?? new Date().toISOString(),
      });
      if (!error) stats.memories++;
    }

    await admin.from("sources").update({ processed_at: new Date().toISOString() }).eq("id", src.id);
  } catch (err) {
    console.error("[extract failed]", err);
    stats.errors++;
  }
}

// --- Context retrieval for Command Center chat -------------------------------
export async function getUserContext(userId: string) {
  const admin = adminClient();
  const [{ data: promises }, { data: memory }] = await Promise.all([
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

  return {
    promises: promises ?? [],
    memory: memory ?? [],
  };
}
