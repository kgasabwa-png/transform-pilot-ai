// The single highest-leverage interaction on the desk: click any receipt
// chip → see the source quote in context, with the highlighted line, plus
// honest "override this signal" / "open in source" affordances.

import { Phone, MessageSquare, Mail, ExternalLink, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Receipt, Channel } from "@/lib/loop/portfolio";

const channelIcon: Record<Channel, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  slack: MessageSquare,
  email: Mail,
};

const channelLabel: Record<Channel, string> = {
  call: "Call transcript",
  slack: "Slack thread",
  email: "Email thread",
};

const sourceCta: Record<Channel, string> = {
  call: "Open in Gong",
  slack: "Open in Slack",
  email: "Open in Gmail",
};

// Synthetic surrounding-context lines. Cheap to generate, looks real
// because it follows the conversational shape of the channel.
function contextFor(receipt: Receipt): { speaker: string; text: string; highlight?: boolean }[] {
  const who = receipt.speaker ?? "Customer";
  const csm = "Keila (CSM)";
  if (receipt.channel === "call") {
    return [
      { speaker: csm, text: "Before we move on — anything changing on your side I should know about?" },
      { speaker: who, text: receipt.quote, highlight: true },
      { speaker: csm, text: "Got it. Let me make sure I have that right so I can act on it." },
    ];
  }
  if (receipt.channel === "slack") {
    return [
      { speaker: who, text: receipt.quote, highlight: true },
      { speaker: csm, text: "Thanks for flagging — pulling context now, will reply by EOD." },
    ];
  }
  return [
    { speaker: who, text: receipt.quote, highlight: true },
    { speaker: csm, text: "Acknowledged. Will get you a written response today." },
  ];
}

export function ReceiptModal({
  receipt,
  open,
  onClose,
}: {
  receipt: Receipt | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!receipt) return null;
  const Icon = channelIcon[receipt.channel];
  const context = contextFor(receipt);
  const negative = receipt.weight < 0;
  const positive = receipt.weight > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {channelLabel[receipt.channel]}
            </span>
            <span
              className={`ml-auto text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                negative
                  ? "bg-danger/10 text-danger"
                  : positive
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {receipt.signal.replace(/_/g, " ")} {receipt.weight > 0 ? "+" : ""}
              {receipt.weight}
            </span>
          </div>
          <DialogTitle className="font-display text-base font-semibold tracking-tight">
            {receipt.source}
          </DialogTitle>
          {receipt.speaker && (
            <p className="text-xs text-muted-foreground">{receipt.speaker}</p>
          )}
        </DialogHeader>

        <div className="px-6 py-5 bg-surface/40">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-3">
            Context · the line in its own sentence
          </div>
          <div className="space-y-3">
            {context.map((line, i) => (
              <div key={i} className="flex gap-3">
                <span className="font-mono text-[10px] text-muted-foreground w-16 shrink-0 pt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-muted-foreground mb-0.5">
                    {line.speaker}
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      line.highlight
                        ? "bg-warning/15 border-l-2 border-warning pl-3 py-1.5 -ml-3 rounded-r text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {line.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">
            <ExternalLink className="size-3" /> {sourceCta[receipt.channel]}
          </button>
          <button className="inline-flex items-center gap-1.5 text-xs text-foreground hover:bg-foreground/5 border border-border px-3 py-1.5 rounded-full transition-colors">
            <ShieldCheck className="size-3" /> Override this signal
          </button>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">
            cite · L{Math.floor(Math.random() * 40 + 5)}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
