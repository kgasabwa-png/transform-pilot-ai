import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  TEAM,
  TEAM_PULSE,
  COACHING,
  COSIGN_QUEUE,
  TEAM_SIGNALS,
} from "@/lib/loop/teamData";
import { AutonomyDial } from "../AutonomyDial";
import { WorkflowSteps } from "../WorkflowSteps";
import { useClientStamp } from "@/lib/loop/useClientStamp";

export function ManagerSurface() {
  const stamp = useClientStamp();
  const [cosigned, setCosigned] = useState<Record<string, boolean>>({});
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  const openCosign = COSIGN_QUEUE.filter((a) => !cosigned[a.id]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            {stamp} · team rollup · {TEAM.length} CSMs · {TEAM.reduce((s, m) => s + m.book, 0)} accounts
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] mt-2">
            {openCosign.length} co-signs waiting. {TEAM_PULSE.barDriftFlags} bar-drift flag.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Where your CSMs over- or under-correct the agent. Coaching opportunities surface
            as bar-drift flags — when reverts exceed 2σ from team norm.
          </p>
        </div>
      </div>

      <WorkflowSteps
        title="Your workflow today"
        steps={[
          {
            label: "Scan the team",
            detail: "Watch for bar-drift flags — CSMs over- or under-correcting the agent.",
          },
          {
            label: "Clear co-signs",
            detail: "Approve or decline money actions over $25k routed up from your CSMs.",
          },
          {
            label: "Coach at 1:1",
            detail: "Mark coaching moments. They land in your next 1:1 with that CSM.",
          },
        ]}
      />


      {/* Pulse strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <AutonomyDial
          autoRate={TEAM_PULSE.teamAutoShipRate}
          reverts={TEAM_PULSE.revertsThisWeek}
          trend={`${TEAM_PULSE.hoursReturned}h returned to team`}
        />
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-mono text-muted-foreground">
          <CheckCircle2 className="size-3 text-success" />
          <span className="tabular-nums">{TEAM_PULSE.shippedThisWeek}</span>
          <span>actions shipped this week</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-mono text-muted-foreground">
          <span className="tabular-nums">
            ${(TEAM_PULSE.bookArr / 1_000_000).toFixed(1)}M
          </span>
          <span>ARR on team's book</span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground ml-auto inline-flex items-center gap-1.5">
          <Sparkles className="size-3" />
          Sample team · numbers illustrative
        </span>
      </div>

      {/* Team strip */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <header className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold tracking-tight">Team</h2>
          <span className="text-[11px] font-mono text-muted-foreground ml-auto">
            calibration · book size · open work
          </span>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-border [&>*]:border-b [&>*]:border-border sm:[&>*]:border-b-0">
          {TEAM.map((m) => {
            const flagged = Math.abs(m.barDrift) >= 2;
            return (
              <div key={m.id} className="p-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-foreground/5 border border-border text-[11px] font-semibold flex items-center justify-center">
                    {m.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight truncate">{m.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {m.book} accts · ${(m.arr / 1_000_000).toFixed(2)}M
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] font-mono">
                  <Mini label="auto" value={`${m.autoShipRate}%`} tone="ok" />
                  <Mini
                    label="reverts"
                    value={String(m.revertsThisWeek)}
                    tone={m.revertsThisWeek >= 4 ? "warn" : "default"}
                  />
                  <Mini
                    label="judgment"
                    value={String(m.judgmentOpen)}
                    tone={m.judgmentOpen >= 2 ? "warn" : "default"}
                  />
                </div>
                {flagged && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded px-1.5 py-0.5">
                    <AlertTriangle className="size-2.5" />
                    Bar drift · {m.barDrift > 0 ? "+" : ""}{m.barDrift.toFixed(1)}σ
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Coaching queue */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <header className="px-5 py-3 border-b border-border flex items-start gap-3">
          <span className="size-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-sm font-semibold tracking-tight">
                Coaching moments
              </h2>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {COACHING.length} this week
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Where the team's read disagrees with the room. Use this at 1:1.
            </p>
          </div>
        </header>
        <ul className="divide-y divide-border">
          {COACHING.map((c) => {
            const ack = !!acknowledged[c.id];
            return (
              <li key={c.id} className={`px-5 py-4 ${ack ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{c.csm}</span>
                  <span>·</span>
                  <span>{c.account}</span>
                  <span className="ml-auto tabular-nums">{c.occurrences}× this month</span>
                </div>
                <h3 className="font-display text-base font-semibold leading-snug mt-1">
                  {c.pattern}
                </h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-md border border-border bg-background p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                      Agent said
                    </div>
                    <div className="text-[13px] mt-1">{c.agentSaid}</div>
                  </div>
                  <div className="rounded-md border border-border bg-background p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                      {c.csm.split(" ")[0]} did
                    </div>
                    <div className="text-[13px] mt-1">{c.csmDid}</div>
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground italic mt-3 border-l-2 border-border pl-3">
                  {c.suggestion}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setAcknowledged((p) => ({ ...p, [c.id]: !p[c.id] }))}
                    className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-90"
                  >
                    {ack ? "Re-open" : "Mark for 1:1"}
                  </button>
                  <button className="text-[11px] font-mono text-muted-foreground hover:text-foreground px-2">
                    Send to {c.csm.split(" ")[0]}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Co-sign queue */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <header className="px-5 py-3 border-b border-border flex items-start gap-3">
          <span className="size-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-sm font-semibold tracking-tight">
                Money co-sign queue
              </h2>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {openCosign.length} open
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Anything over $25k impact needs your signature before it ships.
            </p>
          </div>
        </header>
        {openCosign.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="font-display text-sm font-semibold">Queue clear.</div>
            <p className="text-[12px] text-muted-foreground mt-1">
              Next sweep when a CSM routes the next money action.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {openCosign.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-[0.14em]">
                    Money
                  </span>
                  <span className="text-muted-foreground">{a.csm}</span>
                  <span className="text-muted-foreground">· {a.account}</span>
                  {a.arrAtStake && (
                    <span className="ml-auto tabular-nums text-muted-foreground">
                      ${(a.arrAtStake / 1000).toFixed(0)}k ARR
                    </span>
                  )}
                </div>
                <h3 className="font-display text-base font-semibold leading-snug mt-1">
                  {a.headline}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{a.detail}</p>
                <blockquote className="mt-2 border-l-2 border-border pl-3 text-[12px] text-muted-foreground italic">
                  {a.evidence}
                  <div className="not-italic text-[10px] font-mono text-muted-foreground mt-1 inline-flex items-center gap-1">
                    <ExternalLink className="size-3" /> {a.source}
                  </div>
                </blockquote>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setCosigned((p) => ({ ...p, [a.id]: true }))}
                    className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-90"
                  >
                    Co-sign & release
                  </button>
                  <button
                    onClick={() => setCosigned((p) => ({ ...p, [a.id]: true }))}
                    className="border border-border rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/5"
                  >
                    Decline
                  </button>
                  <button className="text-[11px] font-mono text-muted-foreground hover:text-foreground px-2">
                    Reply to {a.csm.split(" ")[0]}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Team watch */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <header className="px-5 py-3 border-b border-border flex items-start gap-3">
          <span className="size-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-sm font-semibold tracking-tight">
                High-severity world signals
              </h2>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                across the team
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              You see these before the CSM does. Decide if it warrants a team-wide motion.
            </p>
          </div>
        </header>
        <ul className="divide-y divide-border">
          {TEAM_SIGNALS.map((s) => (
            <li key={s.id} className="px-5 py-3">
              <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-[0.14em]">
                  {s.kind.replace("-", " ")}
                </span>
                <span>{s.csm}</span>
                <span>· {s.account}</span>
                <span className="ml-auto">{s.detectedAt}</span>
              </div>
              <div className="text-sm mt-1">{s.headline}</div>
              <p className="text-[12px] text-muted-foreground mt-0.5">{s.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-[11px] font-mono text-muted-foreground text-center pt-4 inline-flex items-center justify-center gap-1.5 w-full">
        <TrendingUp className="size-3 text-success" />
        Calibration trending up · agent matched team's bar in {TEAM_PULSE.teamAutoShipRate}% of internal actions
        <TrendingDown className="size-3 text-success rotate-180" />
      </footer>
    </div>
  );
}

function Mini({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn";
}) {
  return (
    <div className="rounded border border-border bg-background px-1.5 py-1">
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div
        className={`tabular-nums font-semibold ${
          tone === "warn"
            ? "text-amber-700 dark:text-amber-400"
            : tone === "ok"
              ? "text-success"
              : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
