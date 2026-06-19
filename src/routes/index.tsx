import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { ArrowRight, Calendar, ShieldCheck, Sparkles, Mail, FileText, StickyNote } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyvlo | The AI that catches what you forgot" },
      { name: "description", content: "Automated follow-ups and promise tracking for busy teams" },
      { property: "og:title", content: "Nyvlo | The AI that catches what you forgot" },
      { property: "og:description", content: "Nyvlo finds the follow-ups, promises, and loose ends slipping through your week" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center">
          <NyvloMark size="md" />
        </Link>
        <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#recap" className="transition-colors hover:text-foreground">Friday recap</a>
          <Link to="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
        </nav>
        <div className="flex items-center gap-1">
          <Link to="/auth" className="hidden rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground md:inline">Sign in</Link>
          <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3.5 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90">
            Get started
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="nyvlo-aurora" />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary nyvlo-dot-pulse" />
              Private beta v0.4
            </div>
            <h1 className="text-balance text-[44px] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground md:text-[80px]">
              The AI that catches<br className="hidden md:block" /> what you forgot
            </h1>
            <p className="mx-auto mt-7 max-w-[36ch] text-[16.5px] leading-[1.55] text-muted-foreground md:text-[18px]">
              Nyvlo tracks every promise and follow-up slipping through your week then drafts the reply for you
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
              <Link to="/auth" className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-90">
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/try" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted">
                See the demo
              </Link>
            </div>
            <div className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              Free during beta / Google in 30s / No card required
            </div>
          </div>

          {/* product preview */}
          <div className="mx-auto mt-16 max-w-3xl md:mt-20">
            <PreviewCard />
          </div>
        </div>
      </section>

      {/* MOMENT */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-28">
          <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">The Nyvlo moment</p>
          <blockquote className="mx-auto mt-5 max-w-2xl text-center text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground md:text-[44px]">
            &ldquo;I told Sarah I&rsquo;d send that two days ago.&rdquo;
          </blockquote>
          <p className="mx-auto mt-6 max-w-[44ch] text-center text-[15.5px] leading-relaxed text-muted-foreground">
            The nudge that arrives before the guilt, with the promise you made, the person waiting, and the draft already written
          </p>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
          <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.03em] md:text-[40px]">Three quiet moves every day</h2>
        </div>
        <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
          <Feature step="01" icon={Calendar} title="Reads your calendar" body="Meeting titles, times, and attendees grounded in real context" />
          <Feature step="02" icon={StickyNote} title="Remembers, anywhere" body="Save a promise from any page, email, or document in a single click" />
          <Feature step="03" icon={Sparkles} title="Catches what slipped" body="Overdue follow-ups and unanswered replies turned into ready-to-ship drafts" />
        </div>
      </section>

      {/* RECAP */}
      <section id="recap" className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-24 md:grid-cols-[1.05fr,1fr] md:py-28">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Friday recap</p>
            <h3 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.03em] md:text-[38px]">A reliability score worth sharing</h3>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-muted-foreground">
              Every Friday Nyvlo tracks the promises you made and the ones it helped you keep
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6 shadow-[0_20px_60px_-30px_rgba(15,15,30,0.15)]">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Week of Jun 16</span>
              <span className="font-mono text-[10.5px] text-muted-foreground">v0.4</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
              <Stat label="Made" value="27" />
              <Stat label="Kept" value="24" />
              <Stat label="Caught" value="3" tone="primary" />
            </div>
            <div className="mt-5 rounded-xl border border-border bg-secondary/50 p-6 text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Reliability score</div>
              <div className="mt-2 text-[64px] font-semibold leading-none tracking-[-0.04em] text-primary tabular-nums">89</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center md:py-28">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
          <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.75} />
        </div>
        <h2 className="mt-5 text-[30px] font-semibold tracking-[-0.03em] md:text-[40px]">Yours and only yours</h2>
        <p className="mx-auto mt-5 max-w-[50ch] text-[15.5px] leading-relaxed text-muted-foreground">
          Nyvlo only remembers what you save or connect with no silent capture or employer monitoring
        </p>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-28">
          <h2 className="text-[36px] font-semibold leading-[1.02] tracking-[-0.04em] md:text-[56px]">Never drop the ball again</h2>
          <p className="mx-auto mt-5 max-w-[40ch] text-[15.5px] text-muted-foreground">
            Connect Google and get set up in under a minute
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <Link to="/auth" className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-90">
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-[12px] text-muted-foreground md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <NyvloMark size="sm" />
            <span className="text-muted-foreground/80">© 2026 Nyvlo, Inc</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <a href="mailto:keila@nyvloai.com" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ step, icon: Icon, title, body }: { step: string; icon: typeof Calendar; title: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground">{step}</span>
        <span className="h-px flex-1 bg-border" />
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-[26px] font-semibold tracking-[-0.03em] tabular-nums ${tone === "primary" ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function PreviewCard() {
  const rows = [
    { dot: "bg-danger",  title: "Send pricing deck to Sarah",     meta: "Acme / overdue 2 days",         src: "from meeting / pricing sync", Icon: Mail },
    { dot: "bg-danger",  title: "Reply to David at Luma",         meta: "Interview slot / overdue 3 days", src: "from email",                Icon: Mail },
    { dot: "bg-warning", title: "Share Q3 roadmap with Maria",    meta: "Northwind / due today",         src: "from manual note",            Icon: StickyNote },
    { dot: "bg-primary", title: "Prep notes for Luma interview",  meta: "Friday 2:00 PM",                src: "from calendar",               Icon: FileText },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_40px_120px_-40px_rgba(15,15,30,0.25)]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="mx-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <NyvloMark size="sm" />
          <span className="text-muted-foreground/70">/ today</span>
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">⌘J</div>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Needs attention</span>
          <span className="font-mono text-[10.5px] text-muted-foreground tabular-nums">4 open</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <div key={r.title} className="group flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3 transition-colors hover:bg-secondary/40">
              <span className={`h-2 w-2 shrink-0 rounded-full ${r.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium leading-tight">{r.title}</div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{r.meta} / {r.src}</div>
              </div>
              <button className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground/80 transition-colors group-hover:bg-foreground group-hover:text-background">
                Send
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
