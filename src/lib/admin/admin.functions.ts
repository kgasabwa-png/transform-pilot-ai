import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin/assert-admin";

export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date();
    const d = (days: number) => new Date(now.getTime() - days * 86400_000).toISOString();

    const [
      profilesTotal,
      profiles7,
      profiles30,
      events24,
      events7,
      pageviews24,
      uniqueVisitors24,
      promisesTotal,
      promises24,
      waitlistTotal,
      waitlist7,
      emails24,
      emailsFailed24,
      activeUsers24,
      activeUsers7,
      activeUsers30,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d(7)),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d(30)),
      supabaseAdmin.from("page_events").select("id", { count: "exact", head: true }).gte("created_at", d(1)),
      supabaseAdmin.from("page_events").select("id", { count: "exact", head: true }).gte("created_at", d(7)),
      supabaseAdmin.from("page_events").select("id", { count: "exact", head: true }).eq("event_name", "pageview").gte("created_at", d(1)),
      supabaseAdmin.from("page_events").select("visitor_id").gte("created_at", d(1)),
      supabaseAdmin.from("promises").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("promises").select("id", { count: "exact", head: true }).gte("created_at", d(1)),
      supabaseAdmin.from("waitlist_signups").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("waitlist_signups").select("id", { count: "exact", head: true }).gte("created_at", d(7)),
      supabaseAdmin.from("email_send_log").select("id", { count: "exact", head: true }).gte("created_at", d(1)),
      supabaseAdmin.from("email_send_log").select("id", { count: "exact", head: true }).gte("created_at", d(1)).in("status", ["dlq", "failed", "bounced"]),
      supabaseAdmin.from("page_events").select("user_id").not("user_id", "is", null).gte("created_at", d(1)),
      supabaseAdmin.from("page_events").select("user_id").not("user_id", "is", null).gte("created_at", d(7)),
      supabaseAdmin.from("page_events").select("user_id").not("user_id", "is", null).gte("created_at", d(30)),
    ]);

    const uniq = (rows: any[] | null, key: string) =>
      rows ? new Set(rows.map((r) => r[key])).size : 0;

    return {
      users: {
        total: profilesTotal.count ?? 0,
        new7d: profiles7.count ?? 0,
        new30d: profiles30.count ?? 0,
        dau: uniq(activeUsers24.data, "user_id"),
        wau: uniq(activeUsers7.data, "user_id"),
        mau: uniq(activeUsers30.data, "user_id"),
      },
      traffic: {
        events24: events24.count ?? 0,
        events7d: events7.count ?? 0,
        pageviews24: pageviews24.count ?? 0,
        uniqueVisitors24: uniq(uniqueVisitors24.data, "visitor_id"),
      },
      product: {
        promisesTotal: promisesTotal.count ?? 0,
        promises24: promises24.count ?? 0,
      },
      marketing: {
        waitlistTotal: waitlistTotal.count ?? 0,
        waitlist7d: waitlist7.count ?? 0,
      },
      ops: {
        emails24: emails24.count ?? 0,
        emailsFailed24: emailsFailed24.count ?? 0,
      },
    };
  });

export const getDailySignups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    const buckets = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      buckets.set(day, 0);
    }
    (data ?? []).forEach((r: any) => {
      const day = (r.created_at as string).slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
  });

export const getDailyTraffic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("page_events")
      .select("created_at, visitor_id, event_name")
      .gte("created_at", since)
      .limit(50000);
    const buckets = new Map<string, { pageviews: number; visitors: Set<string> }>();
    for (let i = 29; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      buckets.set(day, { pageviews: 0, visitors: new Set() });
    }
    (data ?? []).forEach((r: any) => {
      const day = (r.created_at as string).slice(0, 10);
      const b = buckets.get(day);
      if (!b) return;
      if (r.event_name === "pageview") b.pageviews += 1;
      b.visitors.add(r.visitor_id);
    });
    return Array.from(buckets.entries()).map(([date, b]) => ({
      date,
      pageviews: b.pageviews,
      visitors: b.visitors.size,
    }));
  });

export const getTopPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("page_events")
      .select("path")
      .eq("event_name", "pageview")
      .gte("created_at", since)
      .limit(10000);
    const counts = new Map<string, number>();
    (data ?? []).forEach((r: any) => {
      const p = r.path || "(unknown)";
      counts.set(p, (counts.get(p) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([path, views]) => ({ path, views }));
  });

export const getTopSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("page_events")
      .select("utm_source, utm_medium, utm_campaign, referrer")
      .gte("created_at", since)
      .limit(20000);
    const counts = new Map<string, number>();
    (data ?? []).forEach((r: any) => {
      let key = r.utm_source;
      if (!key && r.referrer) {
        try {
          key = new URL(r.referrer).hostname;
        } catch {
          key = "direct";
        }
      }
      if (!key) key = "direct";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([source, count]) => ({ source, count }));
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const limit = Math.min(data.limit ?? 100, 500);
    let q = supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data.search) {
      q = q.or(`email.ilike.%${data.search}%,full_name.ilike.%${data.search}%`);
    }
    const { data: rows } = await q;
    const ids = (rows ?? []).map((r: any) => r.id);
    const [{ data: roleRows }, { data: promiseRows }, { data: eventRows }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin.from("promises").select("user_id").in("user_id", ids),
      supabaseAdmin
        .from("page_events")
        .select("user_id, created_at")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);
    const rolesByUser = new Map<string, string[]>();
    (roleRows ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    const promiseCount = new Map<string, number>();
    (promiseRows ?? []).forEach((r: any) =>
      promiseCount.set(r.user_id, (promiseCount.get(r.user_id) ?? 0) + 1)
    );
    const lastSeen = new Map<string, string>();
    (eventRows ?? []).forEach((r: any) => {
      if (!lastSeen.has(r.user_id)) lastSeen.set(r.user_id, r.created_at);
    });
    return (rows ?? []).map((r: any) => ({
      ...r,
      roles: rolesByUser.get(r.id) ?? [],
      promises: promiseCount.get(r.id) ?? 0,
      last_seen: lastSeen.get(r.id) ?? null,
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "admin" | "moderator" | "user"; grant: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !error.message.includes("duplicate")) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw error;
    }
    return { ok: true };
  });

export const listRecentEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number; event?: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("page_events")
      .select("id, created_at, event_name, path, visitor_id, user_id, referrer, utm_source, properties")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 1000));
    if (data.event) q = q.eq("event_name", data.event);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const getOpsHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const [emails, agentRuns, connections, devices, waitlist] = await Promise.all([
      supabaseAdmin
        .from("email_send_log")
        .select("id, created_at, template_name, recipient_email, status, error_message")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("agent_runs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin.from("connections").select("id, provider, status, google_email, last_synced_at"),
      supabaseAdmin
        .from("device_link_codes")
        .select("code, device_label, status, created_at, approved_at, consumed_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("waitlist_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    return {
      emails: emails.data ?? [],
      agentRuns: agentRuns.data ?? [],
      connections: connections.data ?? [],
      devices: devices.data ?? [],
      waitlist: waitlist.data ?? [],
    };
  });
