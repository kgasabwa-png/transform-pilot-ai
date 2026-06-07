import { useState } from "react";
import { Undo2, Coffee } from "lucide-react";
import { toast } from "sonner";
import { LaneShell } from "./LaneShell";
import { revertShipped } from "@/lib/loop/ledgerStore";
import { receiptFromAction } from "@/lib/loop/receiptAdapter";
import { ReceiptModal } from "../ReceiptModal";
import { EmptyState } from "../EmptyState";
import type { LaneAction } from "@/lib/loop/consoleData";
import type { Receipt } from "@/lib/loop/portfolio";



export function ShippedLane({ items }: { items: LaneAction[] }) {
  const [reverted, setReverted] = useState<Record<string, boolean>>({});
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const revertedCount = Object.values(reverted).filter(Boolean).length;

  return (
    <LaneShell
      id="shipped"
      count={items.length}
      badge={`${revertedCount} reverted this session`}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={Coffee}
          eyebrow="day 1"
          title="Nothing shipped yet"
          body="Once the agent watches your book for a sleep cycle, internal updates land here every morning. Connect Salesforce to begin."
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((a) => {
            const isReverted = !!reverted[a.id];
            return (
              <li
                key={a.id}
                className={`px-5 py-3 flex items-start gap-3 ${
                  isReverted ? "opacity-50" : ""
                }`}
              >
                <div className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0 w-12 pt-0.5">
                  {a.shippedAt}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono text-muted-foreground">
                    {a.account} · {a.source}
                  </div>
                  <div
                    className={`text-sm leading-snug mt-0.5 ${
                      isReverted ? "line-through" : ""
                    }`}
                  >
                    {a.headline}
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceipt(receiptFromAction(a))}
                    className="text-[11px] text-muted-foreground italic mt-1 line-clamp-1 hover:text-foreground transition-colors text-left w-full"
                  >
                    {a.evidence}
                  </button>
                </div>
                <button
                  onClick={() => {
                    const next = !reverted[a.id];
                    setReverted((p) => ({ ...p, [a.id]: next }));
                    if (next) {
                      revertShipped(a.id);
                      toast("Reverted", {
                        description: `${a.account} · ${a.headline}`,
                        action: {
                          label: "Undo",
                          onClick: () =>
                            setReverted((p) => ({ ...p, [a.id]: false })),
                        },
                      });
                    }
                  }}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-foreground/5"
                >
                  <Undo2 className="size-3" />
                  {isReverted ? "Undo revert" : "Revert"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <ReceiptModal
        receipt={receipt}
        open={!!receipt}
        onClose={() => setReceipt(null)}
      />
    </LaneShell>
  );
}

