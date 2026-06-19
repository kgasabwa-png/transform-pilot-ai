import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/nyvlo/Shell";
import { PromiseCard } from "@/components/nyvlo/PromiseCard";
import { promises, meetings, user, reliability } from "@/lib/nyvlo/data";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Today · Nyvlo" },
      { name: "description", content: "Today's promises, meetings, and the things about to slip through the cracks." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const attention = promises.filter((p) => p.status === "overdue" || p.status === "today").slice(0, 4);
  const upcoming = promises.filter((p) => p.status === "pending" || p.status === "upcoming").slice(0, 3);

  return (
    <Shell title={`Good afternoon, ${user.name}.`} subtitle="Here's what Nyvlo caught for you.">
      {/* Hero strip */}
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatTile label="Needs attention" value={attention.length.toString()} tone="danger" hint="overdue + today" />
        <StatTile label="Open promises" value={promises.filter((p) => p.status !== "done").length.toString()} tone="default" hint="across the week" />
        <StatTile
          label="Reliability score"
          value={reliability.score.toString()}
          tone="primary"
          hint={`${reliability.completed} of ${reliability.promisesMade} kept this week`}
        />
      </section>

      {/* Attention */}
      <section className="mb-10">
        <SectionHeader title="Things needing attention" link={{ to: "/app/promises", label: "All promises" }} />
        <div className="flex flex-col gap-2">
          {attention.map((p) => <PromiseCard key={p.id} item={p} />)}
        </div>
      </section>

      <div className="grid gap-10 md:grid-cols-[1.3fr,1fr]">
        {/* Upcoming */}
        <section>
          <SectionHeader title="Coming up" />
          <div className="flex flex-col gap-2">
            {upcoming.map((p) => <PromiseCard key={p.id} item={p} />)}
          </div>
        </section>

        {/* Meetings */}
        <section>
          <SectionHeader title="Your calendar" />
          <div className="flex flex-col gap-2">
            {meetings.map((m) => (
              <div key={m.id} className="nyvlo-card p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[14.5px] font-medium tracking-tight">{m.title}</h3>
                  <span className="font-mono text-[11px] text-muted-foreground">{m.whenLabel}</span>
                </div>
                <div className="mt-1 text-[12.5px] text-muted-foreground">with {m.attendees.join(", ")}</div>
                {m.prep ? (
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-accent/60 px-3 py-2 text-[12.5px] text-accent-foreground">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <span>{m.prep}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function StatTile({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "danger" | "primary" | "default" }) {
  const accent = tone === "danger" ? "text-danger" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="nyvlo-card p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 text-[36px] font-semibold leading-none tracking-tight ${accent}`}>{value}</div>
      <div className="mt-2 text-[12px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
      {link ? (
        <Link to={link.to} className="inline-flex items-center gap-1 text-[12px] text-foreground/70 hover:text-foreground">
          {link.label} <ArrowRight className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}
