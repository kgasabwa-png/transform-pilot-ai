// ShipSequence — the 1-click multi-step simulated ship. The whole
// motion's steps execute in order with a short pause between each,
// and the user watches it happen. This is the "oh my god" beat.

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Motion } from "@/lib/loop/motions";
import { formatARR } from "@/lib/loop/portfolio";

const STEP_MS = 850;

export function ShipSequence({
  motion,
  open,
  onClose,
  onShipped,
}: {
  motion: Motion | null;
  open: boolean;
  onClose: () => void;
  onShipped: (m: Motion) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || !motion) return;
    setActiveIdx(-1);
    setDone(false);
    const total = motion.steps.length;
    let i = 0;
    const timers: number[] = [];
    const advance = () => {
      setActiveIdx(i);
      if (i < total - 1) {
        i += 1;
        timers.push(window.setTimeout(advance, STEP_MS));
      } else {
        timers.push(
          window.setTimeout(() => {
            setDone(true);
            onShipped(motion);
          }, STEP_MS),
        );
      }
    };
    timers.push(window.setTimeout(advance, 250));
    return () => timers.forEach(clearTimeout);
  }, [open, motion, onShipped]);

  if (!motion) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && done && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-1">
            {done ? "Save shipped" : "Shipping save play"}
          </div>
          <DialogTitle className="font-display text-base font-semibold tracking-tight">
            {motion.headline}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 space-y-3">
          {motion.steps.map((step, i) => {
            const status =
              i < activeIdx ? "done" : i === activeIdx ? "active" : "queued";
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 transition-opacity ${
                  status === "queued" ? "opacity-40" : "opacity-100"
                }`}
              >
                <div
                  className={`size-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    status === "done"
                      ? "bg-success/15 border-success/30 text-success"
                      : status === "active"
                        ? "bg-foreground/5 border-foreground/30 text-foreground"
                        : "bg-transparent border-border text-muted-foreground"
                  }`}
                >
                  {status === "done" ? (
                    <Check className="size-3.5" />
                  ) : status === "active" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <span className="font-mono text-[10px]">{i + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight">
                    {status === "queued" ? step.title : step.shippedCopy}
                  </div>
                  {(status === "active" || status === "done") && (
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                      → {step.to}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {done && (
          <div className="px-6 py-4 border-t border-border bg-success/[0.04] flex items-center gap-3">
            <div className="size-8 rounded-full bg-success/15 flex items-center justify-center">
              <Check className="size-4 text-success" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">
                +{formatARR(motion.arrImpact)} pulled back from churn.
              </div>
              <div className="text-[12px] text-muted-foreground">
                Manager briefed. CRM updated. Reply tracking on.
              </div>
            </div>
            <Button
              onClick={onClose}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
