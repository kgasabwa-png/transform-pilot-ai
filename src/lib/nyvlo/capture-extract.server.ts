// Server-only helper: given a capture session's transcript + screen context,
// call Gemini to extract promises/action items and insert into the
// `promises` table tagged with capture_session_id.
import { adminClient } from "@/lib/nyvlo/google.server";

type ExtractedPromise = {
  text: string;
  due_at?: string | null;
  owner?: "self" | "other" | null;
  confidence?: number;
};

export async function extractPromisesFromSession(
  sessionId: string,
  userId: string,
): Promise<{ inserted: number; summary: string | null }> {
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

  const system = `You extract promises and action items from work conversations.
A "promise" is anything someone committed to do — follow-ups, deliverables, decisions, deadlines.
Return ONLY a JSON object: { "summary": "1–2 sentence meeting summary", "promises": [{ "text": "...", "owner": "self|other", "due_at": "ISO8601 or null", "confidence": 0-1 }] }
Be conservative. Skip chit-chat. Use the speaker labels to set owner — "self" means the user (typically labeled "me" or "user"), "other" means the counterparty.`;

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
  let parsed: { summary?: string; promises?: ExtractedPromise[] } = {};
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
      text: p.text,
      due_at: p.due_at || null,
      status: "open",
      source_kind: "capture",
      metadata: {
        owner: p.owner ?? null,
        confidence: p.confidence ?? null,
        extracted_at: new Date().toISOString(),
      } as any,
    }));

  if (rows.length) {
    await supabase.from("promises").insert(rows as any);
  }

  if (parsed.summary) {
    await supabase
      .from("capture_sessions")
      .update({ summary: parsed.summary })
      .eq("id", sessionId);
  }

  return { inserted: rows.length, summary: parsed.summary ?? null };
}
