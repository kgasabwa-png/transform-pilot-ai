// The Tape — the VP/CCO's surface. A single living NRR number with the
// changelog of every dollar moved this quarter, agent-attributed and
// quote-cited. The "what the CFO will ask" panel pre-answers the
// three audit questions. Concierge backtest CTA at the bottom.

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { buildForecastDeltas, summarizeForecast, type ForecastDelta } from "@/lib/loop/forecast";
import { ACCOUNTS, formatARR, type Receipt } from "@/lib/loop/portfolio";
import { AGENTS } from "@/lib/loop/agents";
import { relativeAgo } from "@/lib/loop/time";
import { AccountDrawer } from "@/components/loop/AccountDrawer";
import { ReceiptModal } from "@/components/loop/ReceiptModal";
import { LiveTicker } from "@/components/loop/LiveTicker";
import { useClientStamp } from "@/lib/loop/useClientStamp";
import { buildMotions } from "@/lib/loop/motions";
import type { DraftAction } from "@/lib/loop/actions";

export function Tape() {
  const stamp = useClientStamp();
  const [blindOnly, setBlindOnly] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const deltas = useMemo(() => buildForecastDeltas(), []);
  const summary = useMemo(() => summarizeForecast(deltas), [deltas]);
  const visible = blindOnly ? deltas.filter((d) => !d.csmAware) : deltas;

  // NRR computed from forecast total / baseline.
  const baseline = 4_820_000;
  const nrr = (summary.total / baseline) * 100;

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

  const handleReceipt = (accId: string, receiptId: string) => {
    const acc = ACCOUNTS.find((a) => a.id === accId);
    const r = acc?.receipts.find((x) => x.id === receiptId);
    if (r) setReceipt(r);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {stamp} · the tape · {summary.quarter} forecast · every dollar cited
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.05]">
          {summary.quarter}:{" "}
          <span className="tabular-nums">${(summary.total / 1_000_000).toFixed(2)}M</span>
          <span className="text-muted-foreground text-2xl font-normal">
            {" "}±${(summary.uncertainty / 1000).toFixed(0)}k
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Rebuilt nightly from what your customers actually said. Every change in this number is
          attributable to an agent and a cited moment. Drill from a delta → the account → the quote.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-3">
          <LiveTicker
            label="NRR projected"
            value={nrr}
            tone={nrr >= 100 ? "success" : "danger"}
            formatter={(n) => `${n.toFixed(1)}%`}
          />
          <LiveTicker
            label="Net change this week"
            value={summary.weekDelta}
            tone={summary.weekDelta >= 0 ? "success" : "danger"}
            formatter={(n) => `${n >= 0 ? "+" : "−"}$${Math.round(Math.abs(n) / 1000)}k`}
          />
          <LiveTicker
            label="Deltas this week"
            value={summary.deltasThisWeek}
            formatter={(n) => `${Math.round(n)}`}
          />
          <div className="hidden sm:flex flex-col justify-end text-[11px] font-mono text-muted-foreground items-end">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3" /> Sample book
            </span>
          </div>
        </div>
      </header>

      {/* What the CFO will ask */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-3 inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3" /> What the CFO will ask
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <CfoAnswer
            q="How do you know?"
            a={`${summary.deltasThisWeek} forecast changes this week, each one tied to a specific call, Slack, or email moment. Click any delta below to see the source.`}
          />
          <CfoAnswer
            q="Who said it?"
            a="Every delta names the speaker, the role, and the timestamp. No 'the customer thinks' — only direct quotes."
          />
          <CfoAnswer
            q="When was the last update?"
            a="The most recent change landed six hours ago. The forecast refreshes nightly at 3:00a from the prior 24h of conversation."
          />
        </div>
      </section>

      {/* Changelog toggle */}
      <div className="flex items-center gap-3 border-y border-border py-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Changelog · this week
        </span>
        <button
          onClick={() => setBlindOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-xs ml-auto px-3 py-1.5 rounded-md border transition-colors ${
            blindOnly
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:border-foreground/40"
          }`}
        >
          {blindOnly ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {blindOnly ? "Showing CSM blind spots only" : "Show only what your CSMs haven't seen"}
        </button>
      </div>

      {/* Changelog */}
      <section className="space-y-2">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Every change this week has been acknowledged by the owning CSM.
          </div>
        ) : (
          visible.map((d) => <DeltaRow key={d.id} delta={d} onAccount={setAccountId} />)
        )}
      </section>

      {/* Concierge backtest */}
      <section className="rounded-2xl border border-foreground/20 bg-foreground/[0.025] p-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Before you commit to {summary.quarter}
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Run a concierge backtest on your last 15 closed renewals.
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
          Send us 5–15 anonymized closed renewals. In 72 hours we'll show you exactly which churns
          we'd have caught — with the cited moment for each. Free, white-glove, no integration.
        </p>
        <Link
          to="/waitlist"
          className="inline-flex items-center gap-1 mt-4 text-sm font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
        >
          Start the backtest <ChevronRight className="size-3.5" />
        </Link>
      </section>

      <AccountDrawer
        accountId={accountId}
        open={accountId !== null}
        onClose={() => setAccountId(null)}
        actions={motionsForDrawer}
        onReceipt={setReceipt}
      />
      <ReceiptModal
        receipt={receipt}
        open={receipt !== null}
        onClose={() => setReceipt(null)}
      />
    </div>
  );
}

function CfoAnswer({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="font-display text-sm font-semibold tracking-tight">{q}</div>
      <p className="text-[13px] text-muted-foreground leading-relaxed mt-1.5">{a}</p>
    </div>
  );
}

function DeltaRow({
  delta,
  onAccount,
}: {
  delta: ForecastDelta;
  onAccount: (id: string) => void;
}) {
  const positive = delta.delta > 0;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;
  const agent = AGENTS.find((a) => a.id === delta.agent);
  const account = ACCOUNTS.find((a) => a.id === delta.accountId);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 flex items-start gap-4 hover:border-foreground/30 transition-colors">
      <div
        className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
          positive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        }`}
      >
        <Arrow className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <button
            onClick={() => onAccount(delta.accountId)}
            className="text-sm font-display font-semibold underline decoration-foreground/20 hover:decoration-foreground underline-offset-2"
          >
            {account?.name ?? delta.accountName}
          </button>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-[11px] font-mono text-muted-foreground">{agent?.name ?? delta.agent}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-[11px] font-mono text-muted-foreground">{relativeAgo(delta.at)}</span>
          {!delta.csmAware && (
            <span className="ml-auto text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning/15 text-warning">
              CSM hasn't seen
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-foreground/85">{delta.reason}</p>
        <div className="mt-2 flex items-center gap-3 text-[12px] font-mono">
          <span className="text-muted-foreground line-through">${(delta.before / 1000).toFixed(0)}k</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-semibold">${(delta.after / 1000).toFixed(0)}k</span>
          <span
            className={`ml-auto text-sm font-semibold ${
              positive ? "text-success" : "text-danger"
            }`}
          >
            {positive ? "+" : "−"}${(Math.abs(delta.delta) / 1000).toFixed(0)}k
          </span>
        </div>
      </div>
    </div>
  );
}
