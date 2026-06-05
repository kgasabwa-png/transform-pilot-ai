// "Shipped today" — a thin running log at the bottom of the Approval
// Queue showing every action the human approved this session. Makes
// the "I actually did 6 things in 4 minutes" feel real and visible.

import { Check, Mail, Database, Calendar, Flag, TrendingUp, X, AlertCircle } from "lucide-react";
import type { DraftAction } from "@/lib/loop/actions";
import { ACCOUNTS, formatARR } from "@/lib/loop/portfolio";
import { relativeAgo } from "@/lib/loop/time";

const iconFor = {
  email: Mail,
  "crm-update": Database,
  meeting: Calendar,
  flag: Flag,
  "forecast-move": TrendingUp,
} as const;

export function ShippedToday({ actions }: { actions: DraftAction[] }) {
  const closed = actions.filter(
    (a) => a.status === "shipped" || a.status === "overridden" || a.status === "skipped",
  );
  if (closed.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-transparent p-5 text-center">
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          Shipped today
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Nothing closed yet. Approve a draft above to start your morning log.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Check className="size-3.5 text-success" />
        <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          Shipped today
        </span>
        <span className="ml-auto text-[11px] font-mono text-muted-foreground">
          {closed.length} closed
        </span>
      </div>
      <ul className="divide-y divide-border">
        {closed.map((a) => {
          const Icon = iconFor[a.kind];
          const account = ACCOUNTS.find((x) => x.id === a.accountId);
          const isShip = a.status === "shipped";
          return (
            <li key={a.id} className="px-5 py-3 flex items-start gap-3">
              <div
                className={`size-7 rounded-md flex items-center justify-center shrink-0 ${
                  isShip ? "bg-success/10" : "bg-muted"
                }`}
              >
                {isShip ? (
                  <Icon className="size-3.5 text-success" />
                ) : a.status === "overridden" ? (
                  <AlertCircle className="size-3.5 text-warning" />
                ) : (
                  <X className="size-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono text-muted-foreground">
                  {a.status === "shipped"
                    ? "Shipped"
                    : a.status === "overridden"
                    ? "Overridden"
                    : "Skipped"}{" "}
                  · {account?.name ?? a.accountId} · {relativeAgo(a.preparedAt)}
                </div>
                <div className="text-sm leading-snug mt-0.5 truncate">{a.oneLine}</div>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground shrink-0 pt-0.5">
                {formatARR(Math.abs(a.arrImpact))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
