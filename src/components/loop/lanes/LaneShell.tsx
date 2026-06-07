import type { ReactNode } from "react";
import type { LaneId } from "@/lib/loop/autonomy";
import { LANE_META } from "@/lib/loop/autonomy";

const ACCENT: Record<LaneId, string> = {
  shipped: "bg-success",
  quick: "bg-primary",
  judgment: "bg-rose-500",
  watch: "bg-sky-500",
};

export function LaneShell({
  id,
  count,
  badge,
  children,
}: {
  id: LaneId;
  count: number;
  badge?: string;
  children: ReactNode;
}) {
  const meta = LANE_META[id];
  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
      <header className="px-5 py-3 border-b border-border flex items-start gap-3 bg-foreground/[0.015]">
        <span className={`size-2 rounded-full mt-1.5 shrink-0 ${ACCENT[id]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="font-display text-sm font-semibold tracking-tight">
              {meta.title}
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
              {count} {count === 1 ? "item" : "items"}
            </span>
            {badge && (
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                · {badge}
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">{meta.sub}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
