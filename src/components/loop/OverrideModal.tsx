// Override dialog — when a human rejects an agent's draft, we capture
// why. That "why" is the training signal that makes the agent better,
// and we show it back to the user as "agent learning from you".

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DraftAction } from "@/lib/loop/actions";

const REASONS = [
  { id: "bad-signal", label: "Bad signal", help: "The cited evidence doesn't actually mean what the agent thinks." },
  { id: "missing-context", label: "Missing context", help: "There's something the agent doesn't know that changes the call." },
  { id: "wrong-account", label: "Wrong account", help: "Account is in a state this play doesn't apply to." },
  { id: "wrong-timing", label: "Wrong timing", help: "Right play, but not this week." },
  { id: "tone-off", label: "Tone is off", help: "Substance is fine, voice or framing isn't." },
];

export function OverrideModal({
  action,
  open,
  onClose,
  onConfirm,
}: {
  action: DraftAction | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (action: DraftAction, reasonId: string, detail: string) => void;
}) {
  const [reasonId, setReasonId] = useState<string>("bad-signal");
  const [detail, setDetail] = useState("");

  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-1">
            Override the agent
          </span>
          <DialogTitle className="font-display text-base font-semibold tracking-tight">
            Why is this draft wrong?
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Your answer becomes training signal — the agent gets less wrong tomorrow.
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            {REASONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setReasonId(r.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors ${
                  reasonId === r.id
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{r.help}</div>
              </button>
            ))}
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
              One line to the agent (optional)
            </div>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="e.g. The procurement BCC was unrelated to our renewal."
              className="text-sm min-h-[80px]"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center gap-2">
          <Button variant="ghost" onClick={onClose} className="text-sm">
            Cancel
          </Button>
          <Button
            className="ml-auto bg-foreground text-background hover:bg-foreground/90"
            onClick={() => onConfirm(action, reasonId, detail)}
          >
            Override and teach
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
