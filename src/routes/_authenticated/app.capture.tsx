import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Shell } from "@/components/nyvlo/Shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrowserRecorder, MEETING_TEMPLATES } from "@/components/nyvlo/BrowserRecorder";
import {
  listCaptureSessions,
  getCaptureSession,
  extractSessionPromises,
  deleteCaptureSession,
  getCaptureQuota,
  updateCaptureSessionNotes,
} from "@/lib/nyvlo/capture.functions";
import {
  Sparkles,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Clock,
  Search,
  Link2,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/capture")({
  validateSearch: (search: Record<string, unknown>) => ({
    session: typeof search.session === "string" ? search.session : undefined,
  }),
  component: CapturePage,
});

type CaptureSession = {
  id: string;
  label: string | null;
  status: string;
  started_at: string;
  duration_seconds: number | null;
  summary: string | null;
  notes_md: string | null;
  metadata: unknown;
};

type CaptureChunk = {
  id: string;
  sequence: number;
  started_at: string;
  speaker: string | null;
  transcript: string | null;
  status: string;
};

type CaptureFrame = {
  id: string;
  captured_at: string;
  app_name: string | null;
  window_title: string | null;
  vision_summary: string | null;
};

type CaptureAction = {
  id: string;
  summary: string;
  due_at: string | null;
  owed_to: string | null;
  draft_reply?: string | null;
};

type MeetingStatusFilter = "all" | "live" | "enhanced" | "needs_enhance";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getSessionMetadata(session: Pick<CaptureSession, "metadata">) {
  return session.metadata && typeof session.metadata === "object"
    ? (session.metadata as Record<string, unknown>)
    : {};
}

function getTemplateLabel(value: string | undefined) {
  return MEETING_TEMPLATES.find((item) => item.value === value)?.label ?? "General meeting";
}

function getManualNotes(session: Pick<CaptureSession, "metadata">) {
  const metadata = getSessionMetadata(session);
  return typeof metadata.manual_notes === "string" ? metadata.manual_notes : "";
}

function getTemplateValue(session: Pick<CaptureSession, "metadata">) {
  const metadata = getSessionMetadata(session);
  return typeof metadata.meeting_template === "string" ? metadata.meeting_template : "general";
}

function CapturePage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const fetchList = useServerFn(listCaptureSessions);
  const fetchQuota = useServerFn(getCaptureQuota);
  const list = useQuery({
    queryKey: ["capture-sessions"],
    queryFn: () => fetchList(),
    refetchInterval: 10_000,
  });
  const quota = useQuery({
    queryKey: ["capture-quota"],
    queryFn: () => fetchQuota(),
    refetchInterval: 30_000,
  });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MeetingStatusFilter>("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const sessions = (list.data ?? []) as CaptureSession[];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSessions = sessions.filter((session) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "live" && session.status === "active") ||
      (statusFilter === "enhanced" && Boolean(session.notes_md || session.summary)) ||
      (statusFilter === "needs_enhance" &&
        session.status !== "active" &&
        !session.notes_md &&
        !session.summary);
    const matchesTemplate =
      templateFilter === "all" || getTemplateValue(session) === templateFilter;
    const haystack = [
      session.label,
      session.summary,
      session.notes_md,
      getManualNotes(session),
      getTemplateLabel(getTemplateValue(session)),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchesStatus && matchesTemplate && matchesQuery;
  });
  const activeId =
    (search.session && sessions.some((session) => session.id === search.session)
      ? search.session
      : filteredSessions[0]?.id) ?? null;

  const qc = useQueryClient();
  const q = quota.data;
  const pctUsed = q && !q.is_pro ? Math.min(100, Math.round((q.used / q.limit) * 100)) : 0;
  const nearLimit = q && !q.is_pro && q.used >= q.limit * 0.7;

  return (
    <Shell
      title="Meeting notes"
      subtitle="Capture audio, jot what matters, and enhance it into private notes."
    >
      {q && !q.is_pro ? (
        <div
          className={`mb-4 flex items-center gap-4 rounded-lg border px-4 py-3 text-sm ${
            q.allowed
              ? "border-border bg-card/60"
              : "border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20"
          }`}
        >
          <div className="flex-1">
            <div className="font-medium">
              {q.allowed
                ? `${q.used} / ${q.limit} free meetings this month`
                : `You've used all ${q.limit} free meetings this month`}
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${q.allowed ? "bg-primary" : "bg-amber-500"}`}
                style={{ width: `${pctUsed}%` }}
              />
            </div>
            {nearLimit ? (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Free meetings are capped at 30 minutes each. Upgrade for unlimited history, system
                audio, and the desktop app.
              </p>
            ) : null}
          </div>
          <Link
            to="/pricing"
            className="rounded-md bg-foreground px-3 py-1.5 text-[12.5px] font-medium text-background hover:opacity-90"
          >
            Upgrade
          </Link>
        </div>
      ) : null}

      <div className="mb-6">
        <BrowserRecorder
          maxSeconds={q && !q.is_pro ? 30 * 60 : undefined}
          onSessionChange={(id) => {
            if (id) navigate({ to: "/app/capture", search: { session: id } });
            qc.invalidateQueries({ queryKey: ["capture-sessions"] });
            qc.invalidateQueries({ queryKey: ["capture-quota"] });
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="p-2">
          <div className="mb-1 px-2 pt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            Recent meetings
          </div>
          <div className="space-y-2 px-2 pb-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes"
                className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as MeetingStatusFilter)}
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="live">Live now</option>
              <option value="enhanced">Enhanced</option>
              <option value="needs_enhance">Needs enhancement</option>
            </select>
            <select
              value={templateFilter}
              onChange={(event) => setTemplateFilter(event.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All templates</option>
              {MEETING_TEMPLATES.map((template) => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>
          {list.isLoading && (
            <div className="px-2 py-3 text-sm text-muted-foreground">Loading...</div>
          )}
          {!list.isLoading && sessions.length === 0 && (
            <div className="px-2 py-4 text-[13px] leading-relaxed text-muted-foreground">
              No meetings yet. Start a notepad when your next call begins. Nyvlo keeps your rough
              notes, transcript, and enhanced summary together.
            </div>
          )}
          {!list.isLoading && sessions.length > 0 && filteredSessions.length === 0 && (
            <div className="px-2 py-4 text-[13px] leading-relaxed text-muted-foreground">
              No meetings match those filters.
            </div>
          )}
          <div className="space-y-0.5">
            {filteredSessions.map((s) => {
              const active = activeId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => navigate({ to: "/app/capture", search: { session: s.id } })}
                  className={[
                    "w-full rounded-md px-2.5 py-2 text-left text-[13px] transition-colors",
                    active
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    {s.status === "active" && (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                    )}
                    <span className="truncate font-medium">{s.label || "Untitled meeting"}</span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {new Date(s.started_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {s.duration_seconds
                      ? ` · ${Math.max(1, Math.round(s.duration_seconds / 60))}m`
                      : s.status === "active"
                        ? " · live"
                        : ""}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {activeId ? (
          <SessionDetail
            sessionId={activeId}
            onDelete={() => navigate({ to: "/app/capture", search: {} })}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </Shell>
  );
}

function EmptyState() {
  return (
    <Card className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="max-w-md">
        <h2 className="text-lg font-semibold">Nothing to show yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start a notepad above, jot a few bullets during the call, then let Nyvlo enhance them into
          structured notes, action items, and follow-ups.
        </p>
      </div>
    </Card>
  );
}

function SessionDetail({ sessionId, onDelete }: { sessionId: string; onDelete: () => void }) {
  const fetchSession = useServerFn(getCaptureSession);
  const extract = useServerFn(extractSessionPromises);
  const remove = useServerFn(deleteCaptureSession);
  const updateNotes = useServerFn(updateCaptureSessionNotes);
  const qc = useQueryClient();
  const [showRaw, setShowRaw] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualNotes, setManualNotes] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [template, setTemplate] = useState<(typeof MEETING_TEMPLATES)[number]["value"]>("general");

  const q = useQuery({
    queryKey: ["capture-session", sessionId],
    queryFn: () => fetchSession({ data: { sessionId } }),
    refetchInterval: 5_000,
  });

  const session = q.data?.session as CaptureSession | null | undefined;
  const chunks = (q.data?.chunks ?? []) as CaptureChunk[];
  const frames = (q.data?.frames ?? []) as CaptureFrame[];
  const promises = (q.data?.promises ?? []) as CaptureAction[];

  useEffect(() => {
    if (!session) return;
    const metadata =
      session.metadata && typeof session.metadata === "object"
        ? (session.metadata as Record<string, unknown>)
        : {};
    setManualNotes(typeof metadata.manual_notes === "string" ? metadata.manual_notes : "");
    setTemplate(
      typeof metadata.meeting_template === "string" &&
        MEETING_TEMPLATES.some((item) => item.value === metadata.meeting_template)
        ? metadata.meeting_template
        : "general",
    );
    setTitleDraft(session.label || "");
    // Hydrate editable fields only when switching sessions; polling refetches
    // should not overwrite rough notes while the user is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  if (!session) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  const saveContext = async ({ quiet = false }: { quiet?: boolean } = {}) => {
    setSaving(true);
    try {
      await updateNotes({
        data: {
          sessionId,
          manualNotes,
          template,
          label: titleDraft,
        },
      });
      qc.invalidateQueries({ queryKey: ["capture-session", sessionId] });
      qc.invalidateQueries({ queryKey: ["capture-sessions"] });
      if (!quiet) toast.success("Meeting notepad saved");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Couldn't save notes"));
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const onExtract = async () => {
    setExtracting(true);
    try {
      await saveContext({ quiet: true });
      const r = await extract({ data: { sessionId } });
      toast.success(
        r.inserted
          ? `${r.inserted} action item${r.inserted === 1 ? "" : "s"} captured`
          : "Enhanced notes regenerated",
      );
      qc.invalidateQueries({ queryKey: ["capture-session", sessionId] });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Couldn't regenerate notes"));
    } finally {
      setExtracting(false);
    }
  };

  const onDeleteClick = async () => {
    if (!confirm("Delete this meeting and all its data?")) return;
    await remove({ data: { sessionId } });
    qc.invalidateQueries({ queryKey: ["capture-sessions"] });
    onDelete();
  };

  const stillProcessing =
    session.status === "ended" && !session.notes_md && !session.summary && chunks.length > 0;
  const isLive = session.status === "active";
  const noContent = session.status === "ended" && chunks.length === 0 && frames.length === 0;
  const transcriptText = chunks
    .filter((chunk) => chunk.transcript)
    .map((chunk) => `[${chunk.speaker || "speaker"}] ${chunk.transcript}`)
    .join("\n");
  const markdownExport = [
    `# ${titleDraft || session.label || "Untitled meeting"}`,
    "",
    session.notes_md || session.summary || "",
    promises.length
      ? [
          "",
          "## Action items",
          ...promises.map(
            (promise) => `- ${promise.summary}${promise.due_at ? ` (${promise.due_at})` : ""}`,
          ),
        ].join("\n")
      : "",
    manualNotes ? ["", "## Rough notes", manualNotes].join("\n") : "",
    transcriptText ? ["", "## Transcript", transcriptText].join("\n") : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();

  const copyToClipboard = async (text: string, label: string) => {
    if (!text.trim()) {
      toast.message(`No ${label.toLowerCase()} to copy yet`);
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const copyMeetingLink = async () => {
    const url = new URL(window.location.href);
    url.pathname = "/app/capture";
    url.search = new URLSearchParams({ session: sessionId }).toString();
    await navigator.clipboard.writeText(url.toString());
    toast.success("Meeting link copied");
  };

  const downloadMarkdown = () => {
    if (!markdownExport) {
      toast.message("Nothing to export yet");
      return;
    }
    const slug = (titleDraft || session.label || "meeting")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const url = URL.createObjectURL(new Blob([markdownExport], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug || "meeting"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {session.label || "Untitled meeting"}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-[12.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {new Date(session.started_at).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {session.duration_seconds ? (
              <span>· {Math.max(1, Math.round(session.duration_seconds / 60))} min</span>
            ) : null}
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 text-destructive">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                Live
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExtract}
            disabled={extracting || isLive}
            title="Regenerate notes"
          >
            <Sparkles className={`h-3.5 w-3.5 ${extracting ? "animate-pulse" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => q.refetch()} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDeleteClick} title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <Card className="flex flex-wrap items-center gap-2 p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(markdownExport, "Meeting note")}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy note
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(transcriptText, "Transcript")}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy transcript
        </Button>
        <Button variant="outline" size="sm" onClick={copyMeetingLink}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" /> Copy link
        </Button>
        <Button variant="outline" size="sm" onClick={downloadMarkdown}>
          <FileDown className="mr-1.5 h-3.5 w-3.5" /> Export markdown
        </Button>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Your notepad</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              Write as much or as little as you want. Nyvlo uses these notes as the priority signal
              when it enhances the transcript.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => saveContext()} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" onClick={onExtract} disabled={extracting || isLive}>
              <Sparkles className={`mr-1.5 h-3.5 w-3.5 ${extracting ? "animate-pulse" : ""}`} />
              Enhance notes
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_210px]">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Title
            </label>
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Name this meeting"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as typeof template)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {MEETING_TEMPLATES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <textarea
          value={manualNotes}
          onChange={(e) => setManualNotes(e.target.value)}
          placeholder="- Customer cares about onboarding speed&#10;- Follow up with pricing details&#10;- Ask about current workflow"
          className="mt-3 min-h-[180px] w-full resize-y rounded-lg border border-border bg-background p-3 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Card>

      {/* Status banners */}
      {isLive && (
        <Card className="border-destructive/30 bg-destructive/[0.04] p-4 text-sm">
          Recording in progress. Keep adding rough notes; save before you stop for best results.
        </Card>
      )}
      {stillProcessing && (
        <Card className="border-border/60 p-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Enhancing your notes…
          </span>
        </Card>
      )}
      {noContent && (
        <Card className="border-border/60 p-4 text-sm text-muted-foreground">
          This session ended without any audio. You can still save rough notes here.
        </Card>
      )}

      {/* AI Notes — the headline content */}
      {session.notes_md ? (
        <Card className="p-6">
          <article className="nyvlo-notes max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.notes_md}</ReactMarkdown>
          </article>
        </Card>
      ) : session.summary ? (
        <Card className="p-5">
          <p className="text-[15px] leading-relaxed">{session.summary}</p>
        </Card>
      ) : null}

      {/* Action items */}
      {promises.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">
              Action items <span className="text-muted-foreground">({promises.length})</span>
            </h3>
            <Link
              to="/app/promises"
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-border/60">
            {promises.map((p) => (
              <ActionItem key={p.id} p={p} />
            ))}
          </ul>
        </Card>
      )}

      {/* Raw capture — collapsed by default */}
      {(chunks.length > 0 || frames.length > 0) && (
        <Card className="p-0">
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="inline-flex items-center gap-2">
              {showRaw ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Raw transcript & screen activity
              <span className="text-[11px] text-muted-foreground/70">
                ({chunks.length} clips · {frames.length} frames)
              </span>
            </span>
          </button>
          {showRaw && (
            <div className="grid gap-5 border-t border-border/60 p-5 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Transcript
                </h4>
                <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                  {chunks.length === 0 && (
                    <div className="text-sm text-muted-foreground">No audio.</div>
                  )}
                  {chunks.map((c) => (
                    <div key={c.id} className="text-[13px]">
                      <div className="text-[11px] text-muted-foreground">
                        {c.speaker || "speaker"} · {new Date(c.started_at).toLocaleTimeString()}
                        {c.status !== "done" && ` · ${c.status}`}
                      </div>
                      <div className="mt-0.5 leading-relaxed">{c.transcript || "…"}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Screen activity
                </h4>
                <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                  {frames.length === 0 && (
                    <div className="text-sm text-muted-foreground">No screen captures.</div>
                  )}
                  {frames.map((f) => (
                    <div key={f.id} className="text-[13px]">
                      <div className="text-[11px] text-muted-foreground">
                        {f.app_name || "App"}
                        {f.window_title && ` — ${f.window_title}`} ·{" "}
                        {new Date(f.captured_at).toLocaleTimeString()}
                      </div>
                      <div className="mt-0.5 leading-relaxed">{f.vision_summary || "…"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function ActionItem({ p }: { p: CaptureAction }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    if (!p.draft_reply) return;
    navigator.clipboard.writeText(p.draft_reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] leading-snug text-foreground">{p.summary}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
            {p.owed_to && p.owed_to !== "me" && <span>for {p.owed_to}</span>}
            {p.owed_to === "me" && <span>yours</span>}
            {p.due_at && <span>· due {new Date(p.due_at).toLocaleDateString()}</span>}
            {p.draft_reply && <span>· draft ready</span>}
          </div>
        </div>
        {p.draft_reply ? (
          open ? (
            <ChevronDown className="mt-1 h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="mt-1 h-3.5 w-3.5 text-muted-foreground" />
          )
        ) : null}
      </button>
      {open && p.draft_reply && (
        <div className="mt-2 ml-[18px] rounded-md border border-border/60 bg-muted/30 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              Draft
            </span>
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{p.draft_reply}</p>
        </div>
      )}
    </li>
  );
}
