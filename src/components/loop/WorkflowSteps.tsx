// A compact, numbered "how this surface works" strip.
// Goal: make the workflow obvious before the user touches anything.

import { ArrowRight } from "lucide-react";

export type WorkflowStep = {
  label: string;
  detail: string;
};

export function WorkflowSteps({
  title,
  steps,
}: {
  title: string;
  steps: WorkflowStep[];
}) {
  return (
    <section
      aria-label="How this works"
      className="rounded-2xl border border-border bg-surface/60 px-4 py-3"
    >
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" />
        {title}
      </div>
      <ol className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className="flex items-start gap-2 sm:px-3 first:sm:pl-0 last:sm:pr-0 sm:border-r last:sm:border-r-0 border-border"
          >
            <span className="size-5 rounded-full bg-foreground text-background text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-tight flex items-center gap-1">
                {s.label}
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden sm:inline size-3 text-muted-foreground ml-1" />
                )}
              </div>
              <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                {s.detail}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
