import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Quote } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { TODAYS_BRIEF, briefAccount } from "@/lib/loop/brief";
import { formatARR } from "@/lib/loop/portfolio";
import { AGENT_OUTCOMES } from "@/lib/loop/agents";
import { IntegrationsStrip } from "@/components/integrations/IntegrationsStrip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Receipts — agentic renewal desk for CS teams" },
      {
        name: "description",
        content:
          "Receipts turns customer conversations into cited renewal actions: drafts, forecast moves, and manager approvals your CS team can trust.",
      },
      { property: "og:title", content: "Receipts — agentic renewal desk for CS teams" },
      {
        property: "og:description",
        content:
          "Customer-backed actions for renewals, expansion, and forecast — every claim cited.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <HowItWorks />
      <IntegrationsStrip />
      <Wedge />
      <Footer />
    </div>
  );
}

// ───────────────────────── HEADER ─────────────────────────

function Header() {
  return (
    <header className="border-b border-border sticky top-0 z-40 bg-background/85 backdrop-blur">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo size={20} />
          <span className="font-display font-semibold tracking-tight">Receipts</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-success ml-3">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            live demo
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-xs text-muted-foreground">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#stack" className="hover:text-foreground">Your stack</a>
          <a href="#partners" className="hover:text-foreground">Design partners</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/waitlist"
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
          >
            Request access
          </Link>
          <Link
            to="/try"
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3.5 py-1.5 rounded-full hover:opacity-90"
          >
            Try the desk <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ───────────────────────── HERO + INLINE BRIEF ─────────────────────────

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 pt-16 pb-16 md:pt-24 md:pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-start">
        {/* Left: positioning */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 mb-6 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-3 py-1">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            For CSMs · renewals managers · CCOs
          </div>
          <h1 className="font-display text-5xl md:text-[64px] font-semibold tracking-tight leading-[1.02]">
            Your CS team deserves agents that move the renewal work.
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
            Receipts reads the customer record, stages the next action, and shows
            the exact receipt behind every forecast move, rescue play, and
            expansion signal. Your team approves the work before anything ships.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/try"
              className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
            >
              Try it on a sample book <ArrowUpRight className="size-4" />
            </Link>
            <Link
              to="/waitlist"
              className="inline-flex items-center gap-2 text-sm font-medium border border-border px-5 py-3 rounded-full hover:bg-accent/40"
            >
              Become a design partner
            </Link>
          </div>

          <p className="mt-6 text-[11px] font-mono text-muted-foreground inline-flex items-center gap-2">
            <Clock className="size-3" />
            Read-only by default · human approval before writes · your data never trains shared models
          </p>
        </div>

        {/* Right: actual product artifact — Tuesday morning brief */}
        <InlineBrief />
      </div>
    </section>
  );
}

function InlineBrief() {
  return (
    <div className="border border-border rounded-2xl bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Sample book · today · 7:42a
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {AGENT_OUTCOMES.conversationsRead} sample conversations
        </span>
      </div>
      <div className="p-5">
        <div className="font-display text-base font-semibold tracking-tight mb-1">
          Three plays before lunch.
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          Every claim cited. Every play awaits your signoff.
        </div>
        <div className="space-y-2.5">
          {TODAYS_BRIEF.map((b) => {
            const acc = briefAccount(b.accountId);
            if (!acc) return null;
            const dot =
              b.urgency === "now"
                ? "bg-danger"
                : b.urgency === "today"
                ? "bg-warning"
                : "bg-muted-foreground/40";
            return (
              <Link
                key={b.accountId}
                to="/app"
                search={{ role: "csm" }}
                className="block border border-border rounded-xl p-3.5 bg-background hover:border-foreground/30 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`size-1.5 rounded-full ${dot}`} />
                  <span className="font-mono text-[10px] text-muted-foreground">#{b.rank}</span>
                  <span className="text-sm font-semibold tracking-tight">{acc.name}</span>
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                    {formatARR(b.arrAtStake)} · {acc.renewalDays}d
                  </span>
                </div>
                <p className="text-[13px] leading-snug">{b.action}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1">
                  <span className="text-foreground/70">Because:</span> {b.because}
                </p>
              </Link>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Live demo · interact with the full desk
          </span>
          <Link
            to="/app"
            search={{ role: "csm" }}
            className="text-[11px] font-medium inline-flex items-center gap-1 hover:opacity-80"
          >
            Open <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── HOW IT WORKS ─────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Overnight, the desk reads.",
      body: "Four specialist agents — Renewal-Risk, Champion-Watch, Expansion-Scout, Exec-Silence — read every call, Slack thread, and email on your book between 6:14p and 7:42a.",
      meta: `${AGENT_OUTCOMES.conversationsRead} conversations · ${AGENT_OUTCOMES.signalsProcessed.toLocaleString()} signals`,
    },
    {
      n: "02",
      title: "At 7:42a, the brief lands.",
      body: "Three plays, ranked. Each one has the action, the reason it's the right action, the ARR at stake, and a drafted next move — email, Slack note, CRM update — waiting for your signoff.",
      meta: "90-second read · 3 plays before lunch",
    },
    {
      n: "03",
      title: "Every claim cites the moment.",
      body: "Click any score and see the receipts: the quote, the speaker, the timestamp, the channel. Disagree? Override. The agent learns from your override — it doesn't override you.",
      meta: "3.2 citations per claim · 100% traceable",
    },
  ];
  return (
    <section id="how" className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <span className="eyebrow block mb-3">How it works</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            One product moment, repeated every morning.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
          {steps.map((s) => (
            <div key={s.n} className="bg-background p-7 md:p-8 flex flex-col">
              <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-4">
                {s.n}
              </span>
              <h3 className="font-display text-xl font-semibold tracking-tight mb-3 leading-tight">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.body}</p>
              <p className="mt-5 pt-4 border-t border-border text-[11px] font-mono text-muted-foreground">
                {s.meta}
              </p>
            </div>
          ))}
        </div>
        <div id="stack" />
      </div>
    </section>
  );
}

// ───────────────────────── WEDGE + CTA ─────────────────────────

function Wedge() {
  return (
    <section id="partners" className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24 grid lg:grid-cols-[1fr_0.8fr] gap-12 items-start">
        <div className="max-w-xl">
          <span className="eyebrow block mb-3">Design partner preview</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05]">
            See what Receipts would have caught before you connect anything.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Send 5–15 anonymized closed renewals. We'll run a concierge backtest
            and show which churns, expansions, and forecast misses the agents
            would have flagged — with the customer moments that prove it.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/waitlist"
              className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
            >
              Request access <ArrowUpRight className="size-4" />
            </Link>
            <span className="text-[11px] font-mono text-muted-foreground">
              No integration required · sample output first
            </span>
          </div>
        </div>

        <figure className="border border-border rounded-2xl bg-surface p-6 md:p-8">
          <Quote className="size-5 text-muted-foreground mb-4" />
          <blockquote className="text-base md:text-lg font-display tracking-tight leading-snug">
            "Give Receipts the renewals we already lost, then show me the exact
            customer moments we ignored. If the receipts are real, the budget
            conversation gets much easier."
          </blockquote>
          <figcaption className="mt-5 text-xs text-muted-foreground">
            Example buyer reaction · illustrative preview
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

// ───────────────────────── FOOTER ─────────────────────────

function Footer() {
  return (
    <footer>
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-10 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Logo size={18} />
          <span className="font-mono">Receipts · augments humans · cites every claim</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/waitlist" className="hover:text-foreground">Request access</Link>
          <Link to="/app" search={{ role: "csm" }} className="hover:text-foreground">
            Open the desk
          </Link>
          <a href="mailto:founders@receipts.dev" className="hover:text-foreground">
            founders@receipts.dev
          </a>
        </div>
      </div>
    </footer>
  );
}
