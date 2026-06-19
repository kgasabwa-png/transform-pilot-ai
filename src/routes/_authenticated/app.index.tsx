import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/nyvlo/Shell";
import { PromiseRow } from "@/components/nyvlo/PromiseRow";
import { Skeleton } from "@/components/ui/skeleton";
import { listPromises, getTodayStats } from "@/lib/nyvlo/data.functions";
import { getProfile } from "@/lib/nyvlo/profile.functions";
import { ArrowRight, Sparkles, PlugZap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Today · Nyvlo" }] }),
  component: TodayPage,
});

function TodayPage() {
  const fetchPromises = useServerFn(listPromises);
  const fetchStats = useServerFn(getTodayStats);
  const fetchProfile = useServerFn(getProfile);

  const { data: promises = [], isLoading: promisesLoading } = useQuery({ queryKey: ["promises"], queryFn: () => fetchPromises() });
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["todayStats"], queryFn: () => fetchStats() });
  const { data: profileData } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const name = profileData?.profile?.full_name?.split(" ")[0] ?? "there";
  const isConnected = !!profileData?.connection;

  const attention = promises.filter((p) => {
    if (p.status !== "open") return false;
    if (!p.due_at) return false;
    return new Date(p.due_at).getTime() < Date.now() + 86400000;
  });
  const upcoming = promises.filter((p) => p.status === "open").slice(0, 5);

  return (
    <Shell title={`Hi ${name}.`} subtitle="Here's what Nyvlo caught for you.">
      {!isConnected && (
        <div className="mb-8 flex items-start justify-between gap-4 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <div className="flex items-start gap-3">
            <PlugZap className="mt-0.5 h-5 w-5 text-warning" />
            <div>
              <div className="text-[14px] font-medium text-foreground">Connect Google to start catching promises</div>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Nyvlo reads your calendar and sent email (read-only) to find commitments you might forget.
              </p>
            </div>
          </div>
          <Link
            to="/app/settings"
            className="shrink-0 rounded-md bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background hover:opacity-90"
          >
            Connect Google
          </Link>
        </div>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {statsLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatTile label="Needs attention" value={String(attention.length)} hint="overdue + today" />
            <StatTile label="Open promises" value={String(stats?.open ?? 0)} hint="across the inbox" />
            <StatTile
              label="Reliability"
              value={stats?.reliability != null ? `${Math.round(Number(stats.reliability) * 100)}%` : "—"}
              hint={stats ? `${stats.kept} kept · ${stats.missed} missed` : "Building history"}
            />
          </>
        )}
      </section>

      <section className="mb-10">
        <SectionHeader title="Things needing attention" link={{ to: "/app/promises", label: "All promises" }} />
        <div className="flex flex-col gap-2">
          {promisesLoading ? (
            <RowSkeletons count={3} />
          ) : attention.length === 0 ? (
            <EmptyCard message={isConnected ? "Inbox zero. Nothing slipping right now." : "Connect Google to populate this."} />
          ) : (
            attention.map((p) => <PromiseRow key={p.id} item={p} />)
          )}
        </div>
      </section>

      <section>
        <SectionHeader title="Coming up" />
        <div className="flex flex-col gap-2">
          {promisesLoading ? (
            <RowSkeletons count={3} />
          ) : upcoming.length === 0 ? (
            <EmptyCard message="No upcoming commitments yet." />
          ) : (
            upcoming.map((p) => <PromiseRow key={p.id} item={p} />)
          )}
        </div>
      </section>
    </Shell>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-16" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

function RowSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
          <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-14" />
        </div>
      ))}
    </>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-[36px] font-semibold leading-none tracking-tight">{value}</div>
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

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-6 text-[13px] text-muted-foreground">
      <Sparkles className="h-3.5 w-3.5" /> {message}
    </div>
  );
}
