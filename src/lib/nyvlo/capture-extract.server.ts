// Server-only helper: given a capture session's transcript + screen context,
// call Gemini to extract promises/action items and insert into the
// `promises` table tagged with capture_session_id.
import { adminClient } from "@/lib/nyvlo/google.server";

type ExtractedPromise = {
  text: string;
  due_at?: string | null;
  owner?: "self" | "other" | null;
  confidence?: number;
  draft_reply?: string | null;
  owed_to_name?: string | null;
  evidence_snippet?: string | null;
};


export async function extractPromisesFromSession(
  sessionId: string,
  userId: string,
): Promise<{ inserted: number; summary: string | null; notes_md: string | null }> {

  const supabase = adminClient();
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const [{ data: session }, { data: chunks }, { data: frames }] = await Promise.all([
    supabase
      .from("capture_sessions")
      .select("id, label, started_at, summary")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("audio_chunks")
      .select("sequence, started_at, speaker, transcript")
      .eq("session_id", sessionId)
      .order("sequence", { ascending: true }),
    supabase
      .from("screen_frames")
      .select("captured_at, app_name, window_title, vision_summary, ocr_text")
      .eq("session_id", sessionId)
      .order("sequence", { ascending: true })
      .limit(40),
  ]);
  if (!session) throw new Error("Session not found");

  const transcript = (chunks ?? [])
    .filter((c) => c.transcript)
    .map((c) => `[${c.speaker ?? "speaker"}] ${c.transcript}`)
    .join("\n")
    .slice(0, 60_000);

  const screenContext = (frames ?? [])
    .map((f) =>
      [
        f.app_name && `App: ${f.app_name}`,
        f.window_title && `Window: ${f.window_title}`,
        f.vision_summary && `Screen: ${f.vision_summary}`,
      ]
        .filter(Boolean)
        .join(" · "),
    )
    .join("\n")
    .slice(0, 6_000);

  const system = `You are Nyvlo's meeting scribe. Given a transcript and optional screen context, produce structured notes in the same shape Granola uses, plus a clean list of commitments the user made.

Return ONLY a JSON object with this exact shape:
{
  "summary": "1-2 sentence plain-English recap of what happened",
  "notes_md": "Markdown meeting notes — see formatting rules below",
  "promises": [
    {
      "text": "short imperative ('Send pricing deck to Sarah')",
      "owner": "self|other",
      "owed_to_name": "person's name or null",
      "due_at": "ISO8601 or null",
      "confidence": 0-1,
      "evidence_snippet": "verbatim quote from transcript (<=200 chars)",
      "draft_reply": "2-3 sentence draft message the user could send to follow through, written in their voice — or null if N/A"
    }
  ]
}

notes_md formatting rules (mirror Granola):
- Start with a single H2 of the meeting topic (## Topic). No H1.
- Use bold short-phrase headers ("**Key decisions**", "**Discussion**", "**Open questions**", "**Next steps**") followed by tight bullet lists.
- Bullets are concise, fact-dense, no fluff. Never invent content unsupported by the transcript or screen context.
- Skip a section entirely if there is nothing real to put in it.
- If the transcript is too thin to write notes, return an empty string for notes_md.

Promise rules: only EXPLICIT commitments. Skip chit-chat. Use speaker labels to set owner ("me"/"user" → self). Always include draft_reply when owner is "self".`;



  const userMsg = `Session label: ${session.label ?? "(untitled)"}
Started: ${session.started_at}

— TRANSCRIPT —
${transcript || "(no transcript)"}

— SCREEN CONTEXT —
${screenContext || "(no screen activity)"}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini extract failed: ${res.status} ${t}`);
  }
  const json = (await res.json()) as any;
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: { summary?: string; notes_md?: string; promises?: ExtractedPromise[] } = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  // Replace prior auto-extracted promises for this session so re-extraction
  // doesn't pile up duplicates.
  await supabase
    .from("promises")
    .delete()
    .eq("capture_session_id", sessionId)
    .eq("user_id", userId);

  const rows = (parsed.promises ?? [])
    .filter((p) => p.text && p.text.length > 4)
    .slice(0, 30)
    .map((p) => ({
      user_id: userId,
      capture_session_id: sessionId,
      summary: p.text,
      due_at: p.due_at || null,
      status: "open" as const,
      channel: "capture",
      owed_to: p.owed_to_name || (p.owner === "self" ? "me" : p.owner === "other" ? "other" : null),
      confidence: typeof p.confidence === "number" ? p.confidence : null,
      draft_reply: p.draft_reply || null,
      evidence_snippet: p.evidence_snippet || null,
    }));

  if (rows.length) {
    await supabase.from("promises").insert(rows as any);
  }

  const sessionUpdate: Record<string, unknown> = {};
  if (parsed.summary) sessionUpdate.summary = parsed.summary;
  if (typeof parsed.notes_md === "string") sessionUpdate.notes_md = parsed.notes_md;
  if (Object.keys(sessionUpdate).length) {
    await supabase
      .from("capture_sessions")
      .update(sessionUpdate as any)
      .eq("id", sessionId);
  }

  return { inserted: rows.length, summary: parsed.summary ?? null, notes_md: parsed.notes_md ?? null };
}
