// Shared empty / day-1 / loading states. Keeps the "what do I do here"
// answer consistent when there's no work waiting.

import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function EmptyState({
  icon: Icon = Sparkles,
  eyebrow,
  title,
  body,
  cta,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  body: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="px-5 py-10 text-center max-w-md mx-auto">
      <div className="inline-flex items-center justify-center size-10 rounded-full bg-foreground/5 border border-border mb-3">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      {eyebrow && (
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
          {eyebrow}
        </div>
      )}
      <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{body}</p>
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-full hover:opacity-90"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
