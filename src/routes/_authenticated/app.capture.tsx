import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Shell } from "@/components/nyvlo/Shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrowserRecorder } from "@/components/nyvlo/BrowserRecorder";
import {
  listCaptureSessions,
  getCaptureSession,
  extractSessionPromises,
  deleteCaptureSession,
} from "@/lib/nyvlo/capture.functions";
import { Mic, Monitor, Sparkles, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/app/capture")({
  component: CapturePage,
});

function CapturePage() {
  const fetchList = useServerFn(listCaptureSessions);
  const list = useQuery({
    queryKey: ["capture-sessions"],
    queryFn: () => fetchList(),
    refetchInterval: 10_000,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sessions = list.data ?? [];
  const activeId = selectedId ?? sessions[0]?.id ?? null;

  const qc = useQueryClient();
  return (
    <Shell title="Live Capture" subtitle="Meeting + screen sessions feeding the agent.">
      <div className="mb-6">
        <BrowserRecorder
          onSessionChange={(id) => {
            if (id) setSelectedId(id);
            qc.invalidateQueries({ queryKey: ["capture-sessions"] });
          }}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="p-3">
          <div className="mb-2 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            Sessions
          </div>
          {list.isLoading && (
            <div className="px-2 py-3 text-sm text-muted-foreground">Loading…</div>
          )}
          {!list.isLoading && sessions.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              No sessions yet. Start the desktop app and click <strong>Start capture</strong>.
            </div>
          )}
          <div className="space-y-0.5">
            {sessions.map((s: any) => {
              const active = activeId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
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
                    <span className="truncate font-medium">
                      {s.label || "Untitled session"}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {new Date(s.started_at).toLocaleString()} ·{" "}
                    {s.duration_seconds ? `${Math.round(s.duration_seconds / 60)}m` : s.status}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {activeId ? (
          <SessionDetail sessionId={activeId} onDelete={() => setSelectedId(null)} />
        ) : (
          <EmptyState />
        )}
      </div>
    </Shell>
  );
}

function EmptyState() {
  return (
    <Card className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex gap-3">
        <Mic className="h-8 w-8 text-muted-foreground" />
        <Monitor className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="max-w-md">
        <h2 className="text-lg font-semibold">Capture meetings + screen</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nyvlo's desktop app records your meetings (including the other person's voice via
          ScreenCaptureKit) and what's on your screen, then extracts promises and follow-ups
          automatically.
        </p>
      </div>
      <Link
        to="/app/settings"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Get the desktop app
      </Link>
    </Card>
  );
}

function SessionDetail({ sessionId, onDelete }: { sessionId: string; onDelete: () => void }) {
  const fetchSession = useServerFn(getCaptureSession);
  const extract = useServerFn(extractSessionPromises);
  const remove = useServerFn(deleteCaptureSession);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["capture-session", sessionId],
    queryFn: () => fetchSession({ data: { sessionId } }),
    refetchInterval: 5_000,
  });

  const session = q.data?.session;
  const chunks = q.data?.chunks ?? [];
  const frames = q.data?.frames ?? [];
  const promises = q.data?.promises ?? [];

  if (!session) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  const onExtract = async () => {
    try {
      const r = await extract({ data: { sessionId } });
      toast.success(`Extracted ${r.inserted} promise${r.inserted === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["capture-session", sessionId] });
    } catch (e: any) {
      toast.error(e.message ?? "Extraction failed");
    }
  };

  const onDeleteClick = async () => {
    if (!confirm("Delete this session and all its data?")) return;
    await remove({ data: { sessionId } });
    qc.invalidateQueries({ queryKey: ["capture-sessions"] });
    onDelete();
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{session.label || "Untitled session"}</h2>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {new Date(session.started_at).toLocaleString()}
              {session.ended_at && ` → ${new Date(session.ended_at).toLocaleTimeString()}`} ·{" "}
              {session.status}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExtract}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Extract promises
            </Button>
            <Button variant="ghost" size="sm" onClick={() => q.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDeleteClick}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
        {session.summary && (
          <p className="mt-4 rounded-md bg-muted/40 p-3 text-sm">{session.summary}</p>
        )}
      </Card>

      {promises.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium">Extracted promises ({promises.length})</h3>
          <ul className="space-y-2">
            {promises.map((p: any) => (
              <li key={p.id} className="rounded-md border border-border/60 bg-background/50 p-3">
                <div className="text-sm">{p.summary}</div>
                <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
                  {p.owed_to && <span>owner: {p.owed_to}</span>}
                  {p.due_at && <span>due: {new Date(p.due_at).toLocaleString()}</span>}
                  {p.confidence != null && <span>conf: {Math.round(p.confidence * 100)}%</span>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Mic className="h-3.5 w-3.5" /> Transcript ({chunks.length})
          </h3>
          <div className="max-h-[500px] space-y-2 overflow-auto">
            {chunks.length === 0 && (
              <div className="text-sm text-muted-foreground">Waiting for audio…</div>
            )}
            {chunks.map((c: any) => (
              <div key={c.id} className="text-[13px]">
                <div className="text-[11px] text-muted-foreground">
                  {c.speaker || "speaker"} · {new Date(c.started_at).toLocaleTimeString()}
                  {c.status !== "done" && ` · ${c.status}`}
                </div>
                <div className="mt-0.5">{c.transcript || "…"}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Monitor className="h-3.5 w-3.5" /> Screen activity ({frames.length})
          </h3>
          <div className="max-h-[500px] space-y-2 overflow-auto">
            {frames.length === 0 && (
              <div className="text-sm text-muted-foreground">No screen captures yet.</div>
            )}
            {frames.map((f: any) => (
              <div key={f.id} className="text-[13px]">
                <div className="text-[11px] text-muted-foreground">
                  {f.app_name || "App"}
                  {f.window_title && ` — ${f.window_title}`} ·{" "}
                  {new Date(f.captured_at).toLocaleTimeString()}
                </div>
                <div className="mt-0.5">{f.vision_summary || "…"}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
