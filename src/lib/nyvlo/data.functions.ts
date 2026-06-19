import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listPromises = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("promises")
      .select("*")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const listMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("memory_items")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const getTodayStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ count: openCount }, { count: dueTodayCount }, { data: snap }] =
      await Promise.all([
        supabase
          .from("promises")
          .select("*", { count: "exact", head: true })
          .eq("status", "open"),
        supabase
          .from("promises")
          .select("*", { count: "exact", head: true })
          .eq("status", "open")
          .lte("due_at", new Date(Date.now() + 86400000).toISOString()),
        supabase
          .from("reliability_snapshots")
          .select("score, kept, missed")
          .eq("user_id", userId)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
    return {
      open: openCount ?? 0,
      dueToday: dueTodayCount ?? 0,
      reliability: snap?.score ?? null,
      kept: snap?.kept ?? 0,
      missed: snap?.missed ?? 0,
    };
  });

export const updatePromiseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "kept" | "missed" | "dismissed" | "open" }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("promises")
      .update({
        status: data.status,
        resolved_at: data.status === "open" ? null : new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const reportNotAPromise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; note?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error: fbErr } = await supabase.from("extraction_feedback").insert({
      promise_id: data.id,
      user_id: userId,
      verdict: "not_a_promise",
      note: data.note ?? null,
    });
    if (fbErr) throw fbErr;
    await supabase
      .from("promises")
      .update({ status: "dismissed", resolved_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

export const getPromiseSource = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: p, error } = await context.supabase
      .from("promises")
      .select("source_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !p?.source_id) return { url: null, title: null, kind: null };
    const { data: src } = await context.supabase
      .from("sources")
      .select("kind, subject, raw")
      .eq("id", p.source_id)
      .maybeSingle();
    const raw = (src?.raw ?? null) as { url?: string } | null;
    return { url: raw?.url ?? null, title: src?.subject ?? null, kind: src?.kind ?? null };
  });
