// Manager coaching drawer: click a bar-drift flag → see the CSM's actual
// reverts side-by-side with what the agent said. The "coach the bar" promise
// made tangible.

import { X, AlertTriangle, TrendingUp, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TEAM, COACHING, type TeamMember } from "@/lib/loop/teamData";

export function CoachingDrawer({
  memberId,
  onClose,
}: {
  memberId: string | null;
  onClose: () => void;
}) {
  const member: TeamMember | undefined = TEAM.find((m) => m.id === memberId);
  const moments = member
    ? COACHING.filter((c) => c.csm === member.name)
    : [];

  return (
    <Sheet open={!!memberId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto p-0"
      >
        {member && (
          <>
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                  coaching · {member.name}
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <SheetTitle className="font-display text-xl font-semibold tracking-tight flex items-center gap-2">
                <span>{member.name}</span>
                {Math.abs(member.barDrift) >= 2 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 inline-flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    Bar drift {member.barDrift > 0 ? "+" : ""}
                    {member.barDrift.toFixed(1)}σ
                  </span>
                )}
              </SheetTitle>
              <p className="text-[12px] text-muted-foreground">
                {member.book} accounts · ${(member.arr / 1_000_000).toFixed(2)}M ARR ·{" "}
                {member.revertsThisWeek} reverts this week (team avg{" "}
                {(
                  TEAM.reduce((s, m) => s + m.revertsThisWeek, 0) / TEAM.length
                ).toFixed(1)}
                ).
              </p>
            </SheetHeader>

            <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-surface/40">
              <Mini label="Auto-ship" value={`${member.autoShipRate}%`} />
              <Mini label="Shipped/wk" value={String(member.shippedThisWeek)} />
              <Mini label="Judgment open" value={String(member.judgmentOpen)} />
            </div>

            <div className="px-5 py-4 space-y-3">
              <h3 className="font-display text-sm font-semibold tracking-tight">
                Patterns to coach
              </h3>
              {moments.length === 0 && (
                <p className="text-[12px] text-muted-foreground">
                  No patterns flagged for {member.name.split(" ")[0]} this week.
                </p>
              )}
              {moments.map((c) => (
                <article
                  key={c.id}
                  className="rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex items-baseline gap-2 text-[11px] font-mono text-muted-foreground">
                    <span className="font-semibold text-foreground/80">{c.pattern}</span>
                    <span className="ml-auto tabular-nums">{c.occurrences}× this month</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {c.account}
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-md border border-border bg-background p-2.5">
                      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                        Agent said
                      </div>
                      <div className="text-[12px] mt-1">{c.agentSaid}</div>
                    </div>
                    <div className="rounded-md border border-border bg-background p-2.5">
                      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                        {member.name.split(" ")[0]} did
                      </div>
                      <div className="text-[12px] mt-1">{c.csmDid}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic mt-2 border-l-2 border-border pl-3">
                    {c.suggestion}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => {
                        toast.success(`Saved for 1:1 with ${member.name.split(" ")[0]}`, {
                          description: c.pattern,
                        });
                      }}
                      className="bg-foreground text-background rounded-md px-3 py-1.5 text-xs font-medium hover:opacity-90 inline-flex items-center gap-1.5"
                    >
                      <TrendingUp className="size-3" /> Save for 1:1
                    </button>
                    <button
                      onClick={() => {
                        toast(`DM sent to ${member.name.split(" ")[0]}`, {
                          description: "Reference the pattern in Slack",
                        });
                      }}
                      className="border border-border rounded-md px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 inline-flex items-center gap-1.5"
                    >
                      <MessageSquare className="size-3" /> DM now
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-lg font-semibold tabular-nums mt-0.5">
        {value}
      </div>
    </div>
  );
}
