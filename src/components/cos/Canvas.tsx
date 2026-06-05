// The Chief of Staff canvas. A call just ended; the agent fans out
// across 4 tools and produces real artifacts in front of you. One
// click to replay. This is the hero of the entire product.

import { useMemo } from "react";
import { Play, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { HERO, ACTION_COUNT, TIME_SAVED_MIN } from "@/lib/cos/scenarios";
import { useRun } from "@/lib/cos/useRun";
import { SalesforcePanel } from "./SalesforcePanel";
import { GmailPanel } from "./GmailPanel";
import { SlackPanel } from "./SlackPanel";
import { AsanaPanel } from "./AsanaPanel";
import { Button } from "@/components/ui/button";

export function Canvas() {
  const { elapsed, isComplete, states, stepProgress, replay } = useRun(HERO, true);

  const seconds = useMemo(
    () => Math.min(elapsed / 1000, 8.2).toFixed(1),
    [elapsed],
  );
  const actionsLanded = useMemo(() => {
    // crude tally based on step progress
    const t = stepProgress.reduce((a, b) => a + b, 0);
    return Math.min(ACTION_COUNT, Math.round((t / HERO.steps.length) * ACTION_COUNT));
  }, [stepProgress]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Call strip */}
      <header className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-success/15 flex items-center justify-center">
              <CheckCircle2 className="size-4 text-success" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Call ended · {HERO.endedAtLabel}
              </div>
              <div className="font-display font-semibold text-base leading-tight">
                {HERO.callTitle}
                <span className="text-muted-foreground font-normal">
                  {" "}· {HERO.callDuration} min · ${(HERO.arr / 1000).toFixed(0)}k renewal
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={replay}
              size="sm"
              variant="outline"
              className="font-mono text-[11px] gap-1.5"
            >
              <Play className="size-3" />
              Replay
            </Button>
          </div>
        </div>

        <div className="px-5 pb-4 -mt-1">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
            Heard on the call
          </div>
          <p className="text-[13px] leading-snug text-foreground/90 max-w-3xl">
            "{HERO.heardOnCall}"
          </p>
        </div>
      </header>

      {/* Sub-header: the agent is working */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex -space-x-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`size-2 rounded-full transition-all duration-300 ${
                states[i] === "queued"
                  ? "bg-muted-foreground/30"
                  : states[i] === "active"
                    ? "bg-foreground animate-pulse"
                    : "bg-success"
              }`}
            />
          ))}
        </div>
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          {isComplete
            ? `Done in ${seconds}s · ${TIME_SAVED_MIN} min of post-call work, gone`
            : `Chief of Staff working · ${actionsLanded}/${ACTION_COUNT} actions · ${seconds}s`}
        </div>
      </div>

      {/* The canvas — 4 tool panels in a 2×2 (desktop) or stack (mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HERO.steps.map((step, i) => {
          const a = step.artifact;
          const props = { state: states[i], progress: stepProgress[i] };
          if (a.tool === "salesforce")
            return <SalesforcePanel key={i} artifact={a} {...props} />;
          if (a.tool === "gmail")
            return <GmailPanel key={i} artifact={a} {...props} />;
          if (a.tool === "slack")
            return <SlackPanel key={i} artifact={a} {...props} />;
          return <AsanaPanel key={i} artifact={a} {...props} />;
        })}
      </div>

      {/* Bottom ticker — the receipt */}
      <div
        className={`rounded-xl border bg-surface px-5 py-4 flex items-center gap-4 flex-wrap transition-all duration-500 ${
          isComplete ? "border-success/40" : "border-border"
        }`}
      >
        <Stat
          label="Actions shipped"
          value={`${actionsLanded}/${ACTION_COUNT}`}
          icon={<Sparkles className="size-3" />}
        />
        <Divider />
        <Stat
          label="Across tools"
          value="4"
          sub="Salesforce · Gmail · Slack · Asana"
        />
        <Divider />
        <Stat
          label="Wall-clock time"
          value={`${seconds}s`}
          icon={<Clock className="size-3" />}
        />
        <Divider />
        <Stat
          label="CSM time saved"
          value={`${TIME_SAVED_MIN} min`}
          sub="per call · today"
          highlight={isComplete}
        />

        <div className="ml-auto flex items-center gap-2">
          <Button
            disabled={!isComplete}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90 font-mono text-[11px]"
          >
            Approve & send all
          </Button>
        </div>
      </div>

      <p className="text-[10px] font-mono text-muted-foreground text-center">
        Demo · scripted artifacts · live integrations land next sprint
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div
        className={`font-display font-semibold text-lg leading-tight tabular-nums ${
          highlight ? "text-success" : ""
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-border" />;
}
