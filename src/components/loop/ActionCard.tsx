// Universal "draft action" card. Used by ApprovalQueue and (compact)
// elsewhere. Every CTA does something: open the send modal, open the
// override dialog, or open the account drawer.

import { Mail, Database, Calendar, Flag, TrendingUp, ChevronRight, Quote, X } from "lucide-react";
import type { DraftAction, ActionStatus } from "@/lib/loop/actions";
import { ACCOUNTS, formatARR } from "@/lib/loop/portfolio";
import { relativeAgo } from "@/lib/loop/time";
import { AGENTS } from "@/lib/loop/agents";

const iconFor = {
  email: Mail,
  "crm-update": Database,
  meeting: Calendar,
  flag: Flag,
  "forecast-move": TrendingUp,
} as const;

const kindLabel = {
  email: "Draft email",
  "crm-update": "CRM change",
  meeting: "Meeting invite",
  flag: "Account flag",
  "forecast-move": "Forecast move",
} as const;

const primaryCta = {
  email: "Review & send",
  "crm-update": "Review & update",
  meeting: "Confirm slot",
  flag: "Raise flag",
  "forecast-move": "Commit move",
} as const;

const statusBadge: Record<ActionStatus, { label: string; cls: string } | null> = {
  pending: null,
  approved: { label: "approved", cls: "bg-success/15 text-success" },
  shipped: { label: "shipped", cls: "bg-success/15 text-success" },
  edited: { label: "edited", cls: "bg-primary/15 text-primary" },
  overridden: { label: "overridden", cls: "bg-warning/15 text-warning" },
  skipped: { label: "skipped", cls: "bg-muted text-muted-foreground" },
};

export function ActionCard({
  action,
  onPrimary,
  onOverride,
  onAccount,
  onReceipt,
}: {
  action: DraftAction;
  onPrimary: (a: DraftAction) => void;
  onOverride: (a: DraftAction) => void;
  onAccount: (accountId: string) => void;
  onReceipt: (accountId: string, receiptId: string) => void;
}) {
  const account = ACCOUNTS.find((a) => a.id === action.accountId);
  const agent = AGENTS.find((a) => a.id === action.agent);
  const Icon = iconFor[action.kind];
  const badge = statusBadge[action.status];
  const negative = action.arrImpact < 0;
  const dead = action.status !== "pending";

  return (
    <article
      className={`rounded-xl border bg-surface transition-shadow ${
        dead ? "border-border opacity-70" : "border-border hover:shadow-md hover:border-foreground/20"
      }`}
    >
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-start gap-3">
        <div className="size-9 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              {kindLabel[action.kind]}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {agent?.name ?? action.agent}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={() => onAccount(action.accountId)}
              className="text-[11px] font-medium underline decoration-foreground/20 hover:decoration-foreground underline-offset-2"
            >
              {account?.name ?? action.accountId}
            </button>
            <span className="ml-auto text-[11px] font-mono text-muted-foreground">
              prepared {relativeAgo(action.preparedAt)}
            </span>
          </div>
          <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight">
            {action.oneLine}
          </h3>
        </div>
      </header>

      {/* Why */}
      <div className="px-5 pb-3">
        <p className="text-sm leading-relaxed text-foreground/80">{action.why}</p>
      </div>

      {/* Evidence chips */}
      {action.evidence.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1">
            <Quote className="size-3" /> Cited
          </span>
          {action.evidence.map((ev, i) => (
            <button
              key={i}
              onClick={() => onReceipt(ev.accountId, ev.receiptId)}
              className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              {ev.receiptId}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="px-5 py-3 border-t border-border flex items-center gap-3 bg-foreground/[0.015]">
        <span
          className={`text-sm font-mono font-semibold ${
            negative ? "text-danger" : action.arrImpact > 0 ? "text-success" : "text-muted-foreground"
          }`}
        >
          {action.arrImpact > 0 ? "+" : action.arrImpact < 0 ? "−" : ""}
          {formatARR(Math.abs(action.arrImpact))} ARR at stake
        </span>
        {badge && (
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {action.status === "pending" && (
            <>
              <button
                onClick={() => onOverride(action)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-foreground/5 transition-colors"
              >
                <X className="size-3.5" />
                Reject
              </button>
              <button
                onClick={() => onPrimary(action)}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-md hover:bg-foreground/90 transition-colors"
              >
                {primaryCta[action.kind]}
                <ChevronRight className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </footer>
    </article>
  );
}
