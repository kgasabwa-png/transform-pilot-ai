import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const approveDeviceLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ code: z.string().min(4).max(64), label: z.string().max(80).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("approve_device_link", {
      _code: data.code,
      _label: data.label ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listLinkedDevices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("device_link_codes")
      .select("code, device_label, status, approved_at, consumed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const revokeLinkedDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("device_link_codes")
      .delete()
      .eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
