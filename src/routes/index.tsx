import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Quote, Send, Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { TODAYS_BRIEF, briefAccount } from "@/lib/loop/brief";
import { formatARR } from "@/lib/loop/portfolio";
import { IntegrationsStrip } from "@/components/integrations/IntegrationsStrip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Compound — the agent team that compounds your NRR" },
      {
        name: "description",
        content:
          "Compound runs the full save play — multi-thread email, exec invite, CRM update, manager brief — on one click. The agent team that does the work, not just the dashboard.",
      },
      { property: "og:title", content: "Compound — the agent team that compounds your NRR" },
      {
        property: "og:description",
        content:
          "One click ships the entire save play. Every dollar pulled back from churn, cited and shipped.",
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

function Header() {
  return (
    <header className="border-b border-border sticky top-0 z-40 bg-background/85 backdrop-blur">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo size={20} />
          <span className="font-display font-semibold tracking-tight">Compound</span>
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
            to="/app"
            search={{ role: "csm", demo: true }}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3.5 py-1.5 rounded-full hover:opacity-90"
          >
            Open the Save Room <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 pt-16 pb-16 md:pt-24 md:pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-start">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 mb-6 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-3 py-1">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            For CSMs · renewals leads · CCOs
          </div>
          <h1 className="font-display text-5xl md:text-[64px] font-semibold tracking-tight leading-[1.02]">
            Stop drafting saves.{" "}
            <span className="text-muted-foreground">Ship them.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
            Every CS tool tells you a renewal is at risk. Compound runs the
            save. Multi-thread email, exec invite, CRM update, manager
            brief — the whole play, drafted from cited evidence, shipped on
            one click. Human in the loop. Agents in the seat.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              search={{ role: "csm", demo: true }}
              className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
            >
              Ship a save in 4 seconds <ArrowUpRight className="size-4" />
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
            Tenant isolation · your data never trains a shared model · cited every claim
          </p>
        </div>

        <SaveDemo />
      </div>
    </section>
  );
}

// A small visual demo of the hero promise — a Motion with its steps,
// inviting the user to "Ship the save" which deep-links into /app.
function SaveDemo() {
  const top = TODAYS_BRIEF[0];
  const acc = briefAccount(top.accountId);
  if (!acc) return null;

  const steps = [
    { icon: Send, label: "Champion reset email", to: "Mara Lin (champion)" },
    { icon: Send, label: "Exec-to-exec note", to: "Renata Voss (CMO)" },
    { icon: Clock, label: "Hold exec save call", to: "Wed 2:00p · VP Sales" },
    { icon: Check, label: "Salesforce: Commit → At Risk", to: "Quill Media" },
    { icon: Send, label: "Brief manager in Slack", to: "#renewals · @ekim" },
  ];

  return (
    <div className="border border-border rounded-2xl bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-danger animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Save play · drafted 42m ago
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {formatARR(top.arrAtStake)} · {acc.renewalDays}d to renewal
        </span>
      </div>
      <div className="p-5">
        <div className="font-display text-base font-semibold tracking-tight mb-1">
          Save {acc.name} — competitor RFP closes Friday.
        </div>
        <div className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Procurement BCC'd us a competitor's rubric 14d ago. Champion has gone quiet.
          Play multi-threads above the champion, holds an exec save call, and briefs your VP.
        </div>

        <ol className="space-y-2.5 mb-5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-foreground/5 border border-border text-[10px] font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium leading-tight">{s.label}</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">→ {s.to}</div>
              </div>
              <s.icon className="size-3.5 text-muted-foreground mt-1.5 shrink-0" />
            </li>
          ))}
        </ol>

        <Link
          to="/app"
          search={{ role: "csm", demo: true }}
          className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-foreground text-background px-4 py-2.5 rounded-lg hover:opacity-90"
        >
          <Send className="size-3.5" /> Ship the save · 5 steps
        </Link>
        <p className="text-[11px] text-muted-foreground text-center mt-2.5">
          Try it on a sample book of 12 accounts — no signup, no integration.
        </p>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Agents read every conversation overnight.",
      body: "Four specialist agents — Renewal-Risk, Champion-Watch, Expansion-Scout, Exec-Silence — read every call, Slack, and email on your book between shifts. They don't summarize. They draft the play.",
      meta: "calls · Slack · email · CRM",
    },
    {
      n: "02",
      title: "By the time you log in, the saves are queued.",
      body: "Each motion is a complete play: multi-thread email, exec invite, CRM update, manager brief. The reasoning is cited back to the moment the customer said it. You read 90 seconds and decide.",
      meta: "1-click ship · 5-step plays · live preview",
    },
    {
      n: "03",
      title: "One click ships the whole motion.",
      body: "Email goes out. Invite holds the calendar. Salesforce updates. Manager gets briefed in Slack. Override and the agent learns — it doesn't override you. The ticker counts the dollars pulled back.",
      meta: "human in the loop · agents in the seat",
    },
  ];
  return (
    <section id="how" className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <span className="eyebrow block mb-3">How it works</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            Not another dashboard. The agents that do the work.
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

function Wedge() {
  return (
    <section id="partners" className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24 grid lg:grid-cols-[1fr_0.8fr] gap-12 items-start">
        <div className="max-w-xl">
          <span className="eyebrow block mb-3">Design partners</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05]">
            We're shipping with six CS teams this quarter.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            You get the agent team, weekly working sessions with the founders,
            lifetime founding pricing, and a concierge backtest on your last
            15 closed renewals — so you see the dollars before you integrate.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/waitlist"
              className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
            >
              Request access <ArrowUpRight className="size-4" />
            </Link>
            <span className="text-[11px] font-mono text-muted-foreground">
              3 of 6 slots open
            </span>
          </div>
        </div>

        <figure className="border border-border rounded-2xl bg-surface p-6 md:p-8">
          <Quote className="size-5 text-muted-foreground mb-4" />
          <blockquote className="text-base md:text-lg font-display tracking-tight leading-snug">
            "Every CS tool I've used tells me the same thing — this account
            is at risk. Compound is the first one that drafts the email, holds
            the exec call, updates the CRM, and briefs my manager. On one click.
            That's the whole job."
          </blockquote>
          <figcaption className="mt-5 text-xs text-muted-foreground">
            Illustrative partner quote · target persona: Director of CS, SaaS $40M ARR
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-10 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Logo size={18} />
          <span className="font-mono">Compound · agents in the seat, humans in the loop</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/waitlist" className="hover:text-foreground">Request access</Link>
          <Link to="/app" search={{ role: "csm", demo: true }} className="hover:text-foreground">
            Open the Save Room
          </Link>
          <a href="mailto:founders@compound.dev" className="hover:text-foreground">
            founders@compound.dev
          </a>
        </div>
      </div>
    </footer>
  );
}
