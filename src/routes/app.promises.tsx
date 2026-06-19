import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nyvlo/Shell";
import { PromiseCard } from "@/components/nyvlo/PromiseCard";
import { promises, type PromiseStatus } from "@/lib/nyvlo/data";

export const Route = createFileRoute("/app/promises")({
  head: () => ({ meta: [{ title: "Promises · Nyvlo" }] }),
  component: PromisesPage,
});

const filters: { id: PromiseStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "pending", label: "Pending" },
  { id: "upcoming", label: "Upcoming" },
  { id: "done", label: "Done" },
];

function PromisesPage() {
  const [filter, setFilter] = useState<PromiseStatus | "all">("all");
  const list = filter === "all" ? promises : promises.filter((p) => p.status === filter);

  return (
    <Shell title="Promises" subtitle="Every commitment Nyvlo has detected. The full inbox of what you owe.">
      <div className="mb-5 flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const active = f.id === filter;
          const count = f.id === "all" ? promises.length : promises.filter((p) => p.status === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px] transition-colors",
                active
                  ? "border-foreground/15 bg-foreground text-background"
                  : "border-border bg-card text-foreground/80 hover:bg-muted",
              ].join(" ")}
            >
              {f.label}
              <span className={`font-mono text-[10.5px] ${active ? "text-background/70" : "text-muted-foreground"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {list.length === 0 ? (
          <div className="nyvlo-card p-10 text-center text-[13px] text-muted-foreground">
            Nothing here. Inbox zero on this lane.
          </div>
        ) : (
          list.map((p) => <PromiseCard key={p.id} item={p} />)
        )}
      </div>
    </Shell>
  );
}
