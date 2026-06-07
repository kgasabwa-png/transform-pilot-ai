import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Shield,
  Zap,
  Eye,
  Sparkles,
  Lock,
  CircleDot,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ledgerline — The outcome ledger for customer success" },
      {
        name: "description",
        content:
          "Every save, expansion, onboarding milestone and escalation — shipped with a receipt. Agents close the line items. Humans approve the money moments.",
      },
      { property: "og:title", content: "Ledgerline — The outcome ledger for customer success" },
      {
        property: "og:description",
        content:
          "Agents close the line items. Humans approve the money moments. Every outcome cited, timestamped, revertible.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Header />
      <Hero />
      <LogoStrip />
      <HowItWorks />
      <BlastRadius />
      <OutcomesBento />
      <Security />
      <CTA />
      <Footer />
    </div>
  );
}

/* ------------------------------ Header ------------------------------ */

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0 text-foreground">
          <Logo size={22} />
          <span className="font-display font-semibold tracking-tight text-[15px]">Ledgerline</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#autonomy" className="hover:text-foreground transition-colors">Autonomy</a>
          <a href="#outcomes" className="hover:text-foreground transition-colors">Outcomes</a>
          <a href="#security" className="hover:text-foreground transition-colors">Security</a>
          <Link to="/console" className="hover:text-foreground transition-colors">Console</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/console" className="hidden sm:inline-flex text-[13px] text-muted-foreground hover:text-foreground px-3 py-1.5">
            Sign in
          </Link>
          <Link
            to="/try"
            className="inline-flex items-center gap-1 bg-foreground text-background text-[13px] font-medium px-3.5 py-1.5 rounded-md hover:opacity-90 transition-opacity"
          >
            Book a demo
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Hero ------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-16 md:pb-24 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent border border-border mb-7">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-foreground">
              Outcome ledger · live
            </span>
          </div>

          <h1 className="font-display text-[44px] md:text-[60px] leading-[1.02] tracking-[-0.025em] font-semibold text-foreground">
            The outcome ledger
            <br />
            <span className="text-primary">for customer success.</span>
          </h1>

          <p className="mt-6 text-[17px] leading-[1.55] text-muted-foreground max-w-[520px]">
            Every save, expansion, onboarding milestone and escalation — shipped with a receipt.
            Agents close the line items. Humans approve the money moments.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              to="/try"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium px-5 py-3.5 rounded-xl shadow-[0_8px_24px_-8px_oklch(0.68_0.19_38/0.55)] hover:translate-y-[-1px] transition-all"
            >
              Run a signal on your workspace
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/console"
              className="inline-flex items-center justify-center gap-2 bg-surface border border-border text-foreground font-medium px-5 py-3.5 rounded-xl hover:bg-accent transition-colors"
            >
              See the live ledger
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-5 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check size={13} className="text-primary" /> SOC 2 in progress</span>
            <span className="flex items-center gap-1.5"><Check size={13} className="text-primary" /> 14-day pilot</span>
            <span className="flex items-center gap-1.5"><Check size={13} className="text-primary" /> No data leaves your cloud</span>
          </div>
        </div>

        <div className="md:col-span-6">
          <LedgerArtifact />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Ledger Artifact ------------------------------ */

type Tab = "prepared" | "review" | "done";

type LedgerItem = {
  id: string;
  account: string;
  initials: string;
  swatch: string;
  outcome: string;
  type: "Renewal" | "Expansion" | "Onboarding" | "Escalation" | "Hygiene";
  body: string;
  amount?: string;
  badge: "agent" | "review" | "done";
  status: string;
  blast: "Internal" | "Customer" | "Money";
  time: string;
};

const ledgerData: Record<Tab, LedgerItem[]> = {

  prepared: [
    {
      id: "0918",
      account: "Veridian Bank",
      initials: "V",
      swatch: "bg-emerald-50 text-emerald-700",
      outcome: "Expansion signal",
      type: "Expansion",
      body: "Usage +38% in Q3. 14 net-new seats detected. Brief drafted for AE handoff.",
      amount: "+$220,000",
      badge: "review",
      status: "Awaiting CSM",
      blast: "Money",
      time: "9:36 AM",
    },
    {
      id: "0917",
      account: "Northwind Labs",
      initials: "N",
      swatch: "bg-indigo-50 text-indigo-700",
      outcome: "Champion changed",
      type: "Renewal",
      body: "Maya Chen moved to Atlassian (LinkedIn). Renewal in 47 days — playbook ready.",
      badge: "review",
      status: "Awaiting CSM",
      blast: "Customer",
      time: "9:14 AM",
    },
  ],
  review: [
    {
      id: "0916",
      account: "Lumen Health",
      initials: "L",
      swatch: "bg-rose-50 text-rose-700",
      outcome: "QBR brief",
      type: "Renewal",
      body: "Pulls last 3 calls, 11 tickets, adoption delta, exec change. One page.",
      badge: "review",
      status: "Open in console",
      blast: "Customer",
      time: "8:51 AM",
    },
  ],
  done: [
    {
      id: "0915",
      account: "Crestline",
      initials: "C",
      swatch: "bg-sky-50 text-sky-700",
      outcome: "Hubspot fields synced",
      type: "Hygiene",
      body: "Renewal date, MAP stage, and champion field updated across 12 accounts.",
      badge: "agent",
      status: "Shipped",
      blast: "Internal",
      time: "8:42 AM",
    },
    {
      id: "0914",
      account: "Atlas Freight",
      initials: "A",
      swatch: "bg-amber-50 text-amber-700",
      outcome: "Onboarding nudge",
      type: "Onboarding",
      body: "Stage 3 milestone reached — congrats email sent to admin, AE looped.",
      badge: "agent",
      status: "Shipped",
      blast: "Customer",
      time: "8:30 AM",
    },
  ],
};

function LedgerArtifact() {
  const [tab, setTab] = useState<Tab>("prepared");
  const counts = {
    prepared: ledgerData.prepared.length,
    review: ledgerData.review.length,
    done: ledgerData.done.length,
  };

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/60 via-transparent to-primary/10 blur-2xl"
      />
      <div className="bg-surface border border-border rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary">
              <Logo size={18} />
            </div>
            <span className="font-display font-semibold text-[13px] tracking-tight">Ledgerline · Console</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            LIVE
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-5 border-b border-border text-[11px] font-mono uppercase tracking-[0.16em]">
          {(["prepared", "review", "done"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 -mb-px border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              <span className="ml-1.5 text-[10px] opacity-70">{counts[t]}</span>
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="p-3 space-y-2.5 bg-[oklch(0.985_0_0)] min-h-[260px]">
          {ledgerData[tab].map((item) => (
            <LedgerRow key={item.id} item={item} />
          ))}
        </div>

        {/* Footer stats */}
        <div className="p-3 grid grid-cols-3 gap-2 bg-surface border-t border-border">
          <Stat label="ARR actioned" value="$280k" tone="default" />
          <Stat label="Hours returned" value="42.5" tone="primary" />
          <Stat label="Auto-shipped" value="94%" tone="default" />
        </div>
      </div>

      {/* Floating receipt */}
      <div className="hidden md:flex absolute -bottom-6 -left-6 bg-foreground text-background rounded-xl px-3.5 py-2.5 gap-3 shadow-xl items-center">
        <CircleDot size={14} className="text-primary" />
        <div className="text-[11px] leading-tight">
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">Receipt #0915</div>
          <div className="font-medium">Hubspot · 12 fields synced</div>
        </div>
      </div>
    </div>
  );
}

function LedgerRow({ item }: { item: ReturnType<typeof Object> extends never ? never : (typeof ledgerData)["prepared"][number] }) {
  const badgeStyle =
    item.badge === "agent"
      ? "bg-foreground text-background"
      : item.badge === "review"
      ? "bg-primary/10 text-primary border border-primary/30"
      : "bg-accent text-foreground";
  const blastChip =
    item.blast === "Internal"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : item.blast === "Customer"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-rose-50 text-rose-700 border-rose-100";

  return (
    <div className="bg-surface rounded-xl border border-border p-3 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-semibold ${item.swatch}`}>
            {item.initials}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-foreground truncate">{item.account}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span>{item.outcome}</span>
              <span className="opacity-40">·</span>
              <span className="font-mono">#{item.id}</span>
            </div>
          </div>
        </div>
        {item.amount && (
          <div className="font-mono text-[12px] font-semibold text-success shrink-0">{item.amount}</div>
        )}
      </div>
      <p className="text-[11.5px] text-muted-foreground leading-[1.45] mb-2.5">{item.body}</p>
      <div className="flex items-center justify-between pt-2.5 border-t border-dashed border-border">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${blastChip}`}>
            {item.blast}
          </span>
          <span className="text-[10px] text-muted-foreground">{item.time}</span>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${badgeStyle}`}>
          {item.status}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "default" | "primary" }) {
  return (
    <div className="px-2 py-1.5">
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-[16px] font-mono font-semibold ${tone === "primary" ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

/* ------------------------------ Logo Strip ------------------------------ */

function LogoStrip() {
  const names = ["Reads from", "Salesforce", "HubSpot", "Gong", "Zendesk", "Snowflake", "Slack", "Jira"];
  return (
    <section className="border-y border-border bg-accent/30">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-6 flex flex-wrap items-center gap-x-10 gap-y-3 text-[12px]">
        {names.map((n, i) => (
          <span
            key={n}
            className={
              i === 0
                ? "font-mono uppercase tracking-[0.18em] text-[10px] text-muted-foreground"
                : "font-display font-medium text-foreground/70 hover:text-foreground transition-colors"
            }
          >
            {n}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ How it works ------------------------------ */

function HowItWorks() {
  const steps = [
    {
      icon: Eye,
      title: "Read",
      eyebrow: "01 · Signals",
      body: "Calls, tickets, CRM, product usage, plus the world layer: LinkedIn, funding, layoffs, M&A.",
      list: ["Gong / Chorus transcripts", "Salesforce + HubSpot", "Zendesk + Intercom", "Snowflake usage", "LinkedIn champion tracking"],
    },
    {
      icon: Sparkles,
      title: "Decide",
      eyebrow: "02 · Judgment",
      body: "Every action gets a blast radius and a confidence score. The two together decide who ships.",
      list: ["Internal · Customer · Money", "Confidence tier per action", "Drafts cite verbatim source", "Reversible by default"],
    },
    {
      icon: Zap,
      title: "Act",
      eyebrow: "03 · Receipts",
      body: "Updates flow to your stack with a receipt. Quick-review batches for medium-confidence work.",
      list: ["Sync to CRM + CS platform", "Draft Slack / email follow-ups", "QBR briefs ready to send", "1-click revert window"],
    },
  ];

  return (
    <section id="how" className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="How it works"
          title="Read. Decide. Act. With a receipt every time."
          sub="Ledgerline is one loop with three jobs. The product is what closes line items between your meetings."
        />

        <div className="grid md:grid-cols-3 gap-5 mt-14">
          {steps.map((s) => (
            <div key={s.title} className="bg-surface border border-border rounded-2xl p-7 hover:border-foreground/15 transition-colors">
              <div className="flex items-center justify-between mb-5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <s.icon size={18} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{s.eyebrow}</span>
              </div>
              <h3 className="font-display text-[22px] font-semibold tracking-tight mb-2">{s.title}</h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">{s.body}</p>
              <ul className="space-y-1.5">
                {s.list.map((l) => (
                  <li key={l} className="text-[12.5px] text-foreground/80 flex items-start gap-2">
                    <Check size={13} className="text-primary mt-[3px] shrink-0" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Blast Radius / Autonomy ------------------------------ */

function BlastRadius() {
  const lanes = [
    {
      name: "Internal",
      color: "emerald",
      headline: "Auto-ship",
      sub: "Hygiene, CRM fields, internal briefs",
      examples: ["MAP stage updates", "Renewal date sync", "Champion field edits", "Health score recompute"],
      autonomy: "Agent ships at >90 confidence",
    },
    {
      name: "Customer-facing",
      color: "amber",
      headline: "Quick review",
      sub: "Anything a customer sees",
      examples: ["Follow-up emails", "QBR briefs", "Onboarding nudges", "Re-engagement sequences"],
      autonomy: "CSM approves in batch",
    },
    {
      name: "Money",
      color: "rose",
      headline: "Co-sign",
      sub: "Anything that moves ARR",
      examples: ["Renewal concessions", "Expansion proposals", "Pricing changes", "Contract redlines"],
      autonomy: "Always human + receipt",
    },
  ];

  return (
    <section id="autonomy" className="py-24 md:py-32 bg-[oklch(0.978_0_0)] border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="The autonomy rule"
          title="Autonomous on the inside. Human on the outside."
          sub="Blast radius decides what can auto-ship. Confidence decides what does. You set the dial; we never cross it."
        />

        <div className="grid md:grid-cols-3 gap-4 mt-14">
          {lanes.map((l, i) => (
            <div
              key={l.name}
              className={`relative bg-surface border rounded-2xl p-7 ${
                i === 0 ? "border-emerald-200" : i === 1 ? "border-amber-200" : "border-rose-200"
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <span
                  className={`text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 rounded border ${
                    i === 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : i === 1
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {l.name}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">{l.autonomy}</span>
              </div>
              <h3 className="font-display text-[26px] font-semibold tracking-tight">{l.headline}</h3>
              <p className="text-[13px] text-muted-foreground mb-5">{l.sub}</p>
              <div className="space-y-2 pt-4 border-t border-dashed border-border">
                {l.examples.map((e) => (
                  <div key={e} className="text-[12.5px] text-foreground/80 flex items-center justify-between">
                    <span>{e}</span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        i === 0 ? "bg-emerald-500" : i === 1 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center">
          <Link
            to="/console"
            className="inline-flex items-center gap-2 text-[13px] text-foreground border-b border-foreground/30 pb-0.5 hover:border-foreground transition-colors"
          >
            See it running in the console
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Outcomes Bento ------------------------------ */

function OutcomesBento() {
  return (
    <section id="outcomes" className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Outcomes we close"
          title="Five outcome types. One ledger."
          sub="Every line item has a signal that triggered it, the work that closed it, and a receipt you can revert."
        />

        <div className="grid md:grid-cols-6 gap-4 mt-14 auto-rows-[200px]">
          <BentoCard
            className="md:col-span-3 md:row-span-2"
            tag="Renewal"
            title="Defend the number 90 days out."
            body="QBR briefs, champion tracking, save plays, exec asks — surfaced the moment risk crosses the line."
            metric="$8.2M ARR defended across pilots"
            featured
          />
          <BentoCard
            className="md:col-span-3"
            tag="Expansion"
            title="Surface the buy signal."
            body="Usage spikes, new teams, hiring waves — drafted as an AE-ready brief."
            metric="2.1× expansion attach"
          />
          <BentoCard
            className="md:col-span-3"
            tag="Onboarding"
            title="Time-to-value, accounted."
            body="Milestone nudges with the receipts that prove they happened."
            metric="−38% time to first value"
          />
          <BentoCard
            className="md:col-span-2"
            tag="Escalation"
            title="Catch heat early."
            body="Calls + tickets + sentiment, paged before NPS does."
          />
          <BentoCard
            className="md:col-span-2"
            tag="Hygiene"
            title="The CRM, true."
            body="Fields stay updated. No more Friday reviews."
          />
          <BentoCard
            className="md:col-span-2"
            tag="World layer"
            title="Outside signals, inside the loop."
            body="LinkedIn, funding, M&A, layoffs — correlated with the account."
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  className = "",
  tag,
  title,
  body,
  metric,
  featured,
}: {
  className?: string;
  tag: string;
  title: string;
  body: string;
  metric?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`group relative bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between overflow-hidden hover:border-foreground/15 transition-colors ${className} ${
        featured ? "bg-gradient-to-br from-accent to-surface" : ""
      }`}
    >
      <div>
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">{tag}</span>
        <h3 className={`font-display font-semibold tracking-tight mt-3 ${featured ? "text-[28px] leading-[1.1]" : "text-[18px] leading-[1.2]"}`}>
          {title}
        </h3>
        <p className={`text-muted-foreground mt-2 ${featured ? "text-[14px]" : "text-[13px]"} leading-relaxed`}>{body}</p>
      </div>
      {metric && (
        <div className="mt-4 pt-4 border-t border-dashed border-border">
          <span className="text-[12px] font-mono text-foreground">{metric}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Security ------------------------------ */

function Security() {
  const items = [
    { icon: Shield, title: "SOC 2 Type II in progress", body: "Independent audit underway. Penetration test report on request." },
    { icon: Lock, title: "Your data, your cloud", body: "Bring your own keys. Customer data never leaves your storage layer." },
    { icon: Eye, title: "Receipt for every change", body: "Every write is signed, cited to a source, and revertible inside the window." },
    { icon: CircleDot, title: "Role-aware autonomy", body: "Admins set what auto-ships per persona, per outcome type, per blast radius." },
  ];
  return (
    <section id="security" className="py-24 md:py-32 bg-foreground text-background">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Security & control</span>
            <h2 className="font-display text-[40px] md:text-[48px] leading-[1.05] tracking-[-0.025em] font-semibold mt-4">
              Built for teams that get audited.
            </h2>
            <p className="text-[15px] text-background/65 mt-5 leading-relaxed max-w-md">
              Ledgerline assumes you have a security review, a compliance officer, and a CFO who reads the contract. Everything is signed, cited, and reversible.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#" className="inline-flex items-center gap-2 bg-background/10 hover:bg-background/15 border border-background/10 px-4 py-2.5 rounded-lg text-[13px] transition-colors">
                Security brief (PDF)
                <ArrowUpRight size={13} />
              </a>
              <a href="#" className="inline-flex items-center gap-2 border border-background/15 px-4 py-2.5 rounded-lg text-[13px] hover:bg-background/5 transition-colors">
                Integrations
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-3">
            {items.map((i) => (
              <div key={i.title} className="bg-background/5 border border-background/10 rounded-xl p-5">
                <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
                  <i.icon size={16} />
                </div>
                <h3 className="text-[14px] font-semibold mb-1.5">{i.title}</h3>
                <p className="text-[12.5px] text-background/60 leading-relaxed">{i.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ CTA ------------------------------ */

function CTA() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10">
        <div className="bg-gradient-to-br from-accent via-surface to-accent border border-border rounded-3xl p-10 md:p-16 text-center">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">14-day pilot</span>
          <h2 className="font-display text-[40px] md:text-[56px] leading-[1.02] tracking-[-0.025em] font-semibold mt-3 max-w-3xl mx-auto">
            Wire one signal. Watch one outcome close.
          </h2>
          <p className="mt-5 text-[16px] text-muted-foreground max-w-xl mx-auto">
            We sit between your calls and your CRM for two weeks. You decide what auto-ships. No procurement until you've seen the receipts.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/try"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3.5 rounded-xl shadow-[0_8px_24px_-8px_oklch(0.68_0.19_38/0.55)] hover:translate-y-[-1px] transition-all"
            >
              Start a pilot
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/console"
              className="inline-flex items-center justify-center gap-2 bg-surface border border-border text-foreground font-medium px-6 py-3.5 rounded-xl hover:bg-accent transition-colors"
            >
              Tour the console
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Footer ------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between text-[12px] text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <Logo size={18} />
          <span className="font-display font-semibold tracking-tight">Ledgerline</span>
          <span className="text-muted-foreground font-normal ml-2">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#autonomy" className="hover:text-foreground">Autonomy</a>
          <a href="#outcomes" className="hover:text-foreground">Outcomes</a>
          <a href="#security" className="hover:text-foreground">Security</a>
          <Link to="/console" className="hover:text-foreground">Console</Link>
          <a href="mailto:hello@ledgerline.app" className="hover:text-foreground">hello@ledgerline.app</a>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------ Shared ------------------------------ */

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="max-w-2xl">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">{eyebrow}</span>
      <h2 className="font-display text-[36px] md:text-[44px] leading-[1.05] tracking-[-0.025em] font-semibold mt-3">
        {title}
      </h2>
      <p className="mt-4 text-[16px] text-muted-foreground leading-relaxed">{sub}</p>
    </div>
  );
}
