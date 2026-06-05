// Forecast Floor — the VP surface. One living number, plus a changelog
// of every dollar that moved this week and which agent moved it. The
// "blind spots" toggle highlights deltas the CSM hasn't seen yet —
// that gap is where the VP gets surprised at QBR.

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Eye, EyeOff, Sparkles, ChevronRight } from "lucide-react";
import { buildForecastDeltas, summarizeForecast, type ForecastDelta } from "@/lib/loop/forecast";
import { ACCOUNTS, formatARR } from "@/lib/loop/portfolio";
import { AGENTS } from "@/lib/loop/agents";
import { relativeAgo, shortStamp } from "@/lib/loop/time";
import { AccountDrawer } from "@/components/loop/AccountDrawer";
import { buildActions } from "@/lib/loop/actions";
import { Link } from "@tanstack/react-router";

export function ForecastFloor() {
  const [blindOnly, setBlindOnly] = useState(false);
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);
  const deltas = useMemo(() => buildForecastDeltas(), []);
  const summary = useMemo(() => summarizeForecast(deltas), [deltas]);
  const visible = blindOnly ? deltas.filter((d) => !d.csmAware) : deltas;
  const actions = buildActions();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <header className="space-y-3">
        <div className="text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          {shortStamp()} · {summary.quarter} forecast · cited
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
          {summary.quarter}:{" "}
          <span className="tabular-nums">${(summary.total / 1_000_000).toFixed(2)}M</span>
          <span className="text-muted-foreground text-2xl font-normal">
            {" ± "}${(summary.uncertainty / 1000).toFixed(0)}k
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Every dollar in this number is rebuilt from what your customers actually said this week — and every change is
          attributable to an agent and a cited moment. Drill from a delta to the account to the receipt.
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm">
          <Stat
            label="Net change this week"
            value={`${summary.weekDelta >= 0 ? "+" : "−"}$${(Math.abs(summary.weekDelta) / 1000).toFixed(0)}k`}
            tone={summary.weekDelta < 0 ? "danger" : "success"}
          />
          <Stat label="Deltas this week" value={`${summary.deltasThisWeek}`} />
          <Stat
            label="CSM blind spots"
            value={`${summary.csmBlindCount} · ${formatARR(summary.csmBlindARR)}`}
            tone="warning"
          />
          <span className="text-[11px] font-mono text-muted-foreground ml-auto">
            <Sparkles className="size-3 inline -translate-y-0.5 mr-1" />
            Sample book · numbers illustrative
          </span>
        </div>
      </header>

      {/* Toggle */}
      <div className="flex items-center gap-3 border-y border-border py-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          Changelog
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
          {blindOnly ? "Showing CSM blind spots" : "Show only what your CSMs haven't seen"}
        </button>
      </div>

      {/* Changelog */}
      <section className="space-y-2">
        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Every change this week has been acknowledged by the owning CSM.
          </div>
        ) : (
          visible.map((d) => (
            <DeltaRow key={d.id} delta={d} onAccount={setOpenAccountId} />
          ))
        )}
      </section>

      {/* Concierge backtest */}
      <section className="rounded-2xl border border-foreground/15 bg-foreground/[0.025] p-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
          Before you commit to {summary.quarter}
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Run a concierge backtest on your last 15 closed renewals.
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
          Send us 5–15 anonymized closed renewals. In 72 hours we'll show you exactly which of your churns we'd have
          caught — with the cited moment for each. Free, white-glove, no integration.
        </p>
        <Link
          to="/waitlist"
          className="inline-flex items-center gap-1 mt-4 text-sm font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
        >
          Start the backtest <ChevronRight className="size-3.5" />
        </Link>
      </section>

      <AccountDrawer
        accountId={openAccountId}
        open={openAccountId !== null}
        onClose={() => setOpenAccountId(null)}
        actions={actions}
        onReceipt={() => {}}
      />
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

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const toneCls =
    tone === "success"
      ? "text-success"
      : tone === "danger"
      ? "text-danger"
      : tone === "warning"
      ? "text-warning"
      : "";
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className={`text-xl font-display font-semibold tracking-tight tabular-nums ${toneCls}`}>
        {value}
      </div>
    </div>
  );
}
