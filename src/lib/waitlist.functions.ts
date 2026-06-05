import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  email: z.string().email().max(320),
  source: z.string().max(80).optional(),
  note: z.string().max(1000).optional(),
});

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("waitlist_signups").insert({
      email: data.email.trim().toLowerCase(),
      source: data.source ?? "waitlist",
      note: data.note ?? null,
    });

    if (error) {
      // 23505 = unique_violation → already on the list, treat as success
      if ((error as { code?: string }).code === "23505") {
        return { ok: true, already: true as const };
      }
      console.error("waitlist insert failed", error);
      return { ok: false, error: "Could not save your signup. Try again in a moment." };
    }
    return { ok: true, already: false as const };
  });
