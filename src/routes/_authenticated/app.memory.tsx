import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/nyvlo/Shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listMemory } from "@/lib/nyvlo/data.functions";
import { CalendarDays, Mail, StickyNote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/memory")({
  head: () => ({ meta: [{ title: "Memory · Nyvlo" }] }),
  component: MemoryPage,
});

function MemoryPage() {
  const fetchMemory = useServerFn(listMemory);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["memory"], queryFn: () => fetchMemory() });

  const groups = items.reduce<Record<string, typeof items>>((acc, m) => {
    const k = new Date(m.occurred_at).toDateString();
    (acc[k] ??= []).push(m);
    return acc;
  }, {});

  return (
    <Shell title="Memory" subtitle="Everything Nyvlo has noticed across your sources.">
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 md:gap-5">
              <Skeleton className="hidden h-3 w-[90px] shrink-0 md:block" />
              <Skeleton className="mt-1.5 h-4 w-4 shrink-0 rounded-full" />
              <div className="flex-1 rounded-lg border border-border bg-card p-3.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-2 h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-[13px] text-muted-foreground">
          Memory is empty. Connect Google in Settings — Nyvlo will start saving meetings and emails it learns from.
        </div>
      ) : (
        <div className="relative">
          <div className="absolute bottom-0 left-[7px] top-2 w-px bg-border md:left-[100px]" />
          <div className="flex flex-col gap-8">
            {Object.entries(groups).map(([day, list]) => (
              <div key={day}>
                <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:pl-[124px]">
                  {formatDay(day)}
                </div>
                <div className="flex flex-col gap-2">
                  {list.map((m) => {
                    const Icon = m.kind === "meeting" ? CalendarDays : m.kind === "email" ? Mail : StickyNote;
                    return (
                      <div key={m.id} className="flex items-start gap-3 md:gap-5">
                        <div className="hidden w-[90px] shrink-0 pt-2 text-right font-mono text-[11px] text-muted-foreground md:block">
                          {new Date(m.occurred_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </div>
                        <div className="relative z-10 mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                          <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 rounded-lg border border-border bg-card p-3.5">
                          <div className="flex items-baseline justify-between gap-3">
                            <h3 className="text-[14px] font-medium tracking-tight">{m.title}</h3>
                            <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">{m.kind}</span>
                          </div>
                          {m.snippet ? <p className="mt-1 text-[12.5px] text-muted-foreground">{m.snippet}</p> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}

function formatDay(d: string) {
  const date = new Date(d);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((today.getTime() - date.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Date(d).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
