import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

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
    const { data } = await context.supabase
      .from("capture_sessions")
      .select(
        "id, label, source, status, started_at, ended_at, duration_seconds, summary, notes_md, metadata",
      )
      .order("started_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const getCaptureSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const [{ data: session }, { data: chunks }, { data: frames }, { data: promises }] =
      await Promise.all([
        context.supabase
          .from("capture_sessions")
          .select(
            "id, label, source, status, started_at, ended_at, duration_seconds, summary, notes_md, metadata",
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
          .select(
            "id, summary, status, due_at, owed_to, confidence, draft_reply, evidence_snippet, created_at",
          )
          .eq("capture_session_id", data.sessionId)
          .order("created_at", { ascending: true }),
      ]);
    return { session, chunks: chunks ?? [], frames: frames ?? [], promises: promises ?? [] };
  });

export const updateCaptureSessionNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { sessionId: string; manualNotes?: string; template?: string; label?: string }) =>
      input,
  )
  .handler(async ({ data, context }) => {
    const { data: existing, error: loadError } = await context.supabase
      .from("capture_sessions")
      .select("metadata")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!existing) throw new Error("Session not found");

    const metadata =
      existing.metadata &&
      typeof existing.metadata === "object" &&
      !Array.isArray(existing.metadata)
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {};

    if (typeof data.manualNotes === "string")
      metadata.manual_notes = data.manualNotes.slice(0, 20_000);
    if (typeof data.template === "string") metadata.meeting_template = data.template.slice(0, 80);

    const update: { metadata: Json; label?: string } = { metadata: metadata as Json };
    if (typeof data.label === "string") update.label = data.label.slice(0, 160);

    const { error } = await context.supabase
      .from("capture_sessions")
      .update(update)
      .eq("id", data.sessionId);
    if (error) throw error;

    return { ok: true };
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
