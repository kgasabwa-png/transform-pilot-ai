import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function genToken(): string {
  // 32 random bytes -> base64url, prefixed for readability
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `nyv_${b64}`;
}

export const listExtensionTokens = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("extension_tokens")
      .select("id, token, label, last_used_at, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createExtensionToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label?: string }) => input)
  .handler(async ({ data, context }) => {
    const token = genToken();
    const { error } = await context.supabase
      .from("extension_tokens")
      .insert({
        user_id: context.userId,
        token,
        label: data.label ?? "Browser extension",
      });
    if (error) throw error;
    return { token };
  });

export const deleteExtensionToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("extension_tokens")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
