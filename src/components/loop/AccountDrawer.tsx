// Account drawer — opens when the user clicks an account name anywhere.
// Shows: a header with the account state, the timeline of agent actions
// on the account, and the receipts that justify them. Every receipt
// chip opens the ReceiptModal.

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ACCOUNTS, formatARR, type Receipt } from "@/lib/loop/portfolio";
import { Mail, Database, Calendar, Flag, TrendingUp, Phone, MessageSquare, ExternalLink } from "lucide-react";
import type { DraftAction } from "@/lib/loop/actions";
import { relativeAgo } from "@/lib/loop/time";

const channelIcon = { call: Phone, slack: MessageSquare, email: Mail } as const;
const actionIcon = {
  email: Mail,
  "crm-update": Database,
  meeting: Calendar,
  flag: Flag,
  "forecast-move": TrendingUp,
} as const;

export function AccountDrawer({
  accountId,
  open,
  onClose,
  actions,
  onReceipt,
}: {
  accountId: string | null;
  open: boolean;
  onClose: () => void;
  actions: DraftAction[];
  onReceipt: (r: Receipt) => void;
}) {
  const account = accountId ? ACCOUNTS.find((a) => a.id === accountId) : null;
  if (!account) return null;

  const accountActions = actions.filter((a) => a.accountId === account.id);
  const gap = account.vendorScore.value - account.receiptsScore.value;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              {account.segment} · {formatARR(account.arr)} ARR · {account.renewalDays}d to renewal
            </span>
          </div>
          <SheetTitle className="font-display text-xl font-semibold tracking-tight">
            {account.name}
          </SheetTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">{account.headline}</p>

          {/* Score gap */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <ScoreTile
              label="Their CS platform"
              value={account.vendorScore.value}
              tag={account.vendorScore.label}
              tone="muted"
            />
            <ScoreTile
              label="Receipts (from raw evidence)"
              value={account.receiptsScore.value}
              tag={account.receiptsScore.label}
              tone="primary"
            />
          </div>
          {Math.abs(gap) >= 20 && (
            <div className={`text-[12px] font-mono ${gap > 0 ? "text-danger" : "text-success"}`}>
              {gap > 0 ? "Overstated by " : "Understated by "}
              {Math.abs(gap)} points · {Math.abs(gap) >= 30 ? "high-confidence surprise" : "surprise"}
            </div>
          )}
        </SheetHeader>

        {/* Agent actions timeline */}
        <section className="px-6 py-5">
          <SectionTitle>Agent actions on this account</SectionTitle>
          {accountActions.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">
              No staged actions yet. Agents are still watching.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {accountActions.map((a) => {
                const Icon = actionIcon[a.kind];
                return (
                  <li key={a.id} className="flex gap-3">
                    <div className="size-7 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
                      <Icon className="size-3.5 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {a.agent} · {relativeAgo(a.preparedAt)} ·{" "}
                        <span
                          className={
                            a.status === "shipped"
                              ? "text-success"
                              : a.status === "pending"
                              ? "text-warning"
                              : ""
                          }
                        >
                          {a.status}
                        </span>
                      </div>
                      <div className="text-sm leading-snug mt-0.5">{a.oneLine}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Receipts */}
        <section className="px-6 py-5 border-t border-border">
          <SectionTitle>Evidence · what the customer actually said</SectionTitle>
          <ul className="mt-3 space-y-2">
            {account.receipts.map((r) => {
              const Icon = channelIcon[r.channel];
              const neg = r.weight < 0;
              const pos = r.weight > 0;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => onReceipt(r)}
                    className="w-full text-left rounded-lg border border-border bg-surface hover:border-foreground/30 hover:bg-foreground/[0.02] p-3 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="size-3 text-muted-foreground" />
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        {r.source}
                      </span>
                      <span
                        className={`ml-auto text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          neg ? "bg-danger/10 text-danger" : pos ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.signal.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">"{r.quote}"</p>
                    {r.speaker && (
                      <div className="text-[11px] text-muted-foreground mt-1">— {r.speaker}</div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="px-6 py-5 border-t border-border">
          <SectionTitle>Recommended next play</SectionTitle>
          <p className="text-sm leading-relaxed mt-2">{account.nextPlay}</p>
        </section>
      </SheetContent>
    </Sheet>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </h4>
  );
}

function ScoreTile({
  label,
  value,
  tag,
  tone,
}: {
  label: string;
  value: number;
  tag: string;
  tone: "muted" | "primary";
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        tone === "primary" ? "border-foreground/30 bg-foreground/[0.025]" : "border-border bg-surface"
      }`}
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-display font-semibold">{value}</span>
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
            tag === "Red"
              ? "bg-danger/15 text-danger"
              : tag === "Yellow"
              ? "bg-warning/15 text-warning"
              : "bg-success/15 text-success"
          }`}
        >
          {tag}
        </span>
      </div>
    </div>
  );
}
