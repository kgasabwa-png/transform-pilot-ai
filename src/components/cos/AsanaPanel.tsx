// Fake Asana task list. Tasks check in one at a time.

import { CheckSquare, Circle } from "lucide-react";
import type { Artifact } from "@/lib/cos/scenarios";
import type { StepState } from "@/lib/cos/useRun";
import { ToolFrame } from "./SalesforcePanel";

export function AsanaPanel({
  artifact,
  state,
  progress,
}: {
  artifact: Extract<Artifact, { tool: "asana" }>;
  state: StepState;
  progress: number;
}) {
  const n = artifact.tasks.length;
  const revealed = state === "done" ? n : Math.floor(progress * n) + 1;

  return (
    <ToolFrame
      icon={<CheckSquare className="size-3.5 text-[#F06A6A]" />}
      brand="Asana"
      title={artifact.project}
      state={state}
    >
      <ul className="divide-y divide-border min-h-[180px]">
        {artifact.tasks.slice(0, Math.min(revealed, n)).map((t, i) => (
          <li
            key={i}
            className="px-3 py-2.5 flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            <Circle className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] leading-snug font-medium">
                {t.title}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                {t.owner} · due {t.due}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </ToolFrame>
  );
}
