import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";
import {
  ArrowRight,
  Calendar,
  ShieldCheck,
  Sparkles,
  Mail,
  FileText,
  StickyNote,
  Command,
  Zap,
  Lock,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyvlo · The AI memory layer for the things you forget" },
      { name: "description", content: "Nyvlo is the quiet AI that catches the follow-ups, promises and loose ends slipping through your week — and drafts the reply before anyone notices." },
      { property: "og:title", content: "Nyvlo · The AI memory layer for the things you forget" },
      { property: "og:description", content: "The quiet AI that catches what you forgot, before anyone notices." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background text-foreground">
      {/* Ambient atmosphere */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[820px] nyvlo-aurora" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[820px] nyvlo-grid opacity-[0.55]" />

      <Nav />

      <Hero />

      <Marquee />

      <MomentSection />

      <BentoSection />

      <ScoreSection />

      <PrivacySection />

      <PricingTeaser />

      <FinalCta />

      <Footer />
    </div>
  );
}

/* --------------------------------- Nav --------------------------------- */

function Nav() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center">
          <NyvloMark size="md" animated withWordmark />
        </Link>
        <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#bento" className="transition-colors hover:text-foreground">Product</a>
          <Link to="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link to="/auth" className="hidden text-[13px] text-muted-foreground transition-colors hover:text-foreground md:inline">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="btn-ion inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------- Hero --------------------------------- */

function Hero() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-14 md:pb-32 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="nyvlo-rise mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11.5px] font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary nyvlo-dot-pulse" />
            Now in private beta · invites going out weekly
          </div>

          <h1 className="nyvlo-rise font-display text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.025em] text-foreground md:text-[76px]">
            Catch what you forgot
            <br className="hidden md:block" />{" "}
            <span className="nyvlo-shimmer">before anyone notices</span>
          </h1>

          <p className="nyvlo-rise mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-muted-foreground md:text-[18px]" style={{ animationDelay: "120ms" }}>
            Nyvlo is the quiet AI memory layer for your week. It listens to your calendar,
            emails and notes, then surfaces the promise you made, the person waiting,
            and the draft already written.
          </p>

          <div className="nyvlo-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
            <Link
              to="/auth"
              className="btn-ion inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14.5px] font-semibold"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#bento"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              See it work ↓
            </a>
          </div>

          <div className="nyvlo-rise mt-4 text-[11.5px] text-muted-foreground" style={{ animationDelay: "320ms" }}>
            Free forever for 10 captures/mo · no credit card · 30-second Google connect
          </div>
        </div>

        {/* Centerpiece product canvas */}
        <div className="nyvlo-rise mx-auto mt-16 max-w-5xl" style={{ animationDelay: "420ms" }}>
          <HeroCanvas />
        </div>
      </div>
    </section>
  );
}

function HeroCanvas() {
  return (
    <div className="relative">
      {/* glow halo */}
      <div className="pointer-events-none absolute -inset-x-10 -top-10 -bottom-10 -z-10 rounded-[40px] bg-gradient-to-b from-primary/15 via-transparent to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-border nyvlo-glass shadow-[0_50px_120px_-40px_rgba(0,0,0,0.55)]">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <div className="ml-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <NyvloMark size="sm" /> Nyvlo · Today
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1 font-mono text-[10.5px] text-muted-foreground md:flex">
            <Command className="h-3 w-3" /> J · ask anything
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.4fr,1fr]">
          {/* left — the feed */}
          <div className="p-5 md:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                Slipping through your week
              </div>
              <div className="text-[11px] text-muted-foreground">3 caught · 1 drafted</div>
            </div>
            <div className="flex flex-col gap-2.5">
              <FeedRow
                tone="danger"
                Icon={Mail}
                title="Send pricing deck to Sarah"
                meta="Acme · overdue 2 days · drafted ✓"
                cta="Send"
              />
              <FeedRow
                tone="warning"
                Icon={Mail}
                title="Reply to David at Luma"
                meta="interview slot · overdue 3 days"
                cta="Draft"
              />
              <FeedRow
                tone="ion"
                Icon={StickyNote}
                title="Share Q3 roadmap with Maria"
                meta="Northwind · due today"
                cta="Open"
              />
              <FeedRow
                tone="muted"
                Icon={FileText}
                title="Prep notes for Luma interview"
                meta="Friday 2pm · from calendar"
                cta="Prep"
              />
            </div>
          </div>

          {/* right — the score */}
          <div className="relative border-t border-border bg-gradient-to-b from-card to-background p-6 md:border-l md:border-t-0">
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
              Friday recap
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-[64px] font-semibold leading-none tracking-tight text-foreground">89</span>
              <span className="text-[12px] text-muted-foreground">reliability</span>
            </div>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10.5px] font-medium text-primary">
              ↑ 6 vs last week
            </div>

            <div className="mt-6 space-y-2.5">
              <ScoreBar label="Made" value={27} total={30} />
              <ScoreBar label="Kept" value={24} total={30} accent />
              <ScoreBar label="Caught by Nyvlo" value={3} total={30} ion />
            </div>

            <div className="mt-6 rounded-lg border border-border bg-background/40 p-3 text-[11.5px] text-muted-foreground">
              <span className="text-foreground">"Quietest tool I use."</span> — Daniel,
              founder · Y Combinator W25
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedRow({
  tone,
  Icon,
  title,
  meta,
  cta,
}: {
  tone: "danger" | "warning" | "ion" | "muted";
  Icon: typeof Mail;
  title: string;
  meta: string;
  cta: string;
}) {
  const dot =
    tone === "danger" ? "bg-danger" :
    tone === "warning" ? "bg-warning" :
    tone === "ion" ? "bg-primary" : "bg-muted-foreground/50";
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3.5 py-2.5 transition-colors hover:border-primary/40 hover:bg-background/70">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium text-foreground">{title}</div>
        <div className="truncate text-[11.5px] text-muted-foreground">{meta}</div>
      </div>
      <button className="rounded-md border border-border bg-background/60 px-2.5 py-1 text-[11px] font-medium text-foreground/80 transition-colors group-hover:border-primary/40 group-hover:text-foreground">
        {cta}
      </button>
    </div>
  );
}

function ScoreBar({ label, value, total, accent, ion }: { label: string; value: number; total: number; accent?: boolean; ion?: boolean }) {
  const pct = Math.round((value / total) * 100);
  const fill = ion ? "bg-primary" : accent ? "bg-success" : "bg-foreground/40";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/8">
        <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------ Marquee logos ----------------------------- */

function Marquee() {
  const items = [
    "Gmail", "Google Calendar", "Notion", "Linear", "Slack", "Granola",
  ];
  return (
    <section className="relative border-y border-border/60 bg-background/40">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="text-center text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          Drops into the tools you already live in
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[13px] font-medium text-muted-foreground/80">
          {items.map((i) => (
            <span key={i} className="opacity-80 transition-opacity hover:opacity-100">{i}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ The moment ------------------------------ */

function MomentSection() {
  return (
    <section id="moment" className="relative">
      <div className="mx-auto max-w-5xl px-6 py-28 md:py-36">
        <p className="text-center text-[10.5px] uppercase tracking-[0.22em] text-primary/80">
          The Nyvlo moment
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-center font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground md:text-[52px]">
          <span className="text-muted-foreground/70">"Oh shit, I told Sarah I'd send that</span>{" "}
          <span className="text-foreground">two days ago.</span>
          <span className="text-muted-foreground/70">"</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-center text-[15.5px] leading-relaxed text-muted-foreground">
          Everyone has felt this. Nyvlo is the moment <span className="text-foreground">before</span> it,
          when something quietly nudges you with the promise you made, the person waiting,
          and the draft already written.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------- Bento -------------------------------- */

function BentoSection() {
  return (
    <section id="bento" className="relative border-t border-border/60 bg-gradient-to-b from-background to-card/30">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-primary/80">How it works</p>
          <h2 id="how" className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] md:text-[46px]">
            One quiet layer. Three superpowers.
          </h2>
          <p className="mt-4 text-[15.5px] text-muted-foreground">
            No new app to babysit. Nyvlo lives behind your tools and only speaks up
            when something is about to slip.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-6 md:grid-rows-2">
          {/* Big: Calendar grounding */}
          <BentoCard className="md:col-span-4 md:row-span-1">
            <BentoHeader
              icon={Calendar}
              eyebrow="Context"
              title="Grounded in your calendar"
              body="Nyvlo reads meeting titles, times and attendees, then grounds every commitment in real context — never a hallucinated reminder."
            />
            <div className="mt-6 grid grid-cols-3 gap-2">
              {["09:00 Standup", "11:30 Sarah · Acme pricing sync", "14:00 Luma interview"].map((t, i) => (
                <div key={t} className={`rounded-md border border-border bg-background/40 p-2.5 text-[11px] ${i === 1 ? "ring-1 ring-primary/40" : ""}`}>
                  <div className="font-mono text-[10px] text-muted-foreground">{t.split(" ")[0]}</div>
                  <div className="mt-0.5 truncate text-foreground/90">{t.split(" ").slice(1).join(" ")}</div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Square: Capture */}
          <BentoCard className="md:col-span-2 md:row-span-1">
            <BentoHeader
              icon={StickyNote}
              eyebrow="Capture"
              title="One key, anywhere"
              body="Highlight on any page, email or doc. ⌘K captures the promise."
            />
            <div className="mt-5 rounded-md border border-border bg-background/40 p-3 font-mono text-[11px] text-muted-foreground">
              <span className="text-primary">⌘K</span> → "send Maria the Q3 deck Friday"
            </div>
          </BentoCard>

          {/* Square: Drafts */}
          <BentoCard className="md:col-span-2 md:row-span-1">
            <BentoHeader
              icon={Zap}
              eyebrow="Action"
              title="Drafts, not nags"
              body="Every reminder ships with a draft reply ready to send."
            />
            <div className="mt-5 rounded-md border border-border bg-background/40 p-3 text-[11.5px] text-foreground/90">
              <span className="text-muted-foreground">Draft · Gmail · </span>"Hi Sarah, sorry for the delay — here's the deck…"
            </div>
          </BentoCard>

          {/* Big: Reliability score */}
          <BentoCard className="md:col-span-4 md:row-span-1">
            <BentoHeader
              icon={Sparkles}
              eyebrow="Friday recap"
              title="A reliability score people screenshot"
              body="Every Friday Nyvlo tells you how many promises you made, kept, and would have dropped without it. The receipt of a reliable week."
            />
            <div className="mt-5 flex items-end gap-6">
              <div>
                <div className="font-display text-[56px] font-semibold leading-none text-foreground">89</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">this week</div>
              </div>
              <div className="flex flex-1 items-end gap-1.5">
                {[42, 58, 51, 67, 74, 82, 89].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary/20 to-primary" style={{ height: `${h * 0.6}px` }} />
                ))}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

function BentoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30 ${className}`}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
      {children}
    </div>
  );
}

function BentoHeader({ icon: Icon, eyebrow, title, body }: { icon: typeof Calendar; eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/60 text-primary">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</span>
      </div>
      <h3 className="mt-3 font-display text-[19px] font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

/* ----------------------------- Score deep dive ---------------------------- */

function ScoreSection() {
  return (
    <section className="relative border-t border-border/60">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-[1.1fr,1fr] md:py-32">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-primary/80">Built for the people who promise a lot</p>
          <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] md:text-[44px]">
            Founders, operators, and people who say <span className="italic text-muted-foreground">"I'll send that later."</span>
          </h2>
          <ul className="mt-7 space-y-3 text-[14.5px] text-foreground/90">
            {[
              "Catch the email you forgot to reply to before they ping you again.",
              "Walk into every meeting knowing what you promised last time.",
              "Never lose a customer because a follow-up died in your drafts.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-2xl" />
          <div className="nyvlo-card overflow-hidden p-6">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Week of Jun 16</div>
              <div className="font-mono text-[10.5px] text-muted-foreground">v0.4 · beta</div>
            </div>
            <div className="mt-6 flex items-baseline gap-3">
              <div className="font-display text-[88px] font-semibold leading-none tracking-tight text-foreground">89</div>
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">reliability</div>
                <div className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10.5px] font-medium text-success">↑ 6</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2.5">
              <Stat label="Made" value="27" />
              <Stat label="Kept" value="24" />
              <Stat label="Caught" value="3" tone="primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-[26px] font-semibold tracking-tight ${tone === "primary" ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

/* --------------------------------- Privacy -------------------------------- */

function PrivacySection() {
  return (
    <section id="privacy" className="relative border-t border-border/60 bg-background">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary">
          <Lock className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <h2 className="mt-6 font-display text-[32px] font-semibold tracking-[-0.02em] md:text-[44px]">
          Yours, only yours
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
          Nyvlo only remembers what you save or connect. No silent browsing capture.
          No employer dashboard. Pause anytime. Delete everything in one click.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[11.5px] text-muted-foreground">
          {["End-to-end encrypted", "SOC2 in progress", "EU + US residency", "Open data export"].map((t) => (
            <span key={t} className="rounded-full border border-border bg-card/60 px-2.5 py-1">{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Pricing teaser ---------------------------- */

function PricingTeaser() {
  return (
    <section className="relative border-t border-border/60 bg-gradient-to-b from-card/40 to-background">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-28">
        <div className="text-center">
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-primary/80">Pricing</p>
          <h2 className="mt-3 font-display text-[32px] font-semibold tracking-[-0.02em] md:text-[42px]">
            Start free. Upgrade when Nyvlo earns it.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="nyvlo-card relative p-7">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Free</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-[44px] font-semibold tracking-tight">$0</span>
              <span className="text-[13px] text-muted-foreground">forever</span>
            </div>
            <ul className="mt-5 space-y-2 text-[13.5px] text-foreground/90">
              <li>10 captures per month</li>
              <li>30-min sessions</li>
              <li>7-day memory · browser only</li>
            </ul>
            <Link to="/auth" className="btn-ghost mt-7 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-[13.5px] font-medium">
              Start free
            </Link>
          </div>

          <div className="nyvlo-card relative overflow-hidden p-7 ring-1 ring-primary/30">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.18em] text-primary">Pro · yearly</div>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10.5px] font-medium text-primary">Save $72</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-[44px] font-semibold tracking-tight">$12</span>
              <span className="text-[13px] text-muted-foreground">/ month, billed yearly</span>
            </div>
            <ul className="mt-5 space-y-2 text-[13.5px] text-foreground/90">
              <li>Unlimited captures &amp; memory</li>
              <li>Desktop + browser + mobile</li>
              <li>Friday reliability score</li>
              <li>Priority support</li>
            </ul>
            <Link to="/pricing" className="btn-ion mt-7 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-[13.5px] font-semibold">
              See full pricing
            </Link>
            <div className="mt-3 text-center text-[11px] text-muted-foreground">
              Use code <span className="font-mono text-primary">EARLY50</span> · 50% off 3 months
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Final CTA ------------------------------ */

function FinalCta() {
  return (
    <section className="relative border-t border-border/60">
      <div className="relative mx-auto max-w-5xl overflow-hidden px-6 py-28 text-center md:py-36">
        <div className="pointer-events-none absolute inset-0 -z-10 nyvlo-aurora" />
        <div className="pointer-events-none absolute inset-0 -z-10 nyvlo-grid opacity-40" />
        <div className="nyvlo-float mx-auto mb-8 w-fit">
          <NyvloMark size="xl" animated />
        </div>
        <h2 className="font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[64px]">
          Never drop the ball again
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] text-muted-foreground">
          One minute to set up. Quiet for the rest of your week.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" className="btn-ion inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14.5px] font-semibold">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" /> No credit card · cancel anytime
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Footer -------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-[12px] text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <NyvloMark size="sm" withWordmark />
          <span className="ml-1">© 2026</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          <a href="mailto:keila@nyvloai.com" className="transition-colors hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}
