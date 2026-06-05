// MotionCard — the new hero unit in the Save Room. A single card =
// a whole save play. One [Ship the save] button. Step preview inline
// so the human can see what's about to fly out without opening.

import { Mail, MessageSquare, Calendar, Database, FileText, Quote, Building2, ChevronRight, X, Send } from "lucide-react";
import type { Motion, StepKind } from "@/lib/loop/motions";
import { ACCOUNTS, formatARR } from "@/lib/loop/portfolio";
import { AGENTS } from "@/lib/loop/agents";
import { relativeAgo } from "@/lib/loop/time";

const kindIcon: Record<StepKind, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  slack: MessageSquare,
  calendar: Calendar,
  crm: Database,
  doc: FileText,
};

const kindTone: Record<Motion["kind"], { dot: string; label: string }> = {
  save: { dot: "bg-danger", label: "save" },
  expand: { dot: "bg-success", label: "expand" },
  renew: { dot: "bg-primary", label: "renew" },
};

export function MotionCard({
  motion,
  onShip,
  onOpen,
  onOverride,
  onAccount,
  onReceipt,
}: {
  motion: Motion;
  onShip: (m: Motion) => void;
  onOpen: (m: Motion) => void;
  onOverride: (m: Motion) => void;
  onAccount: (id: string) => void;
  onReceipt: (accountId: string, receiptId: string) => void;
}) {
  const account = ACCOUNTS.find((a) => a.id === motion.accountId);
  const agent = AGENTS.find((a) => a.id === motion.agent);
  const tone = kindTone[motion.kind];

  return (
    <article className="rounded-2xl border border-border bg-surface hover:border-foreground/25 hover:shadow-[0_2px_24px_-12px_rgba(0,0,0,0.18)] transition-all">
      {/* Header */}
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/80">
            <span className={`size-1.5 rounded-full ${tone.dot}`} />
            {tone.label} play
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-[11px] font-mono text-muted-foreground">{agent?.name ?? motion.agent}</span>
          <span className="text-muted-foreground/40">·</span>
          <button
            onClick={() => onAccount(motion.accountId)}
            className="inline-flex items-center gap-1 text-[11px] font-medium underline decoration-foreground/20 underline-offset-2 hover:decoration-foreground"
          >
            <Building2 className="size-3" /> {account?.name}
          </button>
          <span className="ml-auto text-[11px] font-mono text-muted-foreground">
            prepared {relativeAgo(motion.preparedAt)}
          </span>
        </div>
        <h3 className="font-display text-[17px] sm:text-lg font-semibold leading-snug tracking-tight">
          {motion.headline}
        </h3>
      </header>

      {/* Why */}
      <div className="px-5 pb-3">
        <p className="text-sm leading-relaxed text-foreground/75 line-clamp-3">
          {motion.why}
        </p>
      </div>

      {/* Step strip — visible without opening */}
      <ol className="px-5 pb-3 flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {motion.steps.map((s, i) => {
          const Icon = kindIcon[s.kind];
          return (
            <li key={s.id} className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-foreground/[0.04] border border-border text-[11px] text-foreground/80">
                <Icon className="size-3" />
                <span className="font-mono">{s.kind}</span>
              </span>
              {i < motion.steps.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground/50" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Evidence */}
      <div className="px-5 pb-4 flex flex-wrap items-center gap-2">
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

      {/* Footer */}
      <footer className="px-5 py-3 border-t border-border flex items-center gap-3 bg-foreground/[0.015]">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            ARR pulled back if shipped
          </div>
          <div className="text-base font-display font-semibold text-success tabular-nums">
            +{formatARR(motion.arrImpact)}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onOverride(motion)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-2 rounded-md hover:bg-foreground/5 transition-colors"
          >
            <X className="size-3.5" /> Override
          </button>
          <button
            onClick={() => onOpen(motion)}
            className="inline-flex items-center gap-1 text-xs text-foreground hover:bg-foreground/5 border border-border px-3 py-2 rounded-md transition-colors"
          >
            Open
          </button>
          <button
            onClick={() => onShip(motion)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-foreground text-background px-3.5 py-2 rounded-md hover:bg-foreground/90 transition-colors"
          >
            <Send className="size-3.5" />
            Ship the save
          </button>
        </div>
      </footer>
    </article>
  );
}
