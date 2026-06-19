import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listRecentEvents } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/events")({
  component: AdminEvents,
});

function AdminEvents() {
  const [eventFilter, setEventFilter] = useState("");
  const fetchEvents = useServerFn(listRecentEvents);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-events", eventFilter],
    queryFn: () => fetchEvents({ data: { event: eventFilter || undefined, limit: 300 } }),
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live event stream (auto-refresh 15s).</p>
      </header>

      <Input
        placeholder="Filter by event name (e.g. pageview)"
        value={eventFilter}
        onChange={(e) => setEventFilter(e.target.value)}
        className="max-w-sm"
      />

      <Card className="overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Path</th>
                <th className="px-3 py-2 font-medium">Visitor</th>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : (data ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No events.</td></tr>
              ) : (
                (data ?? []).map((e: any) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-3 py-1.5 text-[12px] tabular-nums text-muted-foreground">
                      {new Date(e.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[12px]">{e.event_name}</td>
                    <td className="px-3 py-1.5 font-mono text-[12px] text-muted-foreground">{e.path || "—"}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                      {e.visitor_id?.slice(0, 8)}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                      {e.user_id?.slice(0, 8) || "—"}
                    </td>
                    <td className="px-3 py-1.5 text-[12px] text-muted-foreground">
                      {e.utm_source || (e.referrer ? new URL(e.referrer).hostname : "direct")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
