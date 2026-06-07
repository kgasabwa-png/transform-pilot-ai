import { TrendingUp, Activity, Brain } from "lucide-react";

// Makes the learning loop visible — the agent getting measurably yours.
export function CalibrationStrip() {
  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <header className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Brain className="size-4 text-primary" />
        <h2 className="font-display text-sm font-semibold tracking-tight">
          Calibration · how I'm learning your bar
        </h2>
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground ml-auto">
          last 7 days
        </span>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <Cell
          label="Auto-ship rate"
          value="87%"
          delta="+8 pts"
          tone="ok"
          sub="Up from 79% last week — I'm learning when you don't need to look."
        />
        <Cell
          label="Reverts this week"
          value="2"
          delta="0.4σ from team"
          tone="default"
          sub="Both on discount language. I've tightened the bar — holding 3 more for you today."
        />
        <Cell
          label="Would have shipped"
          value="11"
          delta="last week → today"
          tone="ok"
          sub="Items I held a week ago that I'd auto-ship now. Your bar is making me sharper."
        />
      </div>
      <footer className="px-5 py-2.5 border-t border-border flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
        <Activity className="size-3 text-success" />
        <span>Confidence drift on Quill / Northwind ↗ · on Halcyon ↘ since acquisition</span>
        <span className="ml-auto inline-flex items-center gap-1 text-success">
          <TrendingUp className="size-3" /> flywheel turning
        </span>
      </footer>
    </section>
  );
}

function Cell({
  label,
  value,
  delta,
  sub,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  sub: string;
  tone: "ok" | "default";
}) {
  return (
    <div className="p-5">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold tabular-nums">{value}</span>
        <span
          className={`text-[11px] font-mono tabular-nums ${
            tone === "ok" ? "text-success" : "text-muted-foreground"
          }`}
        >
          {delta}
        </span>
      </div>
      <p className="text-[12px] text-muted-foreground mt-2 leading-snug">{sub}</p>
    </div>
  );
}
