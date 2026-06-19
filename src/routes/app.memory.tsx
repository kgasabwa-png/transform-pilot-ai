import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/nyvlo/Shell";
import { memories } from "@/lib/nyvlo/data";
import { CalendarDays, FileText, Mail, StickyNote, Globe } from "lucide-react";

export const Route = createFileRoute("/app/memory")({
  head: () => ({ meta: [{ title: "Memory · Nyvlo" }] }),
  component: MemoryPage,
});

const icons = {
  meeting: CalendarDays,
  note: StickyNote,
  page: FileText,
  email: Mail,
  calendar: Globe,
};

function MemoryPage() {
  // group by day
  const groups = memories.reduce<Record<string, typeof memories>>((acc, m) => {
    const k = new Date(m.at).toDateString();
    (acc[k] ??= []).push(m);
    return acc;
  }, {});

  return (
    <Shell title="Memory" subtitle="Everything Nyvlo has noticed. Saved pages, meetings, manual notes, captured asks.">
      <div className="relative">
        <div className="absolute bottom-0 left-[7px] top-2 w-px bg-border md:left-[100px]" />
        <div className="flex flex-col gap-8">
          {Object.entries(groups).map(([day, items]) => (
            <div key={day}>
              <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:pl-[124px]">
                {formatDay(day)}
              </div>
              <div className="flex flex-col gap-2">
                {items.map((m) => {
                  const Icon = icons[m.kind];
                  return (
                    <div key={m.id} className="flex items-start gap-3 md:gap-5">
                      <div className="hidden w-[90px] shrink-0 pt-2 text-right font-mono text-[11px] text-muted-foreground md:block">
                        {formatTime(m.at)}
                      </div>
                      <div className="relative z-10 mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                        <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                      </div>
                      <div className="nyvlo-card flex-1 p-3.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="text-[14px] font-medium tracking-tight">{m.title}</h3>
                          <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">{m.kind}</span>
                        </div>
                        {m.detail ? <p className="mt-1 text-[12.5px] text-muted-foreground">{m.detail}</p> : null}
                        {m.url ? <p className="mt-1 truncate font-mono text-[11.5px] text-primary/80">{m.url}</p> : null}
                        {m.people ? (
                          <div className="mt-1 text-[11.5px] text-muted-foreground">with {m.people.join(", ")}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
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
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
