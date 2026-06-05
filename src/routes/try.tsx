import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  Check,
  X,
  Pencil,
  AlertTriangle,
  TrendingUp,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { runClose, type ClosePackage, type Citation } from "@/lib/loop/close.functions";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Try Receipts - paste a call, see the cited evidence" },
      {
        name: "description",
        content:
          "Paste a renewal call transcript. Receipts returns a cited evidence package with risks, stakeholder changes, CRM updates, and a reviewed follow-up draft.",
      },
      { property: "og:title", content: "Try Receipts" },
      {
        property: "og:description",
        content:
          "Paste a call. Get renewal evidence where every claim cites the moment that justified it.",
      },
    ],
  }),
  component: TryPage,
});

// Sample renewal call (Northwind Logistics) gives visitors something to run in one click.
const SAMPLE = `Keila (CSM): Thanks for making time. Before Q4 numbers, Priya, I heard Daniel moved over to Ops. Is he still your exec sponsor on this?
Priya (VP Ops): Honestly, no. Daniel's now running the warehouse modernization track and our new CFO Renee is the one asking the hard questions about routing spend. I'd like to bring her in next time.
Keila (CSM): Got it. I'll set up a 30-min intro with Renee before the next review. What is she focused on?
Priya (VP Ops): Cost per delivered mile, and proof that the routing platform pays for itself. She's reviewing every line item over $100k in February.
Marcus (AE): Useful to know. We can pull a value-realization brief that lines up with how Renee is going to look at it.
Priya (VP Ops): That would actually help me a lot. Can you get it to me by end of next week? I want to socialize it before the budget meeting.
Keila (CSM): We can have a draft to you by Friday the 13th. Let's talk adoption. How is the dispatcher team using the new lane optimization?
Priya (VP Ops): Mixed. Phoenix and Dallas love it. Atlanta has basically not turned it on. Their dispatch lead thinks it overrides his judgment.
Keila (CSM): That tracks with what I'm seeing in usage. Atlanta is at 11% weekly active versus 78% in Phoenix. Would it help if I ran a working session with the Atlanta team in January?
Priya (VP Ops): Yes. And bring data, show him what Phoenix saved last quarter. He won't argue with the numbers, he'll argue with the framing.
Priya (VP Ops): One more thing. We are being asked to look at one of your competitors as part of the budget exercise. It's procedural, not a real evaluation, but Renee will ask.
Keila (CSM): Appreciate you flagging it. The value brief should answer most of that, and I'll make sure the Optoro integration timeline is in writing so it is not a question mark.
Priya (VP Ops): Perfect. Last topic, we are expanding into Mexico in Q2. Cross-border lanes, customs. Does Atlas handle that today?
Marcus (AE): Cross-border is on the roadmap for Q1 GA. I can get you the spec sheet and time with the PM if it is material to your Q2 plan.
Priya (VP Ops): It's material. Put it on the list.`;

type Line = { speaker: string; text: string };

function parseTranscript(raw: string): Line[] {
  return raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf(":");
      if (idx === -1) return { speaker: "Speaker", text: l };
      return { speaker: l.slice(0, idx).trim(), text: l.slice(idx + 1).trim() };
    });
}

function TryPage() {
  const [raw, setRaw] = useState(SAMPLE);
  const [account, setAccount] = useState("Northwind Logistics");
  const [pkg, setPkg] = useState<ClosePackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const [decision, setDecision] = useState<"none" | "approved" | "rejected">("none");
  const [emailEdit, setEmailEdit] = useState<string | null>(null);
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const transcript = useMemo(() => parseTranscript(raw), [raw]);
  const run = useServerFn(runClose);

  async function generate() {
    setPkg(null);
    setDecision("none");
    setEmailEdit(null);
    setLoading(true);
    try {
      const result = await run({
        data: { transcript, accountName: account || undefined },
      });
      setPkg(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function jumpTo(line: number) {
    setActiveCite(line);
    const el = lineRefs.current[line];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setActiveCite((c) => (c === line ? null : c)), 1800);
  }

  const emailText = pkg
    ? (emailEdit ??
      `Subject: ${pkg.email.subject}\n\nHi ${pkg.email.to},\n\n${pkg.email.bodyParagraphs
        .map((p) => p.text)
        .join("\n\n")}`)
    : "";

  function copyEmail() {
    if (!emailText) return;
    navigator.clipboard.writeText(emailText);
    toast.success("Email copied. Paste into Gmail or Outlook.");
  }

  function copyCrm() {
    if (!pkg) return;
    navigator.clipboard.writeText(pkg.crmUpdate);
    toast.success("CRM note copied. Paste into Salesforce or HubSpot.");
  }

  function approve() {
    if (!pkg) return;
    copyEmail();
    setDecision("approved");
  }
  function reject() {
    setDecision("rejected");
    toast("Marked rejected. In the full product, this trains the model on your taste.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-30 bg-background/85 backdrop-blur">
        <div className="max-w-[1380px] mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={20} />
            <span className="font-display font-semibold tracking-tight">Receipts</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-success ml-3">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              live
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Back to home
          </Link>
        </div>
      </header>

      <div className="max-w-[1380px] mx-auto px-5 md:px-8 pt-8 pb-6">
        <div className="max-w-3xl">
          <span className="eyebrow block mb-3">Live demo, no signup</span>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            Paste a call. See the cited evidence package.
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            We start you with a sample renewal call. Click{" "}
            <span className="font-medium text-foreground">Generate evidence package</span>, then
            click any citation chip to jump to the exact line that justified it.
          </p>
        </div>
      </div>

      <div className="max-w-[1380px] mx-auto px-5 md:px-8 pb-16 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6">
        {/* LEFT: transcript */}
        <section className="border border-border rounded-2xl bg-surface overflow-hidden flex flex-col min-h-[640px]">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 bg-background">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground shrink-0">
                Account
              </span>
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Account name (optional)"
                className="bg-transparent text-sm font-medium tracking-tight focus:outline-none w-full min-w-0"
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {transcript.length} lines
            </span>
          </div>

          {pkg ? (
            <div className="flex-1 overflow-auto p-4 space-y-2.5 text-sm">
              {transcript.map((l, i) => {
                const n = i + 1;
                const isActive = activeCite === n;
                return (
                  <div
                    key={n}
                    ref={(el) => {
                      lineRefs.current[n] = el;
                    }}
                    className={`flex gap-3 rounded-lg p-2 transition-colors ${
                      isActive ? "bg-warning/15 ring-1 ring-warning" : "hover:bg-accent/30"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground w-7 shrink-0 pt-1 text-right">
                      {String(n).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-muted-foreground mb-0.5">
                        {l.speaker}
                      </div>
                      <p className="text-sm leading-relaxed">{l.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full p-4 bg-transparent text-sm font-mono leading-relaxed focus:outline-none resize-none"
              placeholder="Speaker: line one&#10;Speaker: line two"
            />
          )}

          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3 bg-background">
            <span className="text-[11px] text-muted-foreground">
              {pkg
                ? "Locked while reviewing. Run again to edit."
                : "Format: one line per turn, Speaker: text"}
            </span>
            {pkg ? (
              <button
                onClick={() => setPkg(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Edit transcript
              </button>
            ) : (
              <button
                onClick={generate}
                disabled={loading || transcript.length < 2}
                className="inline-flex items-center gap-2 text-xs font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Reading
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" /> Generate evidence package
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* RIGHT: evidence package */}
        <section className="border border-border rounded-2xl bg-surface overflow-hidden flex flex-col min-h-[640px]">
          {!pkg && !loading && <EmptyRight onRun={generate} />}
          {loading && <LoadingRight />}
          {pkg && (
            <Result
              pkg={pkg}
              decision={decision}
              onJump={jumpTo}
              emailText={emailText}
              onEditEmail={(t) => setEmailEdit(t)}
              onApprove={approve}
              onReject={reject}
              onCopyEmail={copyEmail}
              onCopyCrm={copyCrm}
            />
          )}
        </section>
      </div>

      <div className="max-w-[1380px] mx-auto px-5 md:px-8 pb-16">
        <div className="border border-border rounded-2xl p-6 md:p-8 bg-surface/40 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-lg">
            <h3 className="font-display text-lg font-semibold tracking-tight">
              This is the wedge we can prove.
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              One channel (calls), one decision surface (renewal evidence), one trust mechanic
              (every claim cited). Design partners get account history, outcome tracking, and
              team-level coaching loops.
            </p>
          </div>
          <Link
            to="/waitlist"
            className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-2.5 rounded-full hover:opacity-90"
          >
            Become a design partner
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyRight({ onRun }: { onRun: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <div className="size-12 rounded-full bg-accent/40 flex items-center justify-center mb-4">
        <Sparkles className="size-5 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight">
        Your cited evidence package lands here.
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        Renewal risks, CRM updates, value proof, and a reviewed follow-up. Every claim links back to
        the line that proved it.
      </p>
      <button
        onClick={onRun}
        className="mt-5 inline-flex items-center gap-2 text-xs font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90"
      >
        <Sparkles className="size-3.5" /> Generate on sample call
      </button>
    </div>
  );
}

function LoadingRight() {
  const steps = [
    "Reading the transcript",
    "Mapping stakeholders, value proof, and risks",
    "Drafting follow-up and CRM evidence updates",
    "Citing every claim back to a line",
  ];
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10">
      <Loader2 className="size-5 animate-spin text-muted-foreground mb-5" />
      <ul className="space-y-2 text-sm">
        {steps.map((s) => (
          <li key={s} className="flex items-center gap-2 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground/40" /> {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CiteChip({ c, onJump }: { c: Citation; onJump: (n: number) => void }) {
  return (
    <button
      onClick={() => onJump(c.line)}
      title={c.quote}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-warning/15 text-warning-foreground border border-warning/30 hover:bg-warning/25 transition-colors align-middle mx-0.5"
    >
      L{c.line}
    </button>
  );
}

const signalLabel: Record<ClosePackage["renewalSignal"], { text: string; tone: string }> = {
  expand: { text: "Expansion signal", tone: "bg-success/15 text-success border-success/30" },
  renew: { text: "Likely to renew", tone: "bg-success/15 text-success border-success/30" },
  at_risk: { text: "At risk", tone: "bg-warning/15 text-warning border-warning/30" },
  churn_risk: { text: "Churn risk", tone: "bg-danger/15 text-danger border-danger/30" },
  unknown: { text: "Unclear", tone: "bg-muted text-muted-foreground border-border" },
};

const severityTone: Record<"low" | "medium" | "high", string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-warning/15 text-warning border-warning/30",
  high: "bg-danger/15 text-danger border-danger/30",
};

function Result({
  pkg,
  decision,
  onJump,
  emailText,
  onEditEmail,
  onApprove,
  onReject,
  onCopyEmail,
  onCopyCrm,
}: {
  pkg: ClosePackage;
  decision: "none" | "approved" | "rejected";
  onJump: (n: number) => void;
  emailText: string;
  onEditEmail: (t: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onCopyEmail: () => void;
  onCopyCrm: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const sig = signalLabel[pkg.renewalSignal] ?? signalLabel.unknown;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-background">
        <div className="flex items-start gap-3 mb-2">
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border ${sig.tone}`}
          >
            <TrendingUp className="size-3" /> {sig.text}
          </span>
          {decision === "approved" && (
            <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border bg-success/15 text-success border-success/30">
              <Check className="size-3" /> Approved
            </span>
          )}
          {decision === "rejected" && (
            <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border bg-danger/15 text-danger border-danger/30">
              <X className="size-3" /> Rejected
            </span>
          )}
        </div>
        <h2 className="font-display text-base font-semibold tracking-tight leading-snug">
          {pkg.headline}
        </h2>
      </div>

      <div className="flex-1 overflow-auto">
        {/* EMAIL */}
        <section className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              CSM follow-up draft
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEditing((e) => !e)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              >
                <Pencil className="size-3" /> {editing ? "Done" : "Edit"}
              </button>
              <button
                onClick={onCopyEmail}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              >
                <Copy className="size-3" /> Copy
              </button>
            </div>
          </div>

          {editing ? (
            <textarea
              defaultValue={emailText}
              onChange={(e) => onEditEmail(e.target.value)}
              className="w-full min-h-[260px] text-sm font-mono leading-relaxed bg-background border border-border rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          ) : (
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">
                To: <span className="text-foreground">{pkg.email.to}</span>
              </div>
              <div className="text-sm font-medium tracking-tight mb-3">{pkg.email.subject}</div>
              <div className="space-y-3 text-sm leading-relaxed">
                {pkg.email.bodyParagraphs.map((p, i) => (
                  <p key={i}>
                    {p.text}{" "}
                    {p.citations?.map((c) => (
                      <CiteChip key={`${i}-${c.line}`} c={c} onJump={onJump} />
                    ))}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RISKS */}
        {pkg.risks?.length > 0 && (
          <section className="p-5 border-b border-border">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Renewal risks and plays
            </h3>
            <div className="space-y-2.5">
              {pkg.risks.map((r, i) => (
                <div key={i} className="border border-border rounded-lg p-3.5 bg-background">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="size-3.5 text-muted-foreground" />
                    <span className="text-sm font-semibold tracking-tight">{r.title}</span>
                    <span
                      className={`ml-auto text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityTone[r.severity]}`}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-snug mb-1.5">
                    {r.rationale}{" "}
                    {r.citations?.map((c) => (
                      <CiteChip key={`r-${i}-${c.line}`} c={c} onJump={onJump} />
                    ))}
                  </p>
                  <p className="text-[12px]">
                    <span className="text-muted-foreground">Play:</span> {r.recommendedPlay}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RECORD UPDATES */}
        {pkg.recordUpdates?.length > 0 && (
          <section className="p-5 border-b border-border">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-3">
              CRM evidence updates
            </h3>
            <div className="space-y-2">
              {pkg.recordUpdates.map((u, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg p-3 bg-background text-[13px]"
                >
                  <div className="text-xs font-medium tracking-tight mb-1">{u.field}</div>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <span className="line-through">{u.before}</span>
                    <span className="text-foreground">{">"}</span>
                    <span className="text-foreground">{u.after}</span>
                    <span className="ml-1">
                      {u.citations?.map((c) => (
                        <CiteChip key={`u-${i}-${c.line}`} c={c} onJump={onJump} />
                      ))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CRM */}
        <section className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              CRM update note
            </h3>
            <button
              onClick={onCopyCrm}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded"
            >
              <Copy className="size-3" /> Copy
            </button>
          </div>
          <pre className="bg-background border border-border rounded-lg p-3 text-[13px] leading-relaxed whitespace-pre-wrap font-mono">
            {pkg.crmUpdate}
          </pre>
        </section>
      </div>

      <div className="px-5 py-4 border-t border-border bg-background flex flex-wrap items-center gap-2">
        <button
          onClick={onApprove}
          disabled={decision !== "none"}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 disabled:opacity-50"
        >
          <Check className="size-3.5" /> Approve and copy email
        </button>
        <button
          onClick={onReject}
          disabled={decision !== "none"}
          className="inline-flex items-center gap-1.5 text-xs text-foreground border border-border px-4 py-2 rounded-full hover:bg-accent/40 disabled:opacity-50"
        >
          <X className="size-3.5" /> Reject
        </button>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <Shield className="size-3" /> Nothing sent. You stay in the loop.
        </span>
      </div>
    </div>
  );
}
