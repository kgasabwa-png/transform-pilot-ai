// Fake Slack thread. Lines pop in one at a time.

import { Hash } from "lucide-react";
import type { Artifact } from "@/lib/cos/scenarios";
import type { StepState } from "@/lib/cos/useRun";
import { ToolFrame } from "./SalesforcePanel";

export function SlackPanel({
  artifact,
  state,
  progress,
}: {
  artifact: Extract<Artifact, { tool: "slack" }>;
  state: StepState;
  progress: number;
}) {
  const n = artifact.lines.length;
  const revealed = state === "done" ? n : Math.floor(progress * n) + 1;

  return (
    <ToolFrame
      icon={<Hash className="size-3.5 text-[#4A154B]" />}
      brand="Slack"
      title={artifact.channel}
      state={state}
    >
      <div className="px-3 py-2.5 flex gap-2.5 min-h-[180px]">
        <div className="size-7 rounded-md bg-foreground text-background flex items-center justify-center text-[10px] font-mono shrink-0">
          CoS
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[12px] font-semibold">{artifact.author}</span>
            <span className="text-[10px] font-mono text-muted-foreground">
              agent · now
            </span>
          </div>
          <div className="space-y-1 text-[12px] leading-snug">
            {artifact.lines.slice(0, Math.min(revealed, n)).map((line, i) => (
              <div
                key={i}
                className="animate-in fade-in slide-in-from-left-1 duration-200 whitespace-pre-wrap"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolFrame>
  );
}
