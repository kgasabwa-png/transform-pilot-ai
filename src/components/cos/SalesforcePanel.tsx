// Fake Salesforce field-update card. Each field flips with a brief
// "diff" reveal as the timeline progresses.

import { Check, Cloud } from "lucide-react";
import type { Artifact } from "@/lib/cos/scenarios";
import type { StepState } from "@/lib/cos/useRun";

export function SalesforcePanel({
  artifact,
  state,
  progress,
}: {
  artifact: Extract<Artifact, { tool: "salesforce" }>;
  state: StepState;
  progress: number;
}) {
  const n = artifact.updates.length;
  // Reveal one field per (1/n) of progress.
  const revealed = state === "done" ? n : Math.floor(progress * n);

  return (
    <ToolFrame
      icon={<Cloud className="size-3.5 text-[#00A1E0]" />}
      brand="Salesforce"
      title={artifact.object}
      state={state}
    >
      <ul className="divide-y divide-border">
        {artifact.updates.map((u, i) => {
          const shown = i < revealed || state === "done";
          return (
            <li
              key={u.field}
              className={`px-3 py-2 flex items-center gap-2 transition-opacity duration-300 ${
                shown ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="size-4 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <Check className="size-2.5 text-success" />
              </div>
              <div className="text-[11px] font-mono text-muted-foreground w-24 truncate">
                {u.field}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5 text-[12px]">
                <span className="text-muted-foreground line-through truncate max-w-[60px]">
                  {u.from}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium truncate">{u.to}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </ToolFrame>
  );
}

export function ToolFrame({
  icon,
  brand,
  title,
  state,
  children,
}: {
  icon: React.ReactNode;
  brand: string;
  title: string;
  state: StepState;
  children: React.ReactNode;
}) {
  const tone =
    state === "done"
      ? "border-success/40 shadow-[0_0_0_1px_oklch(0.72_0.17_152_/_15%)]"
      : state === "active"
        ? "border-foreground/30 shadow-lg"
        : "border-border opacity-50";

  return (
    <div
      className={`rounded-xl border bg-surface overflow-hidden transition-all duration-500 ${tone}`}
    >
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-background/60">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          {brand}
        </span>
        <span className="text-[11px] font-medium truncate flex-1 min-w-0">
          · {title}
        </span>
        {state === "active" && (
          <span className="size-1.5 rounded-full bg-foreground animate-pulse shrink-0" />
        )}
        {state === "done" && (
          <span className="size-1.5 rounded-full bg-success shrink-0" />
        )}
      </div>
      {children}
    </div>
  );
}
