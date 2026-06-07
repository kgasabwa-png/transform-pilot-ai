import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  AUTO_SHIP_TREND,
  OUTCOMES,
  CUSTOMER_TRUST,
  TEAM_PULSE,
} from "@/lib/loop/teamData";
import { useAuditFeed } from "@/lib/loop/ledgerStore";
import { useClientStamp } from "@/lib/loop/useClientStamp";
import { WorkflowSteps } from "../WorkflowSteps";
import { OutcomeDrilldown } from "../OutcomeDrilldown";

const BLAST_COLOR = {
  internal: "bg-muted text-muted-foreground",
  "customer-facing": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  money: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
} as const;

const STATUS_COLOR = {
  shipped: "text-success",
  "co-signed": "text-amber-600 dark:text-amber-400",
  reverted: "text-rose-600 dark:text-rose-400",
  declined: "text-muted-foreground",
} as const;

export function LeaderSurface() {
  const stamp = useClientStamp();
  const auditFeed = useAuditFeed();
  const [activeOutcome, setActiveOutcome] = useState<string | null>(null);

  const totalShipped = OUTCOMES.reduce((s, o) => s + o.shipped, 0);
  const totalArr = OUTCOMES.reduce((s, o) => s + o.arrTouched, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header — forecast vs agent delta */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          {stamp} · forecast vs agent · cited
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] mt-2">
          ${(totalArr / 1000).toFixed(0)}k ARR protected. $640k humans missed, I caught.
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          The delta between what the CRM said and what the conversation said this quarter. {totalShipped.toLocaleString()} closed line items across {OUTCOMES.length} outcome types — every claim pinned to the call, system event, or world signal that produced it.
        </p>
      </div>



      {/* Trend hero */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="p-5 border-b md:border-b-0 md:border-r border-border">

            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              Auto-ship rate (8 wks)
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tabular-nums">
                {AUTO_SHIP_TREND.at(-1)}%
              </span>
              <span className="text-[11px] font-mono text-success inline-flex items-center gap-1">
                <TrendingUp className="size-3" />+{AUTO_SHIP_TREND.at(-1)! - AUTO_SHIP_TREND[0]} pts
              </span>
            </div>
            <Sparkline values={AUTO_SHIP_TREND} className="mt-3 h-12 w-full" />
            <p className="text-[11px] text-muted-foreground mt-2">
              The agent gets more autonomous as it learns the team's bar. Every revert is a calibration signal.
            </p>
          </div>
          <div className="p-5 border-b md:border-b-0 md:border-r border-border">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              Capacity returned (wk)
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tabular-nums">
                {TEAM_PULSE.hoursReturned}h
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">across {4} CSMs</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Equivalent to ~1.2 FTEs. Time the team spent on saves and expansion conversations instead of
              CRM hygiene.
            </p>
          </div>
          <div className="p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              Reverts this quarter
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tabular-nums">
                {CUSTOMER_TRUST.reverts}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                of {CUSTOMER_TRUST.revertsTotal.toLocaleString()} reviewed
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Every action has a 30-day revert window. The receipt is the contract — pull it back if it's off.
            </p>
          </div>
        </div>
      </section>

      {/* Outcome bento */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">Outcomes ledger</h2>
          <span className="text-[11px] font-mono text-muted-foreground">
            click to drill into the citations behind any number
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {OUTCOMES.map((o) => {
            const active = activeOutcome === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setActiveOutcome(active ? null : o.id)}
                className={`text-left rounded-2xl border bg-surface p-4 transition-colors ${
                  active ? "border-primary" : "border-border hover:border-foreground/30"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-base font-semibold">{o.label}</div>
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      o.trend >= 0 ? "text-success" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {o.trend >= 0 ? "+" : ""}
                    {o.trend}%
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1">{o.blurb}</p>
                <div className="flex items-end gap-4 mt-3">
                  <div>
                    <div className="font-display text-2xl font-semibold tabular-nums">
                      {o.shipped}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                      shipped
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold tabular-nums text-muted-foreground">
                      {o.pending}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                      pending
                    </div>
                  </div>
                  {o.arrTouched > 0 && (
                    <div className="ml-auto text-right">
                      <div className="font-display text-sm font-semibold tabular-nums">
                        ${(o.arrTouched / 1000).toFixed(0)}k
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                        ARR touched
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Customer-trust panel */}
      <section className="rounded-2xl border border-border bg-foreground text-background p-5">
        <div className="flex items-start gap-3">
          <Shield className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] opacity-60">
              Customer trust · the contract
            </div>
            <h3 className="font-display text-xl font-semibold mt-1 leading-tight">
              Zero customer-facing actions sent without a human signing off.
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <Pillar
                value={CUSTOMER_TRUST.customerFacingSent.toLocaleString()}
                label="Customer-facing sent"
                sub={`${CUSTOMER_TRUST.customerFacingReviewed.toLocaleString()} reviewed`}
              />
              <Pillar
                value={CUSTOMER_TRUST.customerFacingAutoSent.toString()}
                label="Auto-sent to customer"
                sub="ever"
              />
              <Pillar
                value={CUSTOMER_TRUST.moneyActionsCoSigned.toString()}
                label="Money actions co-signed"
                sub={`${CUSTOMER_TRUST.moneyActionsAutoSent} auto-shipped`}
              />
              <Pillar
                value={`${CUSTOMER_TRUST.reverts}/${CUSTOMER_TRUST.revertsTotal}`}
                label="Reverted"
                sub="agent-customer trust intact"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Audit log */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <header className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold tracking-tight">Live audit log</h2>
          <span className="text-[11px] font-mono text-muted-foreground ml-auto">
            last 6 across the org · every row pinned to a citation
          </span>
        </header>
        <ul className="divide-y divide-border">
          {auditFeed.map((e) => (
            <li
              key={e.id}
              className="px-5 py-3 flex flex-wrap sm:grid sm:grid-cols-[auto_auto_1fr_auto] gap-x-3 gap-y-1 items-baseline"
            >
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-12 shrink-0">
                {e.at}
              </span>
              <span
                className={`text-[9px] font-mono uppercase tracking-[0.14em] px-1.5 py-0.5 rounded shrink-0 ${BLAST_COLOR[e.blast]}`}
              >
                {e.blast.replace("-", " ")}
              </span>
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.14em] tabular-nums sm:order-last ml-auto sm:ml-0 shrink-0 ${STATUS_COLOR[e.status]}`}
              >
                {e.status === "shipped" && <CheckCircle2 className="inline size-3 mr-1" />}
                {e.status}
              </span>
              <div className="basis-full sm:basis-auto min-w-0">
                <div className="text-sm leading-snug">{e.action}</div>
                <div className="text-[11px] font-mono text-muted-foreground truncate">
                  {e.account} · {e.who} ·{" "}
                  <span className="inline-flex items-center gap-1">
                    <ExternalLink className="size-3" />
                    {e.citation}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <footer className="px-5 py-2 border-t border-border text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="size-3" />
          SOC 2 Type II · data residency US/EU · every row exportable
        </footer>
      </section>

      <OutcomeDrilldown
        outcomeId={activeOutcome}
        onClose={() => setActiveOutcome(null)}
      />
    </div>
  );
}

function Pillar({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold tabular-nums leading-tight">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-70 mt-0.5">
        {label}
      </div>
      <div className="text-[10px] font-mono opacity-50 mt-0.5">{sub}</div>
    </div>
  );
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 24;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const path = `M${points.join(" L")}`;
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <path d={area} fill="currentColor" className="text-success/10" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-success" />
      {points.map((p, i) => {
        const [x, y] = p.split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r="1" fill="currentColor" className="text-success" />;
      })}
    </svg>
  );
}
