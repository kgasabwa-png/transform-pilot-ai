import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminOverview,
  getDailySignups,
  getDailyTraffic,
  getTopPages,
  getTopSources,
} from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div> : null}
    </Card>
  );
}

function Sparkbars({ data, valueKey }: { data: any[]; valueKey: string }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0));
  return (
    <div className="flex h-24 items-end gap-[2px]">
      {data.map((d, i) => (
        <div
          key={i}
          title={`${d.date}: ${d[valueKey]}`}
          className="flex-1 rounded-sm bg-primary/70 hover:bg-primary"
          style={{ height: `${((d[valueKey] || 0) / max) * 100}%`, minHeight: "1px" }}
        />
      ))}
    </div>
  );
}

function AdminOverview() {
  const overview = useServerFn(getAdminOverview);
  const signups = useServerFn(getDailySignups);
  const traffic = useServerFn(getDailyTraffic);
  const pages = useServerFn(getTopPages);
  const sources = useServerFn(getTopSources);

  const o = useQuery({ queryKey: ["admin-overview"], queryFn: () => overview() });
  const s = useQuery({ queryKey: ["admin-signups"], queryFn: () => signups() });
  const t = useQuery({ queryKey: ["admin-traffic"], queryFn: () => traffic() });
  const p = useQuery({ queryKey: ["admin-pages"], queryFn: () => pages() });
  const src = useQuery({ queryKey: ["admin-sources"], queryFn: () => sources() });

  const d = o.data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 24h / 7d / 30d snapshots.</p>
      </header>

      <section>
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Users</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <Stat label="Total users" value={d?.users.total ?? "—"} />
          <Stat label="New 7d" value={d?.users.new7d ?? "—"} />
          <Stat label="New 30d" value={d?.users.new30d ?? "—"} />
          <Stat label="DAU" value={d?.users.dau ?? "—"} />
          <Stat label="WAU" value={d?.users.wau ?? "—"} />
          <Stat label="MAU" value={d?.users.mau ?? "—"} />
        </div>
      </section>

      <section>
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Traffic (24h)</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Pageviews 24h" value={d?.traffic.pageviews24 ?? "—"} />
          <Stat label="Unique visitors 24h" value={d?.traffic.uniqueVisitors24 ?? "—"} />
          <Stat label="Events 24h" value={d?.traffic.events24 ?? "—"} />
          <Stat label="Events 7d" value={d?.traffic.events7d ?? "—"} />
        </div>
      </section>

      <section>
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Product & Ops</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <Stat label="Promises total" value={d?.product.promisesTotal ?? "—"} />
          <Stat label="Promises 24h" value={d?.product.promises24 ?? "—"} />
          <Stat label="Waitlist total" value={d?.marketing.waitlistTotal ?? "—"} />
          <Stat label="Waitlist 7d" value={d?.marketing.waitlist7d ?? "—"} />
          <Stat label="Emails 24h" value={d?.ops.emails24 ?? "—"} />
          <Stat
            label="Email failures 24h"
            value={d?.ops.emailsFailed24 ?? "—"}
            sub={d && d.ops.emailsFailed24 > 0 ? "needs attention" : "all clear"}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Signups · 30d</h3>
            <span className="text-[11px] text-muted-foreground">
              {(s.data ?? []).reduce((a, b) => a + b.count, 0)} total
            </span>
          </div>
          <Sparkbars data={s.data ?? []} valueKey="count" />
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Pageviews · 30d</h3>
            <span className="text-[11px] text-muted-foreground">
              {(t.data ?? []).reduce((a, b) => a + b.pageviews, 0)} total
            </span>
          </div>
          <Sparkbars data={t.data ?? []} valueKey="pageviews" />
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-medium">Top pages · 7d</h3>
          <div className="space-y-1.5">
            {(p.data ?? []).map((r) => (
              <div key={r.path} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate font-mono text-muted-foreground">{r.path}</span>
                <span className="tabular-nums">{r.views}</span>
              </div>
            ))}
            {p.data?.length === 0 && <div className="text-sm text-muted-foreground">No pageviews yet.</div>}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-medium">Top sources · 30d</h3>
          <div className="space-y-1.5">
            {(src.data ?? []).map((r) => (
              <div key={r.source} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate">{r.source}</span>
                <span className="tabular-nums">{r.count}</span>
              </div>
            ))}
            {src.data?.length === 0 && <div className="text-sm text-muted-foreground">No source data yet.</div>}
          </div>
        </Card>
      </section>
    </div>
  );
}
