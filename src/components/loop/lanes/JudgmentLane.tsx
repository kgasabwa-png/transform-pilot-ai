import { useState } from "react";
import { AlertTriangle, Coffee } from "lucide-react";
import { toast } from "sonner";
import { LaneShell } from "./LaneShell";
import { BLAST_LABEL } from "@/lib/loop/autonomy";
import { recordDecision, routeForCosign } from "@/lib/loop/ledgerStore";
import type { LaneAction } from "@/lib/loop/consoleData";
import { EvidenceQuote } from "../EvidenceQuote";
import { EmptyState } from "../EmptyState";

export function JudgmentLane({ items }: { items: LaneAction[] }) {
  const [resolved, setResolved] = useState<Record<string, "approve" | "decline">>({});
  const open = items.filter((i) => !resolved[i.id]);

  return (
    <LaneShell id="judgment" count={items.length}>
      {open.length === 0 ? (
        <EmptyState
          icon={Coffee}
          eyebrow={items.length === 0 ? "day 1" : "all cleared"}
          title={items.length === 0 ? "No judgment calls yet" : "All cleared."}
          body={
            items.length === 0
              ? "Judgment calls land here once the agent has watched your book for ~24h. Until then, the Shipped lane shows internal actions you can revert."
              : "The hard calls are done. Next sweep in 14 min."
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {open.map((a) => (
            <li key={a.id} className="px-5 py-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                  {a.blast === "money" && <AlertTriangle className="size-2.5" />}
                  {BLAST_LABEL[a.blast]}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                  {a.confidence}% confidence
                </span>
                {a.arrAtStake && (
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums ml-auto">
                    ${(a.arrAtStake / 1000).toFixed(0)}k ARR
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">
                {a.account}
              </div>
              <h3 className="font-display text-base font-semibold leading-snug mt-0.5">
                {a.headline}
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5">{a.detail}</p>
              <div className="mt-3">
                <EvidenceQuote action={a} />
              </div>


              {a.blast === "money" && (
                <div className="mt-3 text-[11px] font-mono text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded px-2 py-1.5 inline-flex items-center gap-1.5">
                  <AlertTriangle className="size-3" />
                  Requires manager co-sign before send.
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => {
                    setResolved((p) => ({ ...p, [a.id]: "approve" }));
                    if (a.blast === "money") {
                      routeForCosign(a);
                      toast.success("Routed to manager for co-sign", {
                        description: `${a.account} · $${(
                          (a.arrAtStake ?? 0) / 1000
                        ).toFixed(0)}k ARR · switch to Manager view to release`,
                      });
                    } else {
                      recordDecision(a, "approved");
                      toast.success("Sent", {
                        description: `${a.account} · ${a.headline}`,
                      });
                    }
                  }}
                  className="bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-sm font-medium hover:opacity-90 shadow-sm"
                >
                  {a.blast === "money" ? "Request co-sign" : "Review & send"}
                </button>
                <button
                  onClick={() => {
                    setResolved((p) => ({ ...p, [a.id]: "decline" }));
                    recordDecision(a, "declined");
                    toast(`Declined — ${a.account}`);
                  }}
                  className="border border-border rounded-full px-4 py-1.5 text-sm font-medium hover:bg-foreground/5"
                >
                  Decline
                </button>
                <button className="text-[11px] font-mono text-muted-foreground hover:text-foreground px-2">
                  Edit draft
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </LaneShell>
  );
}
