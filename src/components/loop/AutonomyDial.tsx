// Compact autonomy summary chip. Reads sample data; the real version
// will compute auto-ship rate from the action ledger.

export function AutonomyDial({
  autoRate,
  reverts,
  trend,
}: {
  autoRate: number; // 0-100
  reverts: number;
  trend: string; // "+7 pts vs last week"
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-success animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          Auto-ship
        </span>
        <span className="text-sm font-semibold tabular-nums">{autoRate}%</span>
      </div>
      <span className="text-border">·</span>
      <div className="text-[11px] font-mono text-muted-foreground">
        {reverts} {reverts === 1 ? "revert" : "reverts"} this week
      </div>
      <span className="text-border hidden sm:inline">·</span>
      <div className="hidden sm:block text-[11px] font-mono text-success">{trend}</div>
    </div>
  );
}
