import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden");
}

export const getWaitlistStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: total }, { count: invited }, { data: pending }] = await Promise.all([
      supabaseAdmin.from("waitlist_signups").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("waitlist_signups").select("*", { count: "exact", head: true }).not("invited_at", "is", null),
      supabaseAdmin
        .from("waitlist_signups")
        .select("id, email, created_at")
        .is("invited_at", null)
        .order("created_at", { ascending: true })
        .limit(10),
    ]);
    return {
      total: total ?? 0,
      invited: invited ?? 0,
      pending: (total ?? 0) - (invited ?? 0),
      pendingPreview: pending ?? [],
    };
  });

/**
 * Invites pending waitlist signups by sending the `waitlist-invite` email.
 * Idempotent: only emails rows where invited_at IS NULL, then stamps invited_at.
 * Batched to avoid timeouts. Returns counts and any errors.
 */
export const inviteWaitlistBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number; dryRun?: boolean }) => ({
    limit: Math.min(Math.max(input.limit ?? 25, 1), 100),
    dryRun: !!input.dryRun,
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("waitlist_signups")
      .select("id, email")
      .is("invited_at", null)
      .order("created_at", { ascending: true })
      .limit(data.limit);
    if (error) throw error;
    const targets = (rows as Array<{ id: string; email: string }> | null) ?? [];
    if (data.dryRun) {
      return { sent: 0, failed: 0, total: targets.length, dryRun: true, emails: targets.map((r) => r.email) };
    }

    const req = getRequest();
    const origin = req ? new URL(req.url).origin : (process.env.PUBLIC_SITE_URL ?? "https://nyvloai.com");
    const bearer = req?.headers.get("authorization") ?? "";
    const signupUrl = `${origin}/auth?next=${encodeURIComponent("/pricing")}`;

    let sent = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Internal call into the existing send route. We have the bearer from the
    // admin caller — the send route uses it for auth.
    // We avoid spawning N HTTP calls in parallel to keep the worker happy.
    // Read the bearer once.
    const internalSend = async (email: string, id: string) => {
      const idempotencyKey = `waitlist-invite-${id}`;
      const url = `${origin}/lovable/email/transactional/send`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: bearer,
        },
        body: JSON.stringify({
          templateName: "waitlist-invite",
          recipientEmail: email,
          idempotencyKey,
          templateData: { signupUrl, promoCode: "EARLY50" },
        }),
      });
      if (!res.ok) {
        throw new Error(`${res.status} ${await res.text().catch(() => "")}`);
      }
    };

    for (const row of targets) {
      try {
        await internalSend(row.email, row.id);
        await supabaseAdmin
          .from("waitlist_signups")
          .update({ invited_at: new Date().toISOString() })
          .eq("id", row.id);
        sent++;
      } catch (e: any) {
        failed++;
        errors.push({ email: row.email, error: e?.message ?? "send failed" });
      }
    }

    return { sent, failed, total: targets.length, dryRun: false, errors };
  });
