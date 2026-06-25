import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, NotebookPen, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const MEETING_TEMPLATES = [
  { value: "general", label: "General meeting" },
  { value: "sales", label: "Sales / customer call" },
  { value: "discovery", label: "Product discovery" },
  { value: "interview", label: "Research interview" },
  { value: "one_on_one", label: "1:1" },
  { value: "planning", label: "Planning" },
] as const;

/**
 * Browser-based mic recorder fallback for meeting capture.
 * Records mic-only; the desktop app handles system audio capture.
 */
export function BrowserRecorder({
  onSessionChange,
  maxSeconds,
}: {
  onSessionChange?: (id: string | null) => void;
  maxSeconds?: number;
}) {
  const [state, setState] = useState<"idle" | "starting" | "recording" | "stopping">("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<(typeof MEETING_TEMPLATES)[number]["value"]>("general");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tokenRef = useRef<string | null>(null);
  const sequenceRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const chunkTimerRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);

  useEffect(() => () => cleanup(), []);

  const cleanup = () => {
    if (chunkTimerRef.current) window.clearInterval(chunkTimerRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);
    try {
      recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    streamRef.current = null;
    chunkTimerRef.current = null;
    tickRef.current = null;
  };

  const authHeader = async () => {
    if (!tokenRef.current) {
      const { data } = await supabase.auth.getSession();
      tokenRef.current = data.session?.access_token ?? null;
    }
    return tokenRef.current ? `Bearer ${tokenRef.current}` : "";
  };

  const fallbackLabel = useMemo(() => {
    const now = new Date();
    return `Meeting · ${now.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })} ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }, [state]);

  const start = async () => {
    setState("starting");
    stoppingRef.current = false;
    try {
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) =>
        MediaRecorder.isTypeSupported(m),
      );
      if (!mime) throw new Error("Browser can't record a supported audio format.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const auth = await authHeader();
      if (!auth) throw new Error("Not signed in.");

      const label = title.trim() || fallbackLabel;
      const res = await fetch("/api/public/ingest/session-start", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "browser",
          label,
          metadata: { meeting_template: template },
        }),
      });

      const j = await res.json();
      if (res.status === 402) {
        cleanup();
        setState("idle");
        toast.error(j.message || "Free-tier limit reached", {
          action: {
            label: "Upgrade",
            onClick: () => {
              window.location.href = "/pricing";
            },
          },
        });
        return;
      }
      if (!res.ok || !j.session?.id) throw new Error(j.error || "session-start failed");
      setSessionId(j.session.id);
      onSessionChange?.(j.session.id);

      sequenceRef.current = 0;
      let pending: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) pending.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start(1000);

      const flush = async () => {
        const currentRecorder = recorderRef.current;
        if (!currentRecorder || currentRecorder.state === "inactive") return;
        const chunks = pending;
        pending = [];
        const seq = sequenceRef.current++;
        const startedAt = new Date(Date.now() - 15_000).toISOString();
        const restart = () => {
          if (streamRef.current && !stoppingRef.current) {
            try {
              const r2 = new MediaRecorder(stream, { mimeType: mime });
              r2.ondataavailable = (e) => {
                if (e.data.size > 0) pending.push(e.data);
              };
              recorderRef.current = r2;
              r2.start(1000);
            } catch {}
          }
        };
        try {
          currentRecorder.stop();
        } catch {}
        await new Promise((r) => setTimeout(r, 150));
        const blob = new Blob(chunks, { type: mime });
        restart();
        if (blob.size < 2048) return;

        const fd = new FormData();
        const ext = mime.includes("mp4") ? "mp4" : "webm";
        fd.append("file", blob, `chunk-${seq}.${ext}`);
        fd.append("sessionId", j.session.id);
        fd.append("sequence", String(seq));
        fd.append("startedAt", startedAt);
        fd.append("speaker", "self");
        fd.append("sourceChannel", "mic");
        fd.append("durationMs", "15000");
        try {
          const up = await fetch("/api/public/ingest/audio-chunk", {
            method: "POST",
            headers: { Authorization: auth },
            body: fd,
          });
          if (!up.ok) {
            const t = await up.text().catch(() => "");
            toast.error(`Chunk ${seq} failed: ${up.status}`);
            console.error("chunk upload failed", up.status, t);
          }
        } catch (e) {
          toast.error(`Chunk ${seq} network error`);
          console.error(e);
        }
      };

      chunkTimerRef.current = window.setInterval(flush, 15_000);
      tickRef.current = window.setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (maxSeconds && next >= maxSeconds) {
            toast.message(`Free-tier capture limit reached (${Math.floor(maxSeconds / 60)} min). Stopping...`, {
              action: {
                label: "Upgrade",
                onClick: () => {
                  window.location.href = "/pricing";
                },
              },
            });
            queueMicrotask(() => stop());
          }
          return next;
        });
      }, 1000);
      setSeconds(0);
      setState("recording");
      toast.success("Meeting capture started. Jot rough notes while you listen.");
    } catch (e: any) {
      cleanup();
      setState("idle");
      toast.error(e.message ?? "Couldn't start recording");
    }
  };

  const stop = async () => {
    if (!sessionId) return;
    setState("stopping");
    stoppingRef.current = true;
    const auth = await authHeader();
    if (chunkTimerRef.current) {
      window.clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    try {
      recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      await fetch("/api/public/ingest/session-end", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      toast.success("Meeting ended. Enhancing notes now.");
    } catch {
      toast.error("Couldn't end session cleanly");
    }
    setSessionId(null);
    onSessionChange?.(null);
    setState("idle");
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {state === "recording" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
            <span className="font-mono text-sm tabular-nums">{mm}:{ss}</span>
            <span className="text-sm font-medium">{title.trim() || fallbackLabel}</span>
          </div>
          <span className="text-xs text-muted-foreground sm:ml-auto">mic capture · jot notes below</span>
          <Button size="sm" variant="outline" onClick={stop}>
            <Square className="mr-1.5 h-3.5 w-3.5" /> Stop & enhance
          </Button>
        </div>
      ) : state === "starting" || state === "stopping" ? (
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {state === "starting" ? "Starting your notepad..." : "Ending and enhancing..."}
          </span>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_180px_auto] lg:items-end">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Meeting title
            </label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <NotebookPen className="h-4 w-4 text-muted-foreground" />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Acme discovery call"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
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
          <Button onClick={start} className="h-10">
            <Mic className="mr-1.5 h-4 w-4" /> Start notepad
          </Button>
        </div>
      )}
    </div>
  );
}
