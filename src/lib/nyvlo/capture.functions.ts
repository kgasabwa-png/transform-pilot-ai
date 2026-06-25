import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCaptureQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_capture_quota", {
      _user_id: context.userId,
    });
    if (error) throw error;
    return data as {
      is_pro: boolean;
      used: number;
      limit: number;
      allowed: boolean;
      period_start: string;
    };
  });

export const listCaptureSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("capture_sessions")
      .select("id, label, source, status, started_at, ended_at, duration_seconds, summary")
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

export const getCaptureSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const [sessionRes, chunksRes, framesRes, promisesRes] = await Promise.all([
      context.supabase
        .from("capture_sessions")
        .select(
          "id, label, source, status, started_at, ended_at, duration_seconds, summary, notes_md",
        )
        .eq("id", data.sessionId)
        .maybeSingle(),

      context.supabase
        .from("audio_chunks")
        .select("id, sequence, started_at, speaker, transcript, status, error")
        .eq("session_id", data.sessionId)
        .order("sequence", { ascending: true }),
      context.supabase
        .from("screen_frames")
        .select("id, sequence, captured_at, app_name, window_title, vision_summary, status")
        .eq("session_id", data.sessionId)
        .order("sequence", { ascending: true }),
      context.supabase
        .from("promises")
        .select("id, summary, status, due_at, owed_to, confidence, created_at")
        .eq("capture_session_id", data.sessionId)
        .order("created_at", { ascending: true }),
    ]);
    if (sessionRes.error) throw sessionRes.error;
    if (chunksRes.error) throw chunksRes.error;
    if (framesRes.error) throw framesRes.error;
    if (promisesRes.error) throw promisesRes.error;
    return {
      session: sessionRes.data,
      chunks: chunksRes.data ?? [],
      frames: framesRes.data ?? [],
      promises: promisesRes.data ?? [],
    };
  });

export const extractSessionPromises = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { extractPromisesFromSession } = await import("@/lib/nyvlo/capture-extract.server");
    return await extractPromisesFromSession(data.sessionId, context.userId);
  });

export const deleteCaptureSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("capture_sessions")
      .delete()
      .eq("id", data.sessionId);
    if (error) throw error;
    return { ok: true };
  });
