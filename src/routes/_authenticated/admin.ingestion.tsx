import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Shell } from "@/components/nyvlo/Shell";
import { Card } from "@/components/ui/card";

const listIngestionErrors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data } = await context.supabase
      .from("ingestion_errors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const Route = createFileRoute("/_authenticated/admin/ingestion")({
  head: () => ({ meta: [{ title: "Ingestion errors · Operator" }] }),
  component: Page,
});

function Page() {
  const fetcher = useServerFn(listIngestionErrors);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "ingestion-errors"],
    queryFn: () => fetcher(),
    refetchInterval: 15_000,
  });

  return (
    <Shell title="Ingestion errors" subtitle="Latest 200 failures from capture endpoints.">
      <Card className="p-0">
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && data.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No errors. Pipeline is healthy.</div>
        )}
        {data.length > 0 && (
          <div className="divide-y divide-border">
            {data.map((e: any) => (
              <div key={e.id} className="grid grid-cols-[140px_180px_80px_1fr] items-start gap-4 px-5 py-3 text-[13px]">
                <div className="text-muted-foreground tabular-nums">
                  {new Date(e.created_at).toLocaleString()}
                </div>
                <div className="font-mono text-[12px]">{e.endpoint}</div>
                <div className={e.status_code >= 500 ? "text-destructive" : "text-warning"}>{e.status_code ?? "—"}</div>
                <div className="truncate">{e.error_message}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Shell>
  );
}
