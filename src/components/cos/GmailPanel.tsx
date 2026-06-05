// Fake Gmail compose. Paragraphs stream in as the timeline progresses.

import { Mail } from "lucide-react";
import type { Artifact } from "@/lib/cos/scenarios";
import type { StepState } from "@/lib/cos/useRun";
import { ToolFrame } from "./SalesforcePanel";

export function GmailPanel({
  artifact,
  state,
  progress,
}: {
  artifact: Extract<Artifact, { tool: "gmail" }>;
  state: StepState;
  progress: number;
}) {
  const n = artifact.body.length;
  const revealed = state === "done" ? n : Math.floor(progress * n) + 1;
  const showCursor = state === "active";

  return (
    <ToolFrame
      icon={<Mail className="size-3.5 text-[#EA4335]" />}
      brand="Gmail"
      title="Draft"
      state={state}
    >
      <div className="px-3 py-2 text-[11px] font-mono text-muted-foreground border-b border-border space-y-0.5">
        <div className="truncate"><span className="opacity-60">to </span>{artifact.to}</div>
        <div className="truncate font-medium text-foreground">{artifact.subject}</div>
      </div>
      <div className="px-3 py-2.5 space-y-2 text-[12px] leading-snug min-h-[180px]">
        {artifact.body.slice(0, Math.min(revealed, n)).map((p, i) => {
          const isLast = i === Math.min(revealed, n) - 1;
          return (
            <p
              key={i}
              className="animate-in fade-in duration-300"
            >
              {p}
              {showCursor && isLast && state === "active" && (
                <span className="inline-block w-1.5 h-3 ml-0.5 bg-foreground align-middle animate-pulse" />
              )}
            </p>
          );
        })}
      </div>
    </ToolFrame>
  );
}
