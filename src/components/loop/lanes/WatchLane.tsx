import { useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { LaneShell } from "./LaneShell";
import type { WorldSignal } from "@/lib/loop/consoleData";

const KIND_LABEL: Record<WorldSignal["kind"], string> = {
  "champion-change": "Champion change",
  acquisition: "Acquisition",
  funding: "Funding",
  layoffs: "Layoffs",
  hiring: "Hiring signal",
};

const SEV_COLOR: Record<WorldSignal["severity"], string> = {
  high: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

export function WatchLane({ signals }: { signals: WorldSignal[] }) {
  const [promoted, setPromoted] = useState<Record<string, boolean>>({});

  return (
    <LaneShell
      id="watch"
      count={signals.length}
      badge="Calls · CRM · World"
    >
      <ul className="divide-y divide-border">
        {signals.map((s) => {
          const isPromoted = !!promoted[s.id];
          return (
            <li key={s.id} className="px-5 py-3">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-mono uppercase tracking-[0.14em] px-1.5 py-0.5 rounded ${SEV_COLOR[s.severity]}`}
                >
                  {KIND_LABEL[s.kind]}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {s.account}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                  {s.detectedAt}
                </span>
              </div>
              <div className="text-sm leading-snug">{s.headline}</div>
              <p className="text-[12px] text-muted-foreground mt-1">{s.detail}</p>
              {s.correlatesWith && (
                <div className="mt-2 text-[11px] text-muted-foreground bg-foreground/5 rounded px-2 py-1.5 inline-flex items-start gap-1.5">
                  <Sparkles className="size-3 mt-0.5 shrink-0" />
                  <span>
                    <span className="font-medium text-foreground/80">
                      Pairs with:
                    </span>{" "}
                    {s.correlatesWith}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ExternalLink className="size-3" />
                  {s.source}
                </a>
                <button
                  onClick={() =>
                    setPromoted((p) => ({ ...p, [s.id]: !p[s.id] }))
                  }
                  className={`ml-auto text-[11px] font-mono px-2 py-1 rounded-md transition-colors ${
                    isPromoted
                      ? "bg-foreground text-background"
                      : "border border-border hover:bg-foreground/5"
                  }`}
                >
                  {isPromoted ? "Promoted to motion ✓" : "Promote to motion"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </LaneShell>
  );
}
