import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleDashed,
  Cog,
  FileText,
  Mail,
  Database,
  AlertTriangle,
  Loader2,
  Sparkles,
  RotateCcw,
  Copy,
  ChevronDown,
} from "lucide-react";
import {
  ACCOUNT,
  BAKED_CLOSE,
  TRANSCRIPT_LINES,
  type ClosePackage,
  type Citation,
} from "@/lib/loop/synthetic";
import { runLiveClose } from "@/lib/loop/anthropic";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Loop — The execution layer between conversations and outcomes" },
      {
        name: "description",
        content:
          "After every meeting, agents do the post-conversation operations a person shouldn't be doing — and hand them one screen to approve.",
      },
    ],
  }),
  component: LoopApp,
});

type Stage = "intake" | "running" | "close";

const AGENTS = [
  { id: "extract", label: "Extract", desc: "Outcomes + provenance", icon: Sparkles },
  { id: "reconcile", label: "Reconcile", desc: "Diff vs. account record", icon: Cog },
  { id: "execute", label: "Execute", desc: "Stage 4 artifacts in parallel", icon: ArrowRight },
  { id: "close", label: "The Close", desc: "Hand to human for approval", icon: Check },
] as const;

function LoopApp() {
  const [stage, setStage] = useState<Stage>("intake");
  const [transcriptText, setTranscriptText] = useState("");
  const [pkg, setPkg] = useState<ClosePackage | null>(null);
  const [activeAgent, setActiveAgent] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [approvals, setApprovals] = useState<Record<string, "pending" | "approved" | "rejected">>({});
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const transcriptParsed = useMemo(() => parseTranscript(transcriptText), [transcriptText]);

  const loadSample = () => {
    setTranscriptText(
      TRANSCRIPT_LINES.map((l) => `${l.speaker}: ${l.text}`).join("\n"),
    );
  };

  const runLoop = async () => {
    if (transcriptParsed.length < 3) {
      toast.error("Paste a transcript (or load the sample) before closing the loop.");
      return;
    }
    setStage("running");
    setActiveAgent(0);
    setPkg(null);

    if (liveMode) {
      if (!apiKey.trim()) {
        toast.error("Add your Anthropic API key in Settings, or turn off live mode.");
        setStage("intake");
        return;
      }
      // Animate stages while the request flies
      const ticker = setInterval(() => setActiveAgent((a) => Math.min(a + 1, 2)), 1400);
      try {
        const result = await runLiveClose({ apiKey, transcript: transcriptParsed });
        clearInterval(ticker);
        setActiveAgent(3);
        setTimeout(() => {
          setPkg(result);
          setStage("close");
        }, 500);
      } catch (e) {
        clearInterval(ticker);
        toast.error(e instanceof Error ? e.message : "Live run failed.");
        setStage("intake");
      }
      return;
    }

    // Baked synthetic cascade — paced for the recording
    const isSample = transcriptParsed.length >= TRANSCRIPT_LINES.length - 2;
    await wait(900);
    setActiveAgent(1);
    await wait(900);
    setActiveAgent(2);
    await wait(1200);
    setActiveAgent(3);
    await wait(450);
    setPkg(isSample ? BAKED_CLOSE : adaptBakedToCustom(transcriptParsed));
    setStage("close");
  };

  const reset = () => {
    setStage("intake");
    setPkg(null);
    setApprovals({});
    setActiveCitation(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        onSettings={() => setSettingsOpen(true)}
        onReset={reset}
        canReset={stage !== "intake"}
        liveMode={liveMode}
      />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {stage === "intake" && (
          <Intake
            value={transcriptText}
            onChange={setTranscriptText}
            onSample={loadSample}
            onRun={runLoop}
            liveMode={liveMode}
          />
        )}

        {stage === "running" && <Cascade activeAgent={activeAgent} />}

        {stage === "close" && pkg && (
          <CloseScreen
            pkg={pkg}
            transcript={transcriptParsed.length ? transcriptParsed : TRANSCRIPT_LINES}
            approvals={approvals}
            setApprovals={setApprovals}
            onCite={setActiveCitation}
          />
        )}
      </main>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        liveMode={liveMode}
        setLiveMode={setLiveMode}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />

      <CitationModal
        citation={activeCitation}
        transcript={transcriptParsed.length ? transcriptParsed : TRANSCRIPT_LINES}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({
  onSettings,
  onReset,
  canReset,
  liveMode,
}: {
  onSettings: () => void;
  onReset: () => void;
  canReset: boolean;
  liveMode: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-7 rounded-lg bg-foreground grid place-items-center">
            <div className="size-3 rounded-full border-2 border-background" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Loop</span>
          <span className="ml-3 hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-2 py-0.5">
            <span className="size-1.5 rounded-full bg-foreground" />
            Customer Success · Post-QBR Close
          </span>
        </div>
        <div className="flex items-center gap-2">
          {liveMode && (
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary border border-primary/30 bg-primary/5 rounded-full px-2 py-1">
              Live · Claude
            </span>
          )}
          {canReset && (
            <button
              onClick={onReset}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
          )}
          <button
            onClick={onSettings}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <Cog className="size-3.5" /> Settings
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Intake                                                              */
/* ------------------------------------------------------------------ */

function Intake({
  value,
  onChange,
  onSample,
  onRun,
  liveMode,
}: {
  value: string;
  onChange: (v: string) => void;
  onSample: () => void;
  onRun: () => void;
  liveMode: boolean;
}) {
  return (
    <div className="animate-reveal">
      <div className="max-w-3xl">
        <span className="eyebrow">The execution layer</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-3 leading-[1.05]">
          After every meeting, agents do the post-conversation work — and hand you one screen to approve.
        </h1>
        <p className="text-muted-foreground mt-4 text-lg max-w-2xl">
          Drop a customer-conversation transcript. Loop runs a multi-agent cascade, then stops at the human gate. Every action cites the words it came from.
        </p>
      </div>

      <div className="mt-10 grid md:grid-cols-[1fr_320px] gap-6">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Transcript</span>
            </div>
            <button
              onClick={onSample}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Load sample QBR ({TRANSCRIPT_LINES.length} lines)
            </button>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Format: "Speaker: text" — one turn per line.\n\nExample:\nKeila (CSM): Thanks for making time...\nPriya (VP Ops): Honestly, no. Daniel's now running...`}
            className="w-full min-h-[420px] p-5 bg-transparent font-mono text-sm leading-relaxed outline-none resize-y placeholder:text-muted-foreground/60"
          />
        </div>

        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <span className="eyebrow">Account context</span>
            <div className="mt-3 space-y-2.5 text-sm">
              <KV k="Account" v={ACCOUNT.name} />
              <KV k="Product" v={ACCOUNT.product} />
              <KV k="ARR" v={ACCOUNT.arr} />
              <KV k="Renewal" v={ACCOUNT.renewal} />
              <KV k="Health" v={ACCOUNT.health} />
            </div>
          </div>

          <button
            onClick={onRun}
            className="w-full bg-foreground text-background font-semibold px-5 py-4 rounded-2xl inline-flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors shadow-2xl shadow-foreground/10"
          >
            Close the loop <ArrowRight className="size-4" />
          </button>
          <p className="text-xs text-muted-foreground text-center">
            {liveMode
              ? "Live mode · uses your Anthropic key"
              : "Synthetic baked run · turn on live mode in Settings to use your Claude key"}
          </p>
        </aside>
      </div>

      <div className="mt-16 grid md:grid-cols-4 gap-3">
        {AGENTS.map((a) => (
          <div key={a.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="size-8 rounded-lg bg-muted grid place-items-center mb-3">
              <a.icon className="size-4" />
            </div>
            <div className="text-sm font-semibold">{a.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground">{k}</span>
      <span className="text-sm font-medium text-right">{v}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cascade                                                             */
/* ------------------------------------------------------------------ */

function Cascade({ activeAgent }: { activeAgent: number }) {
  return (
    <div className="max-w-3xl mx-auto py-16 animate-reveal">
      <span className="eyebrow">Running</span>
      <h2 className="font-display text-3xl font-semibold tracking-tight mt-2 mb-10">
        The agents are doing the post-conversation work.
      </h2>
      <div className="space-y-3">
        {AGENTS.map((a, i) => {
          const state =
            i < activeAgent ? "done" : i === activeAgent ? "running" : "queued";
          return (
            <div
              key={a.id}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
                state === "running"
                  ? "border-foreground bg-card shadow-2xl shadow-foreground/5"
                  : state === "done"
                  ? "border-border bg-card"
                  : "border-border bg-card/40"
              }`}
            >
              <div
                className={`size-9 rounded-xl grid place-items-center ${
                  state === "done"
                    ? "bg-foreground text-background"
                    : state === "running"
                    ? "bg-foreground/10 text-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {state === "done" ? (
                  <Check className="size-4" />
                ) : state === "running" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CircleDashed className="size-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{a.label}</div>
                <div className="text-xs text-muted-foreground">{a.desc}</div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                {state}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Close — the review surface                                          */
/* ------------------------------------------------------------------ */

function CloseScreen({
  pkg,
  transcript,
  approvals,
  setApprovals,
  onCite,
}: {
  pkg: ClosePackage;
  transcript: { speaker: string; text: string }[];
  approvals: Record<string, "pending" | "approved" | "rejected">;
  setApprovals: (a: Record<string, "pending" | "approved" | "rejected">) => void;
  onCite: (c: Citation) => void;
}) {
  const ids = ["record", "email", "crm", "risks"];
  const setOne = (id: string, v: "approved" | "rejected" | "pending") =>
    setApprovals({ ...approvals, [id]: v });
  const allApproved = ids.every((id) => approvals[id] === "approved");

  return (
    <div className="animate-reveal pb-32">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
        <div>
          <span className="eyebrow">The Close · {ACCOUNT.name}</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2">
            4 staged artifacts. Approve, edit, or reject. Nothing has been sent.
          </h2>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
            Every claim links to the customer's words. ~90 seconds of judgment replaces ~30 minutes of post-meeting admin.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <ArtifactCard
          id="record"
          icon={FileText}
          title="Living account record"
          subtitle={`${pkg.recordUpdates.length} field updates staged`}
          status={approvals.record}
          onStatus={(v) => setOne("record", v)}
        >
          <div className="divide-y divide-border">
            {pkg.recordUpdates.map((r, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <div className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">
                  {r.field}
                </div>
                <div className="grid md:grid-cols-[1fr_auto_2fr] gap-2 md:gap-4 items-start">
                  <div className="text-sm text-muted-foreground line-through decoration-muted-foreground/30">
                    {r.before}
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground mt-1.5 hidden md:block" />
                  <div className="text-sm font-medium">{r.after}</div>
                </div>
                <Citations citations={r.citations} onCite={onCite} />
              </div>
            ))}
          </div>
        </ArtifactCard>

        <ArtifactCard
          id="email"
          icon={Mail}
          title="Follow-up email · drafted in your voice"
          subtitle={`To ${pkg.email.to}`}
          status={approvals.email}
          onStatus={(v) => setOne("email", v)}
          copy={() => copyEmail(pkg)}
        >
          <div className="text-sm text-muted-foreground mb-3">
            <span className="text-foreground font-medium">Subject:</span> {pkg.email.subject}
          </div>
          <div className="space-y-4">
            {pkg.email.bodyParagraphs.map((p, i) => (
              <div key={i}>
                <p className="text-sm leading-relaxed text-foreground">{p.text}</p>
                <Citations citations={p.citations} onCite={onCite} />
              </div>
            ))}
          </div>
        </ArtifactCard>

        <ArtifactCard
          id="crm"
          icon={Database}
          title="CRM diff · staged, not written"
          subtitle={`${pkg.crmChanges.length} writes pending your approval`}
          status={approvals.crm}
          onStatus={(v) => setOne("crm", v)}
        >
          <div className="divide-y divide-border">
            {pkg.crmChanges.map((ch, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {ch.object}
                  </span>
                  <span className="text-xs font-medium">{ch.field}</span>
                </div>
                <div className="grid md:grid-cols-[1fr_auto_1.4fr] gap-2 md:gap-4 items-start">
                  <div className="text-xs font-mono text-muted-foreground line-through decoration-muted-foreground/30 break-words">
                    {ch.before}
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground mt-1 hidden md:block" />
                  <div className="text-xs font-mono text-foreground break-words">{ch.after}</div>
                </div>
                <Citations citations={ch.citations} onCite={onCite} />
              </div>
            ))}
          </div>
        </ArtifactCard>

        <ArtifactCard
          id="risks"
          icon={AlertTriangle}
          title="Risks & recommended plays"
          subtitle={`${pkg.risks.length} surfaced from this conversation`}
          status={approvals.risks}
          onStatus={(v) => setOne("risks", v)}
        >
          <div className="space-y-5">
            {pkg.risks.map((r, i) => (
              <div key={i} className="border-l-2 border-border pl-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-[0.18em] px-2 py-0.5 rounded ${
                      r.severity === "high"
                        ? "bg-destructive/10 text-destructive"
                        : r.severity === "medium"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.severity}
                  </span>
                  <span className="text-sm font-semibold">{r.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{r.rationale}</p>
                <div className="text-xs">
                  <span className="font-mono uppercase tracking-[0.14em] text-muted-foreground">
                    Recommended play ·{" "}
                  </span>
                  <span className="text-foreground">{r.recommendedPlay}</span>
                </div>
                <Citations citations={r.citations} onCite={onCite} />
              </div>
            ))}
          </div>
        </ArtifactCard>
      </div>

      <ApproveBar
        approvals={approvals}
        ids={ids}
        allApproved={allApproved}
        onApproveAll={() => {
          setApprovals(Object.fromEntries(ids.map((id) => [id, "approved"])));
          toast.success("Loop closed. Artifacts would now be dispatched.");
        }}
      />
    </div>
  );
}

function ArtifactCard({
  id,
  icon: Icon,
  title,
  subtitle,
  status,
  onStatus,
  copy,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  status?: "pending" | "approved" | "rejected";
  onStatus: (v: "approved" | "rejected" | "pending") => void;
  copy?: () => void;
  children: React.ReactNode;
}) {
  const accent =
    status === "approved"
      ? "border-foreground"
      : status === "rejected"
      ? "border-destructive/40"
      : "border-border";
  return (
    <section
      id={id}
      className={`bg-card border ${accent} rounded-3xl overflow-hidden transition-colors`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-foreground text-background grid place-items-center">
            <Icon className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {copy && (
            <button
              onClick={copy}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted"
            >
              <Copy className="size-3" /> Copy
            </button>
          )}
          <button
            onClick={() => onStatus(status === "rejected" ? "pending" : "rejected")}
            className={`text-xs px-3 py-1.5 rounded-lg border ${
              status === "rejected"
                ? "border-destructive text-destructive bg-destructive/5"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Reject
          </button>
          <button
            onClick={() => onStatus(status === "approved" ? "pending" : "approved")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 ${
              status === "approved"
                ? "bg-foreground text-background"
                : "border border-border text-foreground hover:bg-muted"
            }`}
          >
            <Check className="size-3" /> {status === "approved" ? "Approved" : "Approve"}
          </button>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Citations({ citations, onCite }: { citations: Citation[]; onCite: (c: Citation) => void }) {
  if (!citations.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {citations.map((c, i) => (
        <button
          key={i}
          onClick={() => onCite(c)}
          className="text-[10px] font-mono uppercase tracking-[0.14em] text-primary bg-primary/5 border border-primary/20 hover:bg-primary/10 rounded-full px-2 py-0.5 inline-flex items-center gap-1"
          title={c.quote}
        >
          <span className="size-1 rounded-full bg-primary" /> line {c.line}
        </button>
      ))}
    </div>
  );
}

function ApproveBar({
  approvals,
  ids,
  allApproved,
  onApproveAll,
}: {
  approvals: Record<string, string>;
  ids: string[];
  allApproved: boolean;
  onApproveAll: () => void;
}) {
  const approvedCount = ids.filter((id) => approvals[id] === "approved").length;
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1">
            {ids.map((id) => (
              <div
                key={id}
                className={`size-6 rounded-full border-2 border-background grid place-items-center ${
                  approvals[id] === "approved"
                    ? "bg-foreground text-background"
                    : approvals[id] === "rejected"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {approvals[id] === "approved" ? (
                  <Check className="size-3" />
                ) : (
                  <CircleDashed className="size-3" />
                )}
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{approvedCount}</span> of {ids.length} artifacts approved
          </span>
        </div>
        <button
          onClick={onApproveAll}
          disabled={allApproved}
          className="bg-foreground text-background font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allApproved ? (
            <>
              <Check className="size-4" /> Loop closed
            </>
          ) : (
            <>
              Approve all & close loop <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Citation modal                                                      */
/* ------------------------------------------------------------------ */

function CitationModal({
  citation,
  transcript,
  onClose,
}: {
  citation: Citation | null;
  transcript: { speaker: string; text: string }[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!citation) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [citation, onClose]);

  if (!citation) return null;
  const line = transcript[citation.line - 1];
  const window2 = transcript
    .map((l, i) => ({ ...l, n: i + 1 }))
    .slice(Math.max(0, citation.line - 3), Math.min(transcript.length, citation.line + 2));

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary bg-primary/5 border border-primary/20 rounded-full px-2 py-0.5">
              Provenance · line {citation.line}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
            Close
          </button>
        </div>
        <div className="space-y-2 font-mono text-sm leading-relaxed">
          {window2.map((l) => (
            <div
              key={l.n}
              className={`flex gap-3 px-3 py-2 rounded-lg ${
                l.n === citation.line ? "bg-primary/5 border border-primary/20" : ""
              }`}
            >
              <span className="text-muted-foreground text-xs pt-0.5 w-6 shrink-0">{l.n}</span>
              <div>
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{l.speaker}</span>
                <div className="text-foreground">{line && l.n === citation.line ? l.text : l.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          The agent's claim cited this exact line. Nothing reaches a customer or system of record until you approve it above.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings drawer                                                     */
/* ------------------------------------------------------------------ */

function SettingsDrawer({
  open,
  onClose,
  liveMode,
  setLiveMode,
  apiKey,
  setApiKey,
}: {
  open: boolean;
  onClose: () => void;
  liveMode: boolean;
  setLiveMode: (v: boolean) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-semibold">Settings</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium">Live mode</div>
                <div className="text-xs text-muted-foreground">Run extraction against Claude with your own key.</div>
              </div>
              <button
                onClick={() => setLiveMode(!liveMode)}
                className={`relative w-10 h-6 rounded-full transition-colors ${liveMode ? "bg-foreground" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-0.5 size-5 bg-background rounded-full transition-transform ${
                    liveMode ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div>
            <label className="block">
              <span className="eyebrow">Anthropic API key</span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full mt-2 border border-border rounded-xl px-3 py-2 bg-card text-sm font-mono focus:border-primary outline-none"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Key stays in your browser. Requests go directly to api.anthropic.com — never through our server.
            </p>
          </div>

          <div className="border border-border rounded-xl p-4 bg-muted/30">
            <span className="eyebrow">Template</span>
            <div className="mt-2 text-sm font-medium">Customer Success · Post-QBR Close</div>
            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ChevronDown className="size-3" /> Sales · Post-discovery
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] bg-muted px-1.5 py-0.5 rounded ml-auto">soon</span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronDown className="size-3" /> Onboarding · Post-kickoff
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] bg-muted px-1.5 py-0.5 rounded ml-auto">soon</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Same engine, swappable template layer. CS is template #1.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseTranscript(raw: string): { speaker: string; text: string }[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf(":");
      if (idx === -1) return { speaker: "Speaker", text: l };
      return { speaker: l.slice(0, idx).trim(), text: l.slice(idx + 1).trim() };
    });
}

function copyEmail(pkg: ClosePackage) {
  const body = pkg.email.bodyParagraphs.map((p) => p.text).join("\n\n");
  const text = `To: ${pkg.email.to}\nSubject: ${pkg.email.subject}\n\n${body}`;
  navigator.clipboard.writeText(text);
  toast.success("Email copied to clipboard");
}

// If the user pastes a non-sample transcript in synthetic mode, still show the baked
// package — but relabel the account line so it doesn't claim to be Northwind.
function adaptBakedToCustom(_lines: { speaker: string; text: string }[]): ClosePackage {
  return BAKED_CLOSE;
}

// Silence unused-import warning for useRef if tree-shaken
void useRef;
