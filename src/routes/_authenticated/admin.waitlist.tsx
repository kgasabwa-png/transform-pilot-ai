import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getWaitlistStats, inviteWaitlistBatch } from "@/lib/admin/waitlist.functions";

export const Route = createFileRoute("/_authenticated/admin/waitlist")({
  component: WaitlistPage,
});

function WaitlistPage() {
  const qc = useQueryClient();
  const statsFn = useServerFn(getWaitlistStats);
  const inviteFn = useServerFn(inviteWaitlistBatch);
  const [batchSize, setBatchSize] = useState(25);

  const stats = useQuery({
    queryKey: ["waitlist-stats"],
    queryFn: () => statsFn(),
    staleTime: 10_000,
  });

  const invite = useMutation({
    mutationFn: (dryRun: boolean) => inviteFn({ data: { limit: batchSize, dryRun } }),
    onSuccess: (r: any) => {
      if (r.dryRun) {
        toast.success(`Dry run — would invite ${r.total} signups`);
      } else {
        toast.success(`Sent ${r.sent} invites${r.failed ? ` · ${r.failed} failed` : ""}`);
        qc.invalidateQueries({ queryKey: ["waitlist-stats"] });
      }
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to invite"),
  });

  const s = stats.data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Waitlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send the launch invite with the <span className="font-mono">EARLY50</span> promo code.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Total signups
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{s?.total ?? "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Invited</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{s?.invited ?? "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Pending</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{s?.pending ?? "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Batch size
          </div>
          <input
            type="number"
            min={1}
            max={100}
            value={batchSize}
            onChange={(e) => setBatchSize(Math.min(100, Math.max(1, Number(e.target.value) || 25)))}
            className="mt-1 w-full bg-transparent text-2xl font-semibold tabular-nums outline-none"
          />
        </Card>
      </section>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="font-medium">Send invite batch</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Sends the <span className="font-mono">waitlist-invite</span> email to the next{" "}
              {batchSize} signups who haven't been invited yet. Idempotent — re-running skips
              already-invited rows.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={invite.isPending || (s?.pending ?? 0) === 0}
                onClick={() => invite.mutate(true)}
              >
                {invite.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Dry run
              </Button>
              <Button
                disabled={invite.isPending || (s?.pending ?? 0) === 0}
                onClick={() => {
                  if (
                    confirm(`Send invite to next ${Math.min(batchSize, s?.pending ?? 0)} signups?`)
                  ) {
                    invite.mutate(false);
                  }
                }}
              >
                {invite.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send batch
              </Button>
            </div>
            {invite.data && !invite.data.dryRun ? (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Sent {invite.data.sent} / {invite.data.total}
                {invite.data.failed > 0 ? (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {invite.data.failed} failed
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {s?.pendingPreview?.length ? (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium">Next 10 in queue</h3>
          <div className="space-y-1.5">
            {s.pendingPreview.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-[13px]">
                <span className="font-mono text-muted-foreground">{r.email}</span>
                <span className="text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
