import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  Sparkles,
  Loader2,
  Users,
  LayoutGrid,
  TrendingUp,
  ShieldCheck,
  Clock,
  Quote,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { BACKTEST_STATS } from "@/lib/loop/backtest";
import { AGENT_OUTCOMES, AGENTS } from "@/lib/loop/agents";
import { PERSONAS, PERSONA_ORDER, type PersonaId } from "@/lib/loop/personas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Receipts — a night-shift research desk for your CS team" },
      {
        name: "description",
        content:
          "Receipts gives every CSM a night-shift research desk. Four specialist agents read every call, Slack, and email overnight — and leave a 90-second morning brief with every claim cited. Built to augment your team, not replace them.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <ProofBar />
        <Personas />
        <TryIt />
        <HowItAugments />
        <AgentsStrip />
        <Founder />
        <Footer />
      </main>
    </div>
  );
}

function LandingNav() {
  return (
    <header className="border-b border-border sticky top-0 z-40 bg-background/85 backdrop-blur">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display font-semibold tracking-tight">Receipts</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground ml-2 hidden sm:inline">
            for CS teams
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
          <a href="#personas" className="hover:text-foreground">For your team</a>
          <a href="#try" className="hover:text-foreground">Try the engine</a>
          <a href="#augment" className="hover:text-foreground">How it works</a>
          <a href="#proof" className="hover:text-foreground">Proof</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            to="/app"
            search={{ role: "csm" }}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3.5 py-1.5 rounded-full hover:opacity-90"
          >
            Enter workspace <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="max-w-[1180px] mx-auto px-6 md:px-10 pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="inline-flex items-center gap-2 mb-7 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-3 py-1">
        <span className="size-1.5 rounded-full bg-success animate-pulse" />
        For CSMs · Renewals managers · CS leaders
      </div>
      <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tighter leading-[0.98] max-w-4xl">
        Your CSMs deserve a<br />
        <span className="text-muted-foreground">night-shift research desk.</span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mt-7 max-w-2xl">
        Receipts is the team you'd hire if you could. Four specialist agents
        read every call, Slack thread, and email on your book overnight — and
        leave each CSM a 90-second morning brief with every claim cited back
        to the moment the customer said it.
      </p>
      <p className="text-sm text-foreground/80 mt-4 max-w-2xl leading-relaxed">
        <span className="font-medium">It doesn't replace your team.</span>{" "}
        It hands them the prep work the calendar never makes time for — so
        every CSM walks into Monday standup looking like the sharpest person
        in the room.
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Link
          to="/app"
          search={{ role: "csm" }}
          className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
        >
          See the workspace <ArrowUpRight className="size-4" />
        </Link>
        <a
          href="#try"
          className="inline-flex items-center gap-2 text-sm font-medium border border-border px-5 py-3 rounded-full hover:bg-accent/40"
        >
          Try it with your call · no login
        </a>
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 ml-1">
          <ShieldCheck className="size-3" /> SOC 2 in progress · your data never trains a shared model
        </span>
      </div>
    </section>
  );
}

function ProofBar() {
  return (
    <section
      id="proof"
      className="border-y border-border bg-surface"
    >
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
        <ProofStat
          value={`${BACKTEST_STATS.caughtByReceipts}/${BACKTEST_STATS.surpriseChurns}`}
          label="surprise churns caught"
          sub={`incumbent caught ${BACKTEST_STATS.caughtByVendor}/${BACKTEST_STATS.surpriseChurns}`}
        />
        <ProofStat
          value={`${BACKTEST_STATS.avgEarlyWarningDays}d`}
          label="avg early warning"
          sub="before the score flipped red"
        />
        <ProofStat
          value={`${Math.round(BACKTEST_STATS.precision * 100)}%`}
          label="precision"
          sub={`on ${BACKTEST_STATS.totalRenewals} closed renewals`}
        />
        <ProofStat
          value={`${AGENT_OUTCOMES.conversationsRead}`}
          label="conversations read overnight"
          sub={`${AGENT_OUTCOMES.signalsProcessed.toLocaleString()} signals processed`}
        />
      </div>
    </section>
  );
}

function ProofStat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div>
      <div className="font-display text-3xl md:text-4xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      <div className="text-xs uppercase font-mono tracking-[0.15em] text-muted-foreground mt-1">
        {label}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function Personas() {
  const icons: Record<PersonaId, React.ComponentType<{ className?: string }>> = {
    csm: Users,
    manager: LayoutGrid,
    leader: TrendingUp,
  };
  return (
    <section id="personas" className="max-w-[1180px] mx-auto px-6 md:px-10 py-20">
      <div className="max-w-2xl mb-10">
        <span className="eyebrow block mb-3">Built for the whole post-sales floor</span>
        <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
          One source of truth.<br />Three ways to use it.
        </h2>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          Each role gets their own workspace, tuned to the decision they make
          every day. Same evidence underneath — different first screen on top.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {PERSONA_ORDER.map((p) => {
          const persona = PERSONAS[p];
          const Icon = icons[p];
          return (
            <Link
              key={p}
              to="/app"
              search={{ role: p }}
              className="group border border-border rounded-2xl p-7 bg-surface hover:border-foreground/40 transition-colors flex flex-col"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="size-8 rounded-md bg-foreground/5 border border-border flex items-center justify-center">
                  <Icon className="size-4" />
                </div>
                <span className="eyebrow">{persona.label}</span>
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight mb-2 leading-tight">
                {persona.promise}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {persona.who}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground group-hover:gap-2.5 transition-all">
                Open this workspace <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── Public "score a call" demo ────────────────────────────────

const SAMPLE_TRANSCRIPT = `[CSM] Hey, thanks for jumping on. Before we dive in — I noticed your VP of Eng wasn't on the calendar this quarter. How's Maya doing?
[Customer] Maya actually moved over to lead the platform org six weeks ago. We've got a new VP, Devin, who's been doing his own evaluation of tooling.
[CSM] Got it. Is Devin someone we've talked to?
[Customer] He was in the original eval and was the one pushing back. Honestly between us, he asked me last week whether we could build a thin version of what you do internally.
[CSM] Understood. How are the dispatcher teams using the lane optimizer?
[Customer] Phoenix loves it. Atlanta basically turned it off — their lead thinks it overrides his judgment. And our CFO is reviewing every six-figure line item before March.`;

type DemoSignal = {
  id: string;
  label: string;
  weight: number;
  line: number;
  quote: string;
};

function detectSignals(text: string): DemoSignal[] {
  const lines = text.split("\n");
  const rules: { match: RegExp; label: string; weight: number }[] = [
    { match: /moved over|new vp|took over|left|departing|last day/i, label: "Champion change", weight: -3 },
    { match: /cfo|reviewing|line item|budget|procurement freeze/i, label: "Economic buyer shift", weight: -3 },
    { match: /build.*internally|build a thin version|competitor|rfp|evaluating other/i, label: "Competitive mention", weight: -3 },
    { match: /turned (it )?off|stopped using|not using|skeptic|pushing back/i, label: "Adoption drop", weight: -2 },
    { match: /loves it|standardize|expand|more please|advocate/i, label: "Advocacy", weight: 2 },
  ];
  const out: DemoSignal[] = [];
  lines.forEach((line, i) => {
    rules.forEach((r) => {
      if (r.match.test(line)) {
        out.push({
          id: `s-${i}-${r.label}`,
          label: r.label,
          weight: r.weight,
          line: i + 1,
          quote: line.replace(/^\[[^\]]+\]\s*/, "").trim(),
        });
      }
    });
  });
  return out;
}

function TryIt() {
  const [text, setText] = useState(SAMPLE_TRANSCRIPT);
  const [phase, setPhase] = useState<"idle" | "scoring" | "done">("idle");
  const [signals, setSignals] = useState<DemoSignal[]>([]);

  async function run() {
    setPhase("scoring");
    setSignals([]);
    const detected = detectSignals(text);
    for (let i = 0; i < detected.length; i++) {
      await new Promise((r) => setTimeout(r, 180));
      setSignals((prev) => [...prev, detected[i]]);
    }
    setPhase("done");
  }

  const base = 70;
  const score = Math.max(5, Math.min(95, base + signals.reduce((s, x) => s + x.weight * 6, 0)));
  const label: "Green" | "Yellow" | "Red" = score >= 65 ? "Green" : score >= 40 ? "Yellow" : "Red";

  return (
    <section id="try" className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 border-t border-border">
      <div className="max-w-2xl mb-10">
        <span className="eyebrow block mb-3">Public sandbox · no login</span>
        <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
          Paste any call.<br />Watch the agents read it.
        </h2>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          The same signal taxonomy the production engine uses, running in
          your browser. No data leaves this page. (The real version reads
          your CRM + every call/Slack/email and runs overnight.)
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-border rounded-2xl bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="eyebrow">Your call transcript</span>
            <button
              onClick={() => setText(SAMPLE_TRANSCRIPT)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Reset sample
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="w-full h-72 p-4 bg-transparent font-mono text-[12.5px] leading-relaxed resize-none outline-none"
          />
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {text.split("\n").filter(Boolean).length} lines · runs locally
            </span>
            <button
              onClick={run}
              disabled={phase === "scoring"}
              className="inline-flex items-center gap-2 text-xs font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 disabled:opacity-50"
            >
              {phase === "scoring" ? (
                <><Loader2 className="size-3.5 animate-spin" /> Scoring…</>
              ) : (
                <><Sparkles className="size-3.5" /> Score this call</>
              )}
            </button>
          </div>
        </div>

        <div className="border border-border rounded-2xl bg-surface p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow">Receipts score</span>
            <span className="text-[10px] font-mono text-muted-foreground">live</span>
          </div>
          <div className="flex items-end gap-4 mb-5">
            <div className={`font-display text-5xl font-semibold tabular-nums ${label === "Green" ? "text-success" : label === "Yellow" ? "text-warning" : "text-danger"}`}>
              {phase === "idle" ? "—" : score}
            </div>
            <div className="pb-2">
              <div className="text-sm font-medium">{phase === "idle" ? "Run to score" : label}</div>
              <div className="text-xs text-muted-foreground">
                {signals.length} signal{signals.length === 1 ? "" : "s"} detected
              </div>
            </div>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-72">
            {signals.length === 0 && (
              <div className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
                Signals will stream in here, cited to the line they came from.
              </div>
            )}
            {signals.map((s) => (
              <div
                key={s.id}
                className={`border border-border border-l-4 ${s.weight < 0 ? "border-l-danger" : "border-l-success"} rounded-md p-3 bg-background animate-reveal`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${s.weight < 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
                    {s.label} {s.weight > 0 ? "+" : ""}{s.weight}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">line {s.line}</span>
                </div>
                <blockquote className="text-xs leading-relaxed">"{s.quote}"</blockquote>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItAugments() {
  return (
    <section id="augment" className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 border-t border-border">
      <div className="max-w-2xl mb-10">
        <span className="eyebrow block mb-3">The contract</span>
        <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
          The agents prep.<br />Your team decides.
        </h2>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          Every play, draft, and forecast lands in your queue with citations.
          Nothing ships without a human. The brief is a prep doc — not a
          replacement for judgment.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <Pillar
          icon={Clock}
          title="Reads while you sleep"
          body="312 pages of customer conversation a night, across Zoom, Gong, Slack, Gmail, HubSpot, and Salesforce. Your CSM never reads cold."
        />
        <Pillar
          icon={Quote}
          title="Cites every claim"
          body="Every score traces to a specific quote, in a specific call, on a specific date. No black box — click any signal, see the source, override if you disagree."
        />
        <Pillar
          icon={ShieldCheck}
          title="Human in the loop"
          body="Drafts a play, never sends one. The CSM signs every outbound. Receipts learns from overrides — it doesn't override you."
        />
      </div>
    </section>
  );
}

function Pillar({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="border border-border rounded-2xl p-6 bg-surface">
      <div className="size-9 rounded-md bg-foreground/5 border border-border flex items-center justify-center mb-4">
        <Icon className="size-4" />
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function AgentsStrip() {
  return (
    <section className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 border-t border-border">
      <div className="max-w-2xl mb-8">
        <span className="eyebrow block mb-3">The bench · 4 specialist agents on duty</span>
        <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1]">
          Each one owns a single, hard CS question.
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {AGENTS.map((a) => (
          <div key={a.id} className="border border-border rounded-2xl p-5 bg-surface">
            <div className="eyebrow mb-2">{a.role}</div>
            <h3 className="font-display font-semibold tracking-tight text-base mb-2">{a.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{a.charter}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Founder() {
  return (
    <section className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 border-t border-border">
      <div className="max-w-3xl">
        <span className="eyebrow block mb-4">Why we're building this</span>
        <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05] mb-7">
          We're not replacing CSMs.<br />
          <span className="text-muted-foreground">We're giving them the night-shift desk they should've always had.</span>
        </h2>
        <div className="space-y-5 text-[15px] text-foreground/85 leading-relaxed">
          <p>
            Every VP of CS we talked to said the same thing: the renewal
            forecast is the number that gets them fired, and they don't
            trust their own dashboard. Every CSM said the same other thing:
            they spend Fridays backfilling Gainsight, not reading their
            customers.
          </p>
          <p>
            So we built the team you'd hire if you could — four specialist
            agents that do the reading. Your CSM walks in to a 90-second
            brief instead of a 60-tab inbox. Your manager sees where
            coaching pays back highest. Your CCO presents a forecast the
            CFO can audit, claim by claim.
          </p>
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">The bet:</span>{" "}
            once a CSM has the prep their calendar never made time for,
            they're not slower — they're sharper. Renewals go up. Surprise
            churn goes down. And the job stops being data entry.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/app"
            search={{ role: "csm" }}
            className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
          >
            See the workspace <ArrowUpRight className="size-4" />
          </Link>
          <a
            href="mailto:founders@receipts.dev?subject=Design%20partner"
            className="inline-flex items-center gap-2 text-sm font-medium border border-border px-5 py-3 rounded-full hover:bg-accent/40"
          >
            Become a design partner
          </a>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 ml-1">
            3 of 6 partner slots open · Q1
          </span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-10 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Logo size={18} />
          <span className="font-mono">Receipts · v0.4 · augments humans · cites every claim</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-foreground">Sign in</Link>
          <Link to="/signup" className="hover:text-foreground">Request access</Link>
          <a href="mailto:founders@receipts.dev" className="hover:text-foreground">founders@receipts.dev</a>
        </div>
      </div>
    </footer>
  );
}
