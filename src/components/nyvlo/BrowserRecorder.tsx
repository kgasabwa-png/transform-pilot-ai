import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Browser-based mic recorder fallback for Live Capture.
 * Records mic-only (the Swift sidecar handles system audio); useful for demo
 * and for users without the desktop app.
 *
 * Chunks every 15s, POSTs each chunk to /api/public/ingest/audio-chunk
 * with the user's Supabase access token.
 */
export function BrowserRecorder({ onSessionChange }: { onSessionChange?: (id: string | null) => void }) {
  const [state, setState] = useState<"idle" | "starting" | "recording" | "stopping">("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tokenRef = useRef<string | null>(null);
  const sequenceRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const chunkTimerRef = useRef<number | null>(null);

  useEffect(() => () => cleanup(), []);

  const cleanup = () => {
    if (chunkTimerRef.current) window.clearInterval(chunkTimerRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);
    try { recorderRef.current?.state !== "inactive" && recorderRef.current?.stop(); } catch {}
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

  const start = async () => {
    setState("starting");
    try {
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      if (!mime) throw new Error("Browser can't record a supported audio format.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const auth = await authHeader();
      if (!auth) throw new Error("Not signed in.");

      const res = await fetch("/api/public/ingest/session-start", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ source: "browser", label: `Browser capture — ${new Date().toLocaleTimeString()}` }),
      });
      const j = await res.json();
      if (!res.ok || !j.session?.id) throw new Error(j.error || "session-start failed");
      setSessionId(j.session.id);
      onSessionChange?.(j.session.id);

      sequenceRef.current = 0;
      let pending: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) pending.push(e.data); };
      recorderRef.current = recorder;
      recorder.start(1000); // collect dataavailable every 1s

      // Every 15s: stop, flush, upload, restart.
      const flush = async () => {
        if (recorder.state === "inactive") return;
        const chunks = pending;
        pending = [];
        const seq = sequenceRef.current++;
        const startedAt = new Date(Date.now() - 15_000).toISOString();
        // Rotate the recorder so we get a self-contained webm container per chunk
        const restart = () => {
          if (streamRef.current && state !== "stopping") {
            try {
              const r2 = new MediaRecorder(stream, { mimeType: mime });
              r2.ondataavailable = (e) => { if (e.data.size > 0) pending.push(e.data); };
              recorderRef.current = r2;
              r2.start(1000);
            } catch {}
          }
        };
        try { recorder.stop(); } catch {}
        // Wait briefly for last dataavailable
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
        } catch (e: any) {
          toast.error(`Chunk ${seq} network error`);
          console.error(e);
        }
      };

      chunkTimerRef.current = window.setInterval(flush, 15_000);
      tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      setSeconds(0);
      setState("recording");
      toast.success("Recording — mic only. System audio needs the desktop app.");
    } catch (e: any) {
      cleanup();
      setState("idle");
      toast.error(e.message ?? "Couldn't start recording");
    }
  };

  const stop = async () => {
    if (!sessionId) return;
    setState("stopping");
    const auth = await authHeader();
    // Final flush
    if (chunkTimerRef.current) { window.clearInterval(chunkTimerRef.current); chunkTimerRef.current = null; }
    if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    try { recorderRef.current?.state !== "inactive" && recorderRef.current?.stop(); } catch {}
    await new Promise((r) => setTimeout(r, 250));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      await fetch("/api/public/ingest/session-end", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      toast.success("Session ended — extracting promises…");
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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      {state === "recording" ? (
        <>
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          <span className="font-mono text-sm tabular-nums">{mm}:{ss}</span>
          <span className="text-xs text-muted-foreground">mic · browser fallback</span>
          <Button size="sm" variant="outline" onClick={stop} className="ml-auto">
            <Square className="mr-1.5 h-3.5 w-3.5" /> Stop & extract
          </Button>
        </>
      ) : state === "starting" || state === "stopping" ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{state === "starting" ? "Starting…" : "Ending…"}</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <div className="font-medium">Quick capture (browser)</div>
            <div className="text-[11px] text-muted-foreground">Mic only — for system audio install the desktop app.</div>
          </div>
          <Button size="sm" onClick={start} className="ml-auto">
            Start recording
          </Button>
        </>
      )}
    </div>
  );
}
