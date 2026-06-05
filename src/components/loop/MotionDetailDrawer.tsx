// MotionDetailDrawer — what "Open" actually opens. Shows the whole
// save play: every step previewable + editable, every cited receipt
// chip, the account context, and the one button that ships it all.

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Calendar, Database, FileText, Quote, Pencil, Send, X, Building2 } from "lucide-react";
import type { Motion, MotionStep, StepKind } from "@/lib/loop/motions";
import { ACCOUNTS, formatARR, type Receipt } from "@/lib/loop/portfolio";
import { AGENTS } from "@/lib/loop/agents";
import { relativeAgo } from "@/lib/loop/time";

const kindIcon: Record<StepKind, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  slack: MessageSquare,
  calendar: Calendar,
  crm: Database,
  doc: FileText,
};

const kindLabel: Record<StepKind, string> = {
  email: "Email",
  slack: "Slack",
  calendar: "Calendar",
  crm: "CRM update",
  doc: "Document",
};

export function MotionDetailDrawer({
  motion,
  open,
  onClose,
  onShip,
  onOverride,
  onAccount,
  onReceipt,
}: {
  motion: Motion | null;
  open: boolean;
  onClose: () => void;
  onShip: (m: Motion, edits: Record<string, Partial<MotionStep>>) => void;
  onOverride: (m: Motion) => void;
  onAccount: (id: string) => void;
  onReceipt: (accountId: string, receiptId: string) => void;
}) {
  const [edits, setEdits] = useState<Record<string, Partial<MotionStep>>>({});
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEdits({});
      setEditing(null);
    }
  }, [open, motion?.id]);

  if (!motion) return null;
  const account = ACCOUNTS.find((a) => a.id === motion.accountId);
  const agent = AGENTS.find((a) => a.id === motion.agent);

  const setBody = (stepId: string, body: string) =>
    setEdits((prev) => ({ ...prev, [stepId]: { ...prev[stepId], body } }));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {motion.kind === "save" ? "Save play" : motion.kind === "expand" ? "Expansion play" : "Renewal play"}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[10px] font-mono text-muted-foreground">{agent?.name ?? motion.agent}</span>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={() => onAccount(motion.accountId)}
              className="inline-flex items-center gap-1 text-[11px] font-medium underline decoration-foreground/20 underline-offset-2 hover:decoration-foreground"
            >
              <Building2 className="size-3" /> {account?.name}
            </button>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              prepared {relativeAgo(motion.preparedAt)}
            </span>
          </div>
          <SheetTitle className="font-display text-xl font-semibold tracking-tight leading-tight">
            {motion.headline}
          </SheetTitle>
          <p className="text-sm text-muted-foreground leading-relaxed pt-1">{motion.why}</p>

          {/* Cited evidence */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground inline-flex items-center gap-1">
              <Quote className="size-3" /> Cited
            </span>
            {motion.evidence.map((ev) => (
              <button
                key={ev.receiptId}
                onClick={() => onReceipt(ev.accountId, ev.receiptId)}
                className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                {ev.receiptId}
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* Steps */}
        <section className="px-6 py-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-3">
            The play · {motion.steps.length} steps · ships in sequence
          </div>
          <ol className="space-y-3">
            {motion.steps.map((step, i) => {
              const Icon = kindIcon[step.kind];
              const isEditing = editing === step.id;
              const body = edits[step.id]?.body ?? step.body;
              return (
                <li
                  key={step.id}
                  className="rounded-xl border border-border bg-surface overflow-hidden"
                >
                  <div className="px-4 py-3 flex items-start gap-3">
                    <div className="size-7 rounded-full bg-foreground text-background flex items-center justify-center font-mono text-[11px] font-semibold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Icon className="size-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                          {kindLabel[step.kind]}
                        </span>
                        {step.meta && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-[10px] font-mono text-muted-foreground italic">
                              {step.meta}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => setEditing(isEditing ? null : step.id)}
                          className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3" /> {isEditing ? "Done" : "Edit"}
                        </button>
                      </div>
                      <div className="text-sm font-medium leading-snug">{step.title}</div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                        → {step.to}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-3 pl-14">
                    {isEditing ? (
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(step.id, e.target.value)}
                        className="text-sm leading-relaxed min-h-[140px] font-sans"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                        {body}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Sticky footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-border bg-background/95 backdrop-blur flex items-center gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              ARR at stake
            </div>
            <div className="text-base font-display font-semibold text-success">
              +{formatARR(motion.arrImpact)}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onOverride(motion)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" /> Override
            </Button>
            <Button
              onClick={() => onShip(motion, edits)}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <Send className="size-3.5" />
              Ship the save · {motion.steps.length} steps
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
