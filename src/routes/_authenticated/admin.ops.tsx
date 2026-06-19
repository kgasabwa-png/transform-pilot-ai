import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOpsHealth } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/ops")({
  component: AdminOps,
});

function StatusPill({ status }: { status: string }) {
  const good = status === "sent" || status === "approved" || status === "ok" || status === "active";
  const bad = status === "dlq" || status === "failed" || status === "bounced" || status === "error";
  return (
    <span
      className={[
        "rounded px-1.5 py-0.5 text-[11px]",
        good
          ? "bg-success/15 text-success"
          : bad
          ? "bg-destructive/15 text-destructive"
          : "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function AdminOps() {
  const fetchHealth = useServerFn(getOpsHealth);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ops"],
    queryFn: () => fetchHealth(),
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ops & Health</h1>
        <p className="mt-1 text-sm text-muted-foreground">Email log, agent runs, connections, devices, waitlist.</p>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-medium">Recent emails (7d)</h2>
        <Card className="overflow-hidden">
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/40 text-left text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Template</th>
                  <th className="px-3 py-2">Recipient</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.emails ?? []).map((e: any) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-3 py-1.5 text-[12px] text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-[12px]">{e.template_name}</td>
                    <td className="px-3 py-1.5 text-[12px] font-mono">{e.recipient_email}</td>
                    <td className="px-3 py-1.5"><StatusPill status={e.status} /></td>
                  </tr>
                ))}
                {(data?.emails ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">No emails.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-medium">Connections</h2>
          <div className="space-y-1.5 text-[13px]">
            {(data?.connections ?? []).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between gap-3">
                <span className="truncate">
                  <span className="font-mono text-xs text-muted-foreground">{c.provider}</span>{" "}
                  {c.google_email || ""}
                </span>
                <StatusPill status={c.status || "—"} />
              </div>
            ))}
            {(data?.connections ?? []).length === 0 && (
              <div className="text-muted-foreground">No connections.</div>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-medium">Recent device links</h2>
          <div className="space-y-1.5 text-[13px]">
            {(data?.devices ?? []).map((d: any) => (
              <div key={d.code} className="flex items-center justify-between gap-3">
                <span className="truncate">{d.device_label || "device"}</span>
                <StatusPill status={d.status} />
              </div>
            ))}
            {(data?.devices ?? []).length === 0 && (
              <div className="text-muted-foreground">None.</div>
            )}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Waitlist (latest 100)</h2>
        <Card className="overflow-hidden">
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/40 text-left text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {(data?.waitlist ?? []).map((w: any) => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="px-3 py-1.5 text-[12px] text-muted-foreground">
                      {new Date(w.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-[12px] font-mono">{w.email}</td>
                  </tr>
                ))}
                {(data?.waitlist ?? []).length === 0 && (
                  <tr><td colSpan={2} className="px-3 py-4 text-center text-muted-foreground">Empty.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
