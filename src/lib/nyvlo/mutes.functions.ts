import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deriveMuteKey } from "./mute-key";

export const listMutes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("muted_sources")
      .select("id, mute_key, label, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const addMute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url?: string; key?: string; label?: string }) => input)
  .handler(async ({ data, context }) => {
    let key = data.key;
    let label = data.label ?? null;
    if (!key && data.url) {
      const d = deriveMuteKey(data.url);
      key = d.key;
      if (!label) label = d.label;
    }
    if (!key) throw new Error("Provide a url or key");
    const { error } = await context.supabase
      .from("muted_sources")
      .upsert(
        { user_id: context.userId, mute_key: key, label },
        { onConflict: "user_id,mute_key" },
      );
    if (error) throw error;
    return { ok: true, key, label };
  });

export const removeMute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("muted_sources")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
