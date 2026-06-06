import { useState } from "react";
import { Check, X, ExternalLink } from "lucide-react";
import { LaneShell } from "./LaneShell";
import { BLAST_LABEL } from "@/lib/loop/autonomy";
import type { LaneAction } from "@/lib/loop/consoleData";

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
  };

  return (
    <LaneShell
      id="quick"
      count={items.length}
      badge={`${approved} approved · ${skipped} skipped`}
    >
      {!current ? (
        <div className="px-5 py-8 text-center">
          <div className="font-display text-sm font-semibold">Lane clear.</div>
          <p className="text-[12px] text-muted-foreground mt-1">
            {approved} actions queued to ship. {skipped} skipped — they'll resurface tomorrow.
          </p>
        </div>
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
          <blockquote className="mt-3 border-l-2 border-border pl-3 text-[12px] text-muted-foreground italic">
            {current.evidence}
            <div className="not-italic text-[10px] font-mono text-muted-foreground mt-1 inline-flex items-center gap-1">
              <ExternalLink className="size-3" /> {current.source}
            </div>
          </blockquote>

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
