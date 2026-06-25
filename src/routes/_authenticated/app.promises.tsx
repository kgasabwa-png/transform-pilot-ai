import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/nyvlo/Shell";
import { PromiseRow } from "@/components/nyvlo/PromiseRow";
import { Skeleton } from "@/components/ui/skeleton";
import { listPromises } from "@/lib/nyvlo/data.functions";

export const Route = createFileRoute("/_authenticated/app/promises")({
  head: () => ({ meta: [{ title: "Actions · Nyvlo" }] }),
  component: PromisesPage,
});

type Filter = "all" | "open" | "overdue" | "kept" | "missed" | "dismissed";

function PromisesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const fetchPromises = useServerFn(listPromises);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["promises"], queryFn: () => fetchPromises() });

  const list = items.filter((p) => {
    if (filter === "all") return true;
    if (filter === "overdue") return p.status === "open" && p.due_at && new Date(p.due_at).getTime() < Date.now();
    return p.status === filter;
  });

  const counts: Record<Filter, number> = {
    all: items.length,
    open: items.filter((p) => p.status === "open").length,
    overdue: items.filter((p) => p.status === "open" && p.due_at && new Date(p.due_at).getTime() < Date.now()).length,
    kept: items.filter((p) => p.status === "kept").length,
    missed: items.filter((p) => p.status === "missed").length,
    dismissed: items.filter((p) => p.status === "dismissed").length,
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "overdue", label: "Overdue" },
    { id: "open", label: "Open" },
    { id: "kept", label: "Kept" },
    { id: "missed", label: "Missed" },
    { id: "dismissed", label: "Dismissed" },
  ];

  return (
    <Shell title="Actions" subtitle="Follow-ups and commitments extracted from your meetings.">
      <div className="mb-5 flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px] transition-colors",
                active ? "border-foreground/15 bg-foreground text-background" : "border-border bg-card hover:bg-muted",
              ].join(" ")}
            >
              {f.label}
              <span className={`font-mono text-[10.5px] ${active ? "text-background/70" : "text-muted-foreground"}`}>
                {counts[f.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
              <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-14" />
            </div>
          ))
        ) : list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-[13px] text-muted-foreground">
            Nothing here yet. Capture a meeting and Nyvlo will pull out follow-ups automatically.
          </div>
        ) : (
          list.map((p) => <PromiseRow key={p.id} item={p} />)
        )}
      </div>
    </Shell>
  );
}
