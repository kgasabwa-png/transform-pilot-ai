// The Pit — the manager's surface. NOT coaching moments. A board of
// bottlenecks: stuck motions, overloaded CSMs, missed signals, CSMs
// whose CRM commits disagree with the conversation. Every row has a
// one-click action that visibly unblocks something.

import { useMemo, useState } from "react";
import { Clock, UserPlus, AlertTriangle, Brain, ArrowRight, Sparkles, Users } from "lucide-react";
import { buildBottlenecks, buildTeamMetrics, type Bottleneck, type BottleneckAction } from "@/lib/loop/bottlenecks";
import { ACCOUNTS, formatARR } from "@/lib/loop/portfolio";
import { relativeAgo } from "@/lib/loop/time";
import { LiveTicker } from "@/components/loop/LiveTicker";
import { AccountDrawer } from "@/components/loop/AccountDrawer";
import { useClientStamp } from "@/lib/loop/useClientStamp";
import { buildMotions } from "@/lib/loop/motions";
import type { DraftAction } from "@/lib/loop/actions";

const kindIcon = {
  "stalled-motion": Clock,
  "csm-overloaded": Users,
  "signal-missed": AlertTriangle,
  "csm-disagreement": Brain,
} as const;

const kindLabel = {
  "stalled-motion": "Stalled motion",
  "csm-overloaded": "CSM overloaded",
  "signal-missed": "Agent gap",
  "csm-disagreement": "CRM ≠ conversation",
} as const;

export function Pit() {
  const stamp = useClientStamp();
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>(() => buildBottlenecks());
  const [team, setTeam] = useState(() => buildTeamMetrics());
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null); // bottleneck id

  const open = bottlenecks.filter((b) => b !== undefined);
  const unblockedToday = useMemo(
    () => (4 - bottlenecks.length) * 280_000 + team.arrShippedToday * 0.15,
    [bottlenecks.length, team.arrShippedToday],
  );

  const handleAction = (b: Bottleneck, action: BottleneckAction) => {
    if (action.kind === "open-motion") {
      // open account drawer as a proxy
      if (b.accountId) setAccountId(b.accountId);
      return;
    }
    setActingOn(b.id);
    setTimeout(() => {
      setBottlenecks((prev) => prev.filter((x) => x.id !== b.id));
      // capacity rebalance for redistribute actions
      if (action.kind === "redistribute" || action.kind === "reassign") {
        setTeam((prev) => ({
          ...prev,
          csmCapacity: prev.csmCapacity.map((c) =>
            c.name === b.csm
              ? { ...c, load: Math.max(0, c.load - 2) }
              : c.load < c.capacity
                ? { ...c, load: c.load + 1 }
                : c,
          ),
        }));
      }
      setActingOn(null);
      setToast(action.toast);
      setTimeout(() => setToast(null), 3500);
    }, 1100);
  };

  const motionsForDrawer: DraftAction[] = useMemo(
    () =>
      buildMotions().map((m) => ({
        id: m.id,
        kind: "email" as const,
        agent: m.agent,
        accountId: m.accountId,
        preparedAt: m.preparedAt,
        arrImpact: m.arrImpact,
        oneLine: m.headline,
        why: m.why,
        evidence: m.evidence,
        status: "pending" as const,
      })),
    [],
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {stamp} · the pit · 4 CSMs · 312 accounts
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.05]">
          {open.length} bottlenecks holding back the team.{" "}
          <span className="text-muted-foreground">Unblock, don't coach.</span>
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-3">
          <LiveTicker
            label="ARR unblocked today"
            value={Math.round(unblockedToday)}
            tone="success"
            formatter={(n) => `$${Math.round(n / 1000)}k`}
          />
          <LiveTicker
            label="ARR at risk of stalling"
            value={open.reduce((s, b) => s + b.arrAtStake, 0)}
            tone="danger"
            formatter={(n) => `$${Math.round(n / 1000)}k`}
          />
          <div className="hidden sm:flex flex-col justify-end text-[11px] font-mono text-muted-foreground items-end">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3" />
              Sample team
            </span>
          </div>
        </div>
      </header>

      {/* CSM capacity bar */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Team capacity right now
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {team.csmCapacity.map((c) => {
            const pct = Math.min(100, (c.load / c.capacity) * 100);
            const over = c.load > c.capacity;
            return (
              <div key={c.name}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="size-7 rounded-full bg-foreground/5 border border-border text-[10px] font-mono font-semibold flex items-center justify-center">
                    {c.initials}
                  </div>
                  <div className="text-xs font-medium truncate">{c.name}</div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      over ? "bg-danger" : pct > 80 ? "bg-warning" : "bg-success"
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-1">
                  {c.load} / {c.capacity} motions {over && <span className="text-danger">· over</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottlenecks */}
      <section className="space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Bottlenecks · sorted by $ at stake
        </div>
        {open.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <div className="font-display text-lg font-semibold">All clear.</div>
            <p className="text-sm text-muted-foreground mt-1">
              No bottlenecks. The team is flowing.
            </p>
          </div>
        ) : (
          open
            .sort((a, b) => b.arrAtStake - a.arrAtStake)
            .map((b) => (
              <BottleneckRow
                key={b.id}
                b={b}
                acting={actingOn === b.id}
                onAction={handleAction}
                onAccount={setAccountId}
              />
            ))
        )}
      </section>

      <AccountDrawer
        accountId={accountId}
        open={accountId !== null}
        onClose={() => setAccountId(null)}
        actions={motionsForDrawer}
        onReceipt={() => {}}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 max-w-sm rounded-lg bg-foreground text-background px-4 py-3 shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <div className="text-sm">{toast}</div>
        </div>
      )}
    </div>
  );
}

function BottleneckRow({
  b,
  acting,
  onAction,
  onAccount,
}: {
  b: Bottleneck;
  acting: boolean;
  onAction: (b: Bottleneck, a: BottleneckAction) => void;
  onAccount: (id: string) => void;
}) {
  const Icon = kindIcon[b.kind];
  const account = b.accountId ? ACCOUNTS.find((a) => a.id === b.accountId) : null;

  return (
    <article
      className={`rounded-2xl border bg-surface transition-all ${
        acting
          ? "border-success bg-success/[0.04] opacity-90"
          : "border-border hover:border-foreground/25"
      }`}
    >
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="size-10 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/80">
              {kindLabel[b.kind]}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <span className="size-5 rounded-full bg-foreground/5 border border-border text-[9px] font-semibold flex items-center justify-center">
                {b.csmInitials}
              </span>
              {b.csm}
            </span>
            {account && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <button
                  onClick={() => onAccount(account.id)}
                  className="text-[11px] font-medium underline decoration-foreground/20 underline-offset-2 hover:decoration-foreground"
                >
                  {account.name}
                </button>
              </>
            )}
            <span className="ml-auto text-[11px] font-mono text-muted-foreground">
              {relativeAgo(b.detectedAt)}
            </span>
          </div>
          <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight">
            {b.headline}
          </h3>
          <p className="text-sm leading-relaxed text-foreground/70 mt-1.5">{b.detail}</p>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-mono font-semibold text-danger">
              {formatARR(b.arrAtStake)} at stake
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {b.actions.map((a, i) => {
                const primary = i === 0;
                return (
                  <button
                    key={a.id}
                    disabled={acting}
                    onClick={() => onAction(b, a)}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                      primary
                        ? "bg-foreground text-background font-semibold hover:bg-foreground/90"
                        : "border border-border text-foreground hover:bg-foreground/5"
                    } ${acting ? "opacity-60 cursor-wait" : ""}`}
                  >
                    {a.kind === "reassign" || a.kind === "redistribute" ? (
                      <UserPlus className="size-3.5" />
                    ) : null}
                    {a.label}
                    {primary && !acting && <ArrowRight className="size-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
