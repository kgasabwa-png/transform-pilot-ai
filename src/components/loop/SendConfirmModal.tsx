// Simulates the actual "ship it" moment. Two-stage animation:
// 1) confirm — show what's about to leave, last edit chance
// 2) sending — progress strip + agent doing the work
// 3) shipped — green confirmation + close.
// In a real product this is where Gmail/Salesforce/Slack APIs run.

import { useEffect, useState } from "react";
import { Send, Check, Loader2, Mail, Database, Calendar, Flag, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { DraftAction } from "@/lib/loop/actions";

const iconFor = {
  email: Mail,
  "crm-update": Database,
  meeting: Calendar,
  flag: Flag,
  "forecast-move": TrendingUp,
} as const;

const verbFor = {
  email: "Send email",
  "crm-update": "Update CRM",
  meeting: "Send meeting invite",
  flag: "Raise flag",
  "forecast-move": "Commit forecast change",
} as const;

const sendingCopy = {
  email: ["Composing in your voice…", "Connecting to Gmail…", "Sending…"],
  "crm-update": ["Composing diff…", "Connecting to Salesforce…", "Writing record…"],
  meeting: ["Checking attendee availability…", "Connecting to calendar…", "Sending invite…"],
  flag: ["Updating account state…", "Notifying owners…", "Logging citation…"],
  "forecast-move": ["Recomputing rollup…", "Writing to forecast log…", "Notifying VP…"],
} as const;

const shippedCopy = {
  email: "Sent. Reply tracked. Will surface here if it lands.",
  "crm-update": "CRM updated. Diff logged.",
  meeting: "Invite sent. Hold reserved on your calendar.",
  flag: "Flag raised. Owners notified.",
  "forecast-move": "Forecast updated. Change is in this week's log.",
} as const;

export function SendConfirmModal({
  action,
  open,
  onClose,
  onShipped,
}: {
  action: DraftAction | null;
  open: boolean;
  onClose: () => void;
  onShipped: (action: DraftAction, edited: Partial<DraftAction>) => void;
}) {
  const [stage, setStage] = useState<"confirm" | "sending" | "shipped">("confirm");
  const [step, setStep] = useState(0);
  const [editedEmailBody, setEditedEmailBody] = useState("");
  const [editedSubject, setEditedSubject] = useState("");

  useEffect(() => {
    if (open && action) {
      setStage("confirm");
      setStep(0);
      setEditedEmailBody(action.email?.body ?? "");
      setEditedSubject(action.email?.subject ?? "");
    }
  }, [open, action?.id]);

  useEffect(() => {
    if (stage !== "sending" || !action) return;
    const copy = sendingCopy[action.kind];
    if (step < copy.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 700);
      return () => clearTimeout(t);
    }
    const done = setTimeout(() => {
      setStage("shipped");
      const edited: Partial<DraftAction> = action.email
        ? { email: { ...action.email, body: editedEmailBody, subject: editedSubject } }
        : {};
      onShipped(action, edited);
    }, 800);
    return () => clearTimeout(done);
  }, [stage, step, action, editedEmailBody, editedSubject, onShipped]);

  if (!action) return null;
  const Icon = iconFor[action.kind];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && stage !== "sending" && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              {verbFor[action.kind]}
            </span>
            <span className="ml-auto text-[11px] font-mono text-muted-foreground">
              {action.agent}
            </span>
          </div>
          <DialogTitle className="font-display text-base font-semibold tracking-tight">
            {action.oneLine}
          </DialogTitle>
        </DialogHeader>

        {stage === "confirm" && (
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {action.email && (
              <>
                <Field label="To">{action.email.to}</Field>
                <div>
                  <FieldLabel>Subject</FieldLabel>
                  <Input
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <FieldLabel>Body — edit before sending</FieldLabel>
                  <Textarea
                    value={editedEmailBody}
                    onChange={(e) => setEditedEmailBody(e.target.value)}
                    className="min-h-[200px] text-sm font-sans leading-relaxed"
                  />
                </div>
              </>
            )}
            {action.crm && (
              <div className="space-y-2">
                <Field label="Object">{action.crm.object}</Field>
                <Field label="Field">{action.crm.field}</Field>
                <div className="rounded-md border border-border bg-surface p-3 space-y-2">
                  <div className="flex gap-2 text-sm">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-danger w-12 shrink-0 pt-0.5">
                      Before
                    </span>
                    <span className="line-through text-muted-foreground">
                      {action.crm.before}
                    </span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-success w-12 shrink-0 pt-0.5">
                      After
                    </span>
                    <span className="font-medium">{action.crm.after}</span>
                  </div>
                </div>
              </div>
            )}
            {action.meeting && (
              <div className="space-y-3">
                <Field label="Attendee">{action.meeting.attendee}</Field>
                <Field label="Duration">{action.meeting.durationMin} min</Field>
                <div>
                  <FieldLabel>Pick a slot</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {action.meeting.slots.map((s) => (
                      <button
                        key={s}
                        className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-foreground hover:text-background transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Agenda you'll bring">
                  <span className="text-sm leading-relaxed">{action.meeting.agenda}</span>
                </Field>
              </div>
            )}
            {action.flag && (
              <div className="space-y-3">
                <Field label="Level">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span
                      className={`size-2 rounded-full ${
                        action.flag.level === "expansion"
                          ? "bg-success"
                          : action.flag.level === "risk"
                          ? "bg-danger"
                          : "bg-warning"
                      }`}
                    />
                    {action.flag.level}
                  </span>
                </Field>
                <Field label="Recommendation">
                  <span className="text-sm leading-relaxed">{action.flag.recommendation}</span>
                </Field>
              </div>
            )}
            {action.forecast && (
              <div className="space-y-2">
                <Field label="Quarter">{action.forecast.quarter}</Field>
                <div className="rounded-md border border-border bg-surface p-3 flex items-center gap-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase text-muted-foreground">Before</div>
                    <div className="text-base font-mono">${(action.forecast.before / 1000).toFixed(0)}k</div>
                  </div>
                  <div className="text-muted-foreground">→</div>
                  <div>
                    <div className="text-[11px] font-mono uppercase text-success">After</div>
                    <div className="text-base font-mono font-semibold">${(action.forecast.after / 1000).toFixed(0)}k</div>
                  </div>
                </div>
                <Field label="Reason">{action.forecast.reason}</Field>
              </div>
            )}
          </div>
        )}

        {stage === "sending" && (
          <div className="px-6 py-10 flex flex-col items-center gap-4">
            <Loader2 className="size-6 animate-spin text-foreground" />
            <div className="text-sm font-mono text-muted-foreground">
              {sendingCopy[action.kind][step]}
            </div>
            <div className="w-48 h-0.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-700"
                style={{ width: `${((step + 1) / sendingCopy[action.kind].length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {stage === "shipped" && (
          <div className="px-6 py-10 flex flex-col items-center gap-3">
            <div className="size-10 rounded-full bg-success/15 flex items-center justify-center">
              <Check className="size-5 text-success" />
            </div>
            <div className="text-base font-medium">Shipped.</div>
            <div className="text-sm text-muted-foreground text-center max-w-sm">
              {shippedCopy[action.kind]}
            </div>
          </div>
        )}

        {stage === "confirm" && (
          <div className="px-6 py-4 border-t border-border flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="text-sm">
              Cancel
            </Button>
            <Button
              className="ml-auto bg-foreground text-background hover:bg-foreground/90"
              onClick={() => {
                setStage("sending");
                setStep(0);
              }}
            >
              <Send className="size-3.5" />
              {verbFor[action.kind]}
            </Button>
          </div>
        )}
        {stage === "shipped" && (
          <div className="px-6 py-4 border-t border-border flex justify-end">
            <Button onClick={onClose} className="bg-foreground text-background hover:bg-foreground/90">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="text-sm">{children}</div>
    </div>
  );
}
