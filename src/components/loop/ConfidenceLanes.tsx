import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { AutonomyDial } from "./AutonomyDial";
import { ShippedLane } from "./lanes/ShippedLane";
import { QuickReviewLane } from "./lanes/QuickReviewLane";
import { JudgmentLane } from "./lanes/JudgmentLane";
import { WatchLane } from "./lanes/WatchLane";
import {
  SHIPPED,
  QUICK,
  JUDGMENT,
  SIGNALS,
  forCSM,
  CURRENT_CSM,
} from "@/lib/loop/consoleData";
import type { PersonaId } from "@/lib/loop/personas";
import { useClientStamp } from "@/lib/loop/useClientStamp";

export function ConfidenceLanes({ persona = "csm" as PersonaId }: { persona?: PersonaId } = {}) {
  const stamp = useClientStamp();

  const data = useMemo(() => {
    if (persona === "csm") {
      return {
        shipped: forCSM(SHIPPED),
        quick: forCSM(QUICK),
        judgment: forCSM(JUDGMENT),
        signals: forCSM(SIGNALS),
      };
    }
    return { shipped: SHIPPED, quick: QUICK, judgment: JUDGMENT, signals: SIGNALS };
  }, [persona]);

  const header = HEADERS[persona];
  const arrAtStake =
    [...data.quick, ...data.judgment].reduce(
      (s, a) => s + (a.arrAtStake ?? 0),
      0,
    ) +
    data.signals.reduce((s, w) => s + (w.arrAtStake ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Top strip */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            {stamp} · {header.eyebrow(persona === "csm" ? CURRENT_CSM : undefined)}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] mt-2">
            {header.title(data.shipped.length, data.quick.length, data.judgment.length)}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            {header.sub}
          </p>
        </div>
        <PersonaToggle value={persona} onChange={setPersona} />
      </div>

      {/* Autonomy + stake summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <AutonomyDial autoRate={87} reverts={2} trend="+7 pts vs last week" />
        {arrAtStake > 0 && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-mono text-muted-foreground">
            <span className="size-1.5 rounded-full bg-rose-500" />
            <span className="tabular-nums">
              ${(arrAtStake / 1000).toFixed(0)}k ARR
            </span>
            <span>at stake in queue</span>
          </div>
        )}
        <span className="text-[11px] font-mono text-muted-foreground ml-auto inline-flex items-center gap-1.5">
          <Sparkles className="size-3" />
          Sample book · numbers illustrative
        </span>
      </div>

      {/* Manager strip */}
      {persona === "manager" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-border bg-surface p-4">
          <Stat label="CSMs on team" value="4" />
          <Stat label="Saves shipped this wk" value="12" />
          <Stat label="Bar-drift flags" value="1" tone="warn" />
          <Stat label="Escalations open" value="2" tone="warn" />
        </div>
      )}

      {/* Leader strip */}
      {persona === "leader" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-border bg-surface p-4">
          <Stat label="ARR protected (90d)" value="$580k" tone="ok" />
          <Stat label="Auto-ship rate" value="87%" tone="ok" />
          <Stat label="Median early-catch" value="73 days" />
          <Stat label="Reverts (qtr)" value="0 / 312" />
        </div>
      )}

      {/* Lanes */}
      <div className="grid gap-4">
        <ShippedLane items={data.shipped} />
        <QuickReviewLane items={data.quick} />
        <JudgmentLane items={data.judgment} />
        <WatchLane signals={data.signals} />
      </div>

      <footer className="text-[11px] font-mono text-muted-foreground text-center pt-4">
        Every action pinned to the line it came from · 30-day revert on every row
      </footer>
    </div>
  );
}

const HEADERS: Record<
  PersonaId,
  {
    eyebrow: (who?: string) => string;
    title: (shipped: number, quick: number, judgment: number) => string;
    sub: string;
  }
> = {
  csm: {
    eyebrow: (who) => `${who ?? "your book"} · the console`,
    title: (shipped, quick, judgment) =>
      `${shipped} shipped overnight. ${quick + judgment} waiting on you.`,
    sub: "The agent worked your book while you slept. Internal stuff is done — revert anything that's off. Customer-facing and money calls are queued for you.",
  },
  manager: {
    eyebrow: () => "team rollup · 4 CSMs · 312 accounts",
    title: (_s, q, j) =>
      `${q + j} judgment calls across the team. 1 bar-drift flag.`,
    sub: "Where your CSMs are over- or under-correcting the agent. Coaching opportunities surface as bar-drift flags — when a CSM reverts the agent more than 2× standard deviation from the team.",
  },
  leader: {
    eyebrow: () => "the number · cited",
    title: () => "$580k ARR protected on a $4.2M book.",
    sub: "Auto-ship rate climbing 7 pts week-over-week as the agent learns the team's bar. Zero customer-facing actions sent without human approval. Every line citable to the call.",
  },
};

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn";
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-xl font-display font-semibold tracking-tight tabular-nums mt-0.5 ${
          tone === "ok" ? "text-success" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
