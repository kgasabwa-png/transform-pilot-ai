import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  ListChecks,
  Loader2,
  MapPin,
  MessageSquareText,
  NotebookPen,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { Shell } from "@/components/nyvlo/Shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listPromises } from "@/lib/nyvlo/data.functions";
import { listCaptureSessions, getCaptureQuota } from "@/lib/nyvlo/capture.functions";
import { listMeetingBriefs } from "@/lib/nyvlo/briefs.functions";
import { getProfile } from "@/lib/nyvlo/profile.functions";
import { runSyncNow } from "@/lib/nyvlo/google.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Meetings · Nyvlo" }] }),
  component: MeetingsHome,
});

type MeetingSession = {
  id: string;
  label: string | null;
  status: string;
  started_at: string;
  duration_seconds: number | null;
  summary: string | null;
  notes_md: string | null;
  metadata: unknown;
};

type ActionItem = {
  id: string;
  summary: string;
  status: string;
  due_at: string | null;
};

type MeetingBrief = {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  join_url: string | null;
  event_url: string | null;
  description: string | null;
  participants: string[];
  related_notes: Array<{
    id: string;
    title: string;
    summary: string | null;
    started_at: string;
  }>;
  related_actions: Array<{
    id: string;
    summary: string;
    due_at: string | null;
    owed_to: string | null;
  }>;
};

function MeetingsHome() {
  const queryClient = useQueryClient();
  const fetchSessions = useServerFn(listCaptureSessions);
  const fetchPromises = useServerFn(listPromises);
  const fetchProfile = useServerFn(getProfile);
  const fetchQuota = useServerFn(getCaptureQuota);
  const fetchBriefs = useServerFn(listMeetingBriefs);
  const syncNow = useServerFn(runSyncNow);
  const [syncing, setSyncing] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ["capture-sessions"],
    queryFn: () => fetchSessions(),
    refetchInterval: 15_000,
  });
  const promisesQuery = useQuery({
    queryKey: ["promises"],
    queryFn: () => fetchPromises(),
  });
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });
  const quotaQuery = useQuery({
    queryKey: ["capture-quota"],
    queryFn: () => fetchQuota(),
  });
  const briefsQuery = useQuery({
    queryKey: ["meeting-briefs"],
    queryFn: () => fetchBriefs(),
  });

  const sessions = (sessionsQuery.data ?? []) as MeetingSession[];
  const actions = ((promisesQuery.data ?? []) as ActionItem[])
    .filter((p) => p.status === "open")
    .slice(0, 4);
  const notesReady = sessions.filter((s) => Boolean(s.notes_md || s.summary));
  const liveSession = sessions.find((s) => s.status === "active");
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const notesThisWeek = sessions.filter(
    (s) => new Date(s.started_at).getTime() >= oneWeekAgo,
  ).length;
  const name = profileQuery.data?.profile?.full_name?.split(" ")[0] ?? "there";
  const isConnected = Boolean(profileQuery.data?.connection);
  const quota = quotaQuery.data;
  const briefs = (briefsQuery.data ?? []) as MeetingBrief[];

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncNow();
      toast.success(`Calendar synced: ${result.synced} events`);
      queryClient.invalidateQueries({ queryKey: ["meeting-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["promises"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Calendar sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Shell title={`Hi ${name}.`} subtitle="Your private AI meeting notebook.">
      <section className="mb-8 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Notes, actions, and memory
              </div>
              <h2 className="text-balance text-[30px] font-semibold leading-tight tracking-tight md:text-[42px]">
                Capture the meeting. Keep your judgment in the notes.
              </h2>
              <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
                Start a notepad, jot the moments that matter, and Nyvlo enhances your rough notes
                with the transcript when the meeting ends.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/app/capture"
                  className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:opacity-90"
                >
                  Start next notepad <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/app/command"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-[13px] font-medium hover:bg-muted"
                >
                  <MessageSquareText className="h-3.5 w-3.5" /> Ask across notes
                </Link>
              </div>
            </div>
            <div className="min-w-[220px] rounded-xl border border-border bg-secondary/35 p-4">
              <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Private by default
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                Nyvlo does not join your meeting. Browser capture uses your mic; desktop capture can
                add system audio.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniStat label="Notes" value={String(sessions.length)} />
                <MiniStat label="This week" value={String(notesThisWeek)} />
              </div>
            </div>
          </div>
        </Card>

        <MeetingBriefsCard
          connected={isConnected}
          briefs={briefs}
          loading={briefsQuery.isLoading}
          syncing={syncing}
          onSync={handleSync}
          quota={quota}
        />
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatTile
          icon={NotebookPen}
          label="Meeting notes"
          value={String(sessions.length)}
          hint="captured in Nyvlo"
        />
        <StatTile
          icon={FileText}
          label="Enhanced"
          value={String(notesReady.length)}
          hint="ready to search and share"
        />
        <StatTile
          icon={ListChecks}
          label="Open actions"
          value={String(actions.length)}
          hint="from your conversations"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <SectionHeader
            title="Recent notes"
            link={{ to: "/app/capture", label: "Open notebook" }}
          />
          <div className="space-y-2">
            {sessionsQuery.isLoading ? (
              <CardSkeletons count={4} />
            ) : sessions.length === 0 ? (
              <EmptyCard
                icon={NotebookPen}
                title="No notes yet"
                body="Start your first notepad from the capture page. Your rough notes and enhanced summary will appear here."
                cta={{ to: "/app/capture", label: "Start a note" }}
              />
            ) : (
              sessions
                .slice(0, 6)
                .map((session) => (
                  <MeetingRow
                    key={session.id}
                    session={session}
                    live={liveSession?.id === session.id}
                  />
                ))
            )}
          </div>
        </div>

        <aside>
          <SectionHeader title="Action items" link={{ to: "/app/promises", label: "View all" }} />
          <Card className="p-4">
            {promisesQuery.isLoading ? (
              <CardSkeletons count={3} compact />
            ) : actions.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-muted-foreground">
                Action items extracted from meetings will show up here.
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {actions.map((action) => (
                  <li key={action.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="text-[13px] font-medium leading-snug">{action.summary}</div>
                    <div className="mt-1 text-[11.5px] text-muted-foreground">
                      {action.due_at
                        ? `Due ${new Date(action.due_at).toLocaleDateString()}`
                        : "No due date"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </section>
    </Shell>
  );
}

function MeetingBriefsCard({
  connected,
  briefs,
  loading,
  syncing,
  onSync,
  quota,
}: {
  connected: boolean;
  briefs: MeetingBrief[];
  loading: boolean;
  syncing: boolean;
  onSync: () => void;
  quota:
    | {
        is_pro: boolean;
        used: number;
        limit: number;
      }
    | undefined;
}) {
  const nextBrief = briefs[0];
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Brief before you meet</h3>
        </div>
        {connected ? (
          <button
            onClick={onSync}
            disabled={syncing}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Sync
          </button>
        ) : null}
      </div>

      {!connected ? (
        <>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Connect Google Calendar to prep context before external meetings and name notes
            automatically.
          </p>
          <Link
            to="/app/settings"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground"
          >
            <PlugZap className="h-3.5 w-3.5" /> Connect calendar
          </Link>
        </>
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ) : nextBrief ? (
        <div>
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{nextBrief.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                  {nextBrief.starts_at ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(nextBrief.starts_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                  {nextBrief.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {nextBrief.location}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {nextBrief.join_url ? (
                  <a
                    href={nextBrief.join_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted"
                  >
                    <Video className="h-3 w-3" /> Join
                  </a>
                ) : null}
                {nextBrief.event_url ? (
                  <a
                    href={nextBrief.event_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-border p-1.5 hover:bg-muted"
                    aria-label="Open calendar event"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>

            {nextBrief.participants.length > 0 ? (
              <div className="mt-3 flex items-start gap-2 text-[12px] text-muted-foreground">
                <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">
                  {nextBrief.participants.slice(0, 5).join(", ")}
                </span>
              </div>
            ) : null}

            {nextBrief.description ? (
              <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
                {nextBrief.description}
              </p>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            <BriefContextList
              title="Previous context"
              empty="No related notes found yet."
              items={nextBrief.related_notes.map((note) => ({
                key: note.id,
                title: note.title,
                body: note.summary || new Date(note.started_at).toLocaleDateString(),
                to: { session: note.id },
              }))}
            />
            <BriefContextList
              title="Open follow-ups"
              empty="No matching open actions."
              items={nextBrief.related_actions.map((action) => ({
                key: action.id,
                title: action.summary,
                body: action.due_at
                  ? `Due ${new Date(action.due_at).toLocaleDateString()}`
                  : "No due date",
              }))}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-[13px] leading-relaxed text-muted-foreground">
          No upcoming synced events yet. Run sync after connecting Google Calendar to pull in the
          next two weeks.
        </div>
      )}

      {quota && !quota.is_pro ? (
        <div className="mt-5 rounded-lg border border-border bg-background p-3 text-[12px] text-muted-foreground">
          {quota.used} / {quota.limit} free meetings used this month.
        </div>
      ) : null}
    </Card>
  );
}

function BriefContextList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ key: string; title: string; body: string; to?: { session: string } }>;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-[12px] text-muted-foreground">{empty}</div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) =>
            item.to ? (
              <Link
                key={item.key}
                to="/app/capture"
                search={item.to}
                className="block rounded-md border border-border bg-background px-2.5 py-2 hover:bg-muted"
              >
                <BriefContextText title={item.title} body={item.body} />
              </Link>
            ) : (
              <div
                key={item.key}
                className="rounded-md border border-border bg-background px-2.5 py-2"
              >
                <BriefContextText title={item.title} body={item.body} />
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function BriefContextText({ title, body }: { title: string; body: string }) {
  return (
    <>
      <div className="line-clamp-1 text-[12.5px] font-medium">{title}</div>
      <div className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">{body}</div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof NotebookPen;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-[34px] font-semibold leading-none tracking-tight">{value}</div>
      <div className="mt-2 text-[12px] text-muted-foreground">{hint}</div>
    </Card>
  );
}

function MeetingRow({ session, live }: { session: MeetingSession; live: boolean }) {
  const metadata = session.metadata && typeof session.metadata === "object" ? session.metadata : {};
  const template =
    typeof metadata.meeting_template === "string"
      ? metadata.meeting_template.replaceAll("_", " ")
      : "general";
  return (
    <Link
      to="/app/capture"
      search={{ session: session.id }}
      className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {live ? (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
            ) : null}
            <h3 className="truncate text-[14px] font-semibold">
              {session.label || "Untitled meeting"}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
            {session.summary ||
              (session.notes_md
                ? "Enhanced notes are ready."
                : "Transcript captured. Enhance notes when ready.")}
          </p>
        </div>
        <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(session.started_at).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
        {session.duration_seconds ? (
          <span>{Math.max(1, Math.round(session.duration_seconds / 60))} min</span>
        ) : null}
        <span className="capitalize">{template}</span>
        {session.notes_md ? <span className="text-primary">enhanced</span> : null}
      </div>
    </Link>
  );
}

function SectionHeader({ title, link }: { title: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h2>
      {link ? (
        <Link
          to={link.to}
          className="inline-flex items-center gap-1 text-[12px] text-foreground/70 hover:text-foreground"
        >
          {link.label} <ArrowRight className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}

function EmptyCard({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: typeof NotebookPen;
  title: string;
  body: string;
  cta: { to: string; label: string };
}) {
  return (
    <Card className="flex flex-col items-center justify-center p-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      <Link
        to={cta.to}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background hover:opacity-90"
      >
        {cta.label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}

function CardSkeletons({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className={compact ? "p-3" : "p-4"}>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </Card>
      ))}
    </>
  );
}
