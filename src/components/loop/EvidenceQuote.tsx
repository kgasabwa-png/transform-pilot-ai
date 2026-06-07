// One clickable evidence chip used across CSM lanes, Manager co-sign queue,
// and the Leader drill-down. Opens ReceiptModal with the full source thread
// so every "cited to the call" claim is backed in the UI.

import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { ReceiptModal } from "./ReceiptModal";
import { receiptFromAction } from "@/lib/loop/receiptAdapter";
import type { LaneAction } from "@/lib/loop/consoleData";

export function EvidenceQuote({
  action,
  compact = false,
}: {
  action: LaneAction;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const receipt = receiptFromAction(action);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group block w-full text-left border-l-2 border-border hover:border-foreground/60 pl-3 transition-colors ${
          compact ? "text-[11px]" : "text-[12px]"
        } text-muted-foreground italic`}
      >
        <span className="not-italic block">
          <span className="italic">{action.evidence}</span>
        </span>
        <span className="not-italic mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
          <ExternalLink className="size-3" />
          {action.source}
          <span className="ml-1 inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Search className="size-2.5" /> view in context
          </span>
        </span>
      </button>
      <ReceiptModal receipt={receipt} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
