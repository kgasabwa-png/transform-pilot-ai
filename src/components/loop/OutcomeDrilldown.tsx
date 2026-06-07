// Leader drill-down: click an outcome card → see the line items + citations
// that compose the number. The "audit the number" promise made real.

import { ExternalLink, X, CheckCircle2, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { drilldownFor } from "@/lib/loop/ledgerStore";
import { OUTCOMES } from "@/lib/loop/teamData";

export function OutcomeDrilldown({
  outcomeId,
  onClose,
}: {
  outcomeId: string | null;
  onClose: () => void;
}) {
  const outcome = OUTCOMES.find((o) => o.id === outcomeId);
  const items = outcomeId ? drilldownFor(outcomeId) : [];

  return (
    <Sheet open={!!outcomeId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-0"
      >
        {outcome && (
          <>
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                  audit · outcome ledger
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
              <SheetTitle className="font-display text-xl font-semibold tracking-tight">
                {outcome.label} · ${(outcome.arrTouched / 1000).toFixed(0)}k ARR
              </SheetTitle>
              <p className="text-[12px] text-muted-foreground">
                {outcome.shipped} closed line items this quarter. Sampling{" "}
                {items.length} below — every row pinned to the call, system event,
                or signal that produced it.
              </p>
            </SheetHeader>

            <div className="px-5 py-4 space-y-3">
              {items.map((a) => (
                <article
                  key={a.id}
                  className="rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                    <CheckCircle2 className="size-3 text-success" />
                    <span>{a.account}</span>
                    <span>·</span>
                    <span>{a.csm}</span>
                    {a.arrAtStake && (
                      <span className="ml-auto tabular-nums">
                        ${(a.arrAtStake / 1000).toFixed(0)}k
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold mt-1 leading-snug">
                    {a.headline}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {a.detail}
                  </p>
                  <blockquote className="mt-2 border-l-2 border-border pl-3 text-[11px] text-muted-foreground italic">
                    {a.evidence}
                    <div className="not-italic text-[10px] font-mono mt-1 inline-flex items-center gap-1">
                      <ExternalLink className="size-3" /> {a.source}
                    </div>
                  </blockquote>
                </article>
              ))}
            </div>

            <footer className="px-5 py-3 border-t border-border flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <FileText className="size-3" />
              Export to CSV · pipe to BI · webhook on every row
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
