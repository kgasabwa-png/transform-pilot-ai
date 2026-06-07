import { useState } from "react";
import { Check, X, Coffee } from "lucide-react";
import { toast } from "sonner";
import { LaneShell } from "./LaneShell";
import { BLAST_LABEL } from "@/lib/loop/autonomy";
import { recordDecision } from "@/lib/loop/ledgerStore";
import type { LaneAction } from "@/lib/loop/consoleData";
import { EvidenceQuote } from "../EvidenceQuote";
import { EmptyState } from "../EmptyState";


export function QuickReviewLane({ items }: { items: LaneAction[] }) {
  const [idx, setIdx] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, "approve" | "skip">>({});

  const remaining = items.filter((i) => !decisions[i.id]);
  const approved = Object.values(decisions).filter((d) => d === "approve").length;
  const skipped = Object.values(decisions).filter((d) => d === "skip").length;

  const current = remaining[idx % Math.max(remaining.length, 1)];

  const decide = (d: "approve" | "skip") => {
    if (!current) return;
    setDecisions((p) => ({ ...p, [current.id]: d }));
    setIdx(0);
    if (d === "approve") {
      recordDecision(current, "approved");
      toast.success("Approved & queued to ship", {
        description: `${current.account} · ${current.headline}`,
      });
    } else {
      toast("Skipped — will resurface tomorrow", {
        description: current.account,
      });
    }
  };


  return (
    <LaneShell
      id="quick"
      count={items.length}
      badge={`${approved} approved · ${skipped} skipped`}
    >
      {!current ? (
        items.length === 0 ? (
          <EmptyState
            icon={Coffee}
            eyebrow="day 1"
            title="No drafts waiting"
            body="Customer-facing drafts will queue here once your agent has a call to draft from. Connect Gong or Zoom to start."
          />
        ) : (
          <EmptyState
            eyebrow="lane clear"
            title="Lane clear."
            body={`${approved} actions queued to ship. ${skipped} skipped — they'll resurface tomorrow.`}
          />
        )
      ) : (
        <div className="p-5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-2">
            <span>{current.account}</span>
            <span>·</span>
            <span>{BLAST_LABEL[current.blast]}</span>
            <span>·</span>
            <span className="tabular-nums">{current.confidence}% confidence</span>
            {current.arrAtStake && (
              <>
                <span>·</span>
                <span className="tabular-nums">
                  ${(current.arrAtStake / 1000).toFixed(0)}k ARR
                </span>
              </>
            )}
          </div>
          <h3 className="font-display text-base font-semibold leading-snug">
            {current.headline}
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5">{current.detail}</p>
          <div className="mt-3">
            <EvidenceQuote action={current} />
          </div>


          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => decide("approve")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-foreground text-background rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
            >
              <Check className="size-4" /> Approve
            </button>
            <button
              onClick={() => decide("skip")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 border border-border rounded-md px-3 py-2 text-sm font-medium hover:bg-foreground/5"
            >
              <X className="size-4" /> Skip
            </button>
            <button
              onClick={() => setIdx((i) => i + 1)}
              disabled={remaining.length <= 1}
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground disabled:opacity-30 px-2"
            >
              Next →
            </button>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground text-center mt-3 tabular-nums">
            {remaining.length} left in lane
          </div>
        </div>
      )}
    </LaneShell>
  );
}
