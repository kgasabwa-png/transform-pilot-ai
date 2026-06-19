import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { ArrowRight, Calendar, FileText, Mail, Play, ShieldCheck, Sparkles, StickyNote, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyvlo | What you forgot, found" },
      { name: "description", content: "Nyvlo finds missed follow-ups, promises, and next steps from your workweek, then drafts the reply before anything slips" },
      { property: "og:title", content: "Nyvlo | What you forgot, found" },
      { property: "og:description", content: "Missed follow-ups, promises, and next steps found before they slip" },
    ],
  }),
  component: Landing,
});

const demoItems = [
  { icon: Calendar, title: "Send pricing deck to Sarah", source: "Pricing sync", status: "Overdue two days", tone: "danger" },
  { icon: Mail, title: "Reply to David at Luma", source: "Email thread", status: "Overdue three days", tone: "danger" },
  { icon: StickyNote, title: "Share Q3 roadmap with Maria", source: "Saved note", status: "Due today", tone: "warning" },
  { icon: FileText, title: "Prep notes for Luma interview", source: "Calendar event", status: "Friday 2 PM", tone: "primary" },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased nyvlo-grain">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex items-center">
            <NyvloMark size="md" />
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
            <a href="#demo" className="transition-colors hover:text-foreground">Demo</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#proof" className="transition-colors hover:text-foreground">Proof</a>
            <Link to="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          </nav>
          <div className="flex items-center gap-1">
            <Link to="/auth" className="hidden rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground md:inline">Sign in</Link>
            <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3.5 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="nyvlo-aurora" />
          <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
            <div className="mx-auto max-w-4xl text-center nyvlo-reveal">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
                <Sparkles className="h-3 w-3 text-primary" strokeWidth={1.75} />
                Private beta open now
              </div>
              <h1 className="mx-auto max-w-4xl text-balance text-[48px] font-semibold leading-[0.92] tracking-[-0.05em] text-foreground md:text-[88px]">
                Nyvlo is what you forgot
              </h1>
              <p className="mx-auto mt-7 max-w-[46ch] text-[17px] leading-[1.55] text-muted-foreground md:text-[19px]">
                An AI work memory that finds missed follow-ups, promises, and next steps before they become awkward
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
                <Link to="/auth" className="group inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-90">
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link to="/try" className="inline-flex items-center gap-2 rounded-md border border-border bg-card/80 px-4 py-2.5 text-[14px] font-medium text-foreground backdrop-blur transition-colors hover:bg-muted">
                  <Play className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.75} />
                  Watch demo
                </Link>
              </div>
              <div className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                Free tier included  Google in thirty seconds  No card required
              </div>
            </div>

            <div id="demo" className="mx-auto mt-14 max-w-6xl md:mt-18">
              <ProductDemo />
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/65">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-3 md:px-8">
            <ProofMetric value="10" label="free captures each month" />
            <ProofMetric value="30m" label="per capture on the free plan" />
            <ProofMetric value="$18" label="for unlimited work memory" />
          </div>
        </section>

        <section className="bg-background">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 md:grid-cols-[0.95fr,1.05fr] md:px-8 md:py-28">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">The moment</p>
              <blockquote className="mt-5 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground md:text-[52px]">
                “I told Sarah I would send that two days ago”
              </blockquote>
            </div>
            <div className="max-w-xl text-[17px] leading-[1.65] text-muted-foreground">
              Nyvlo catches the promise, finds the person waiting, and gives you the draft while there is still time to look reliable
            </div>
          </div>
        </section>

        <section id="how" className="border-y border-border bg-secondary/35">
          <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-28">
            <div className="max-w-2xl">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
              <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.04em] md:text-[48px]">Three quiet moves every day</h2>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              <Feature step="01" icon={Calendar} title="Reads your calendar" body="Meeting titles, times, and attendees grounded in real context" />
              <Feature step="02" icon={StickyNote} title="Remembers anywhere" body="Save a promise from any page, email, or document in one click" />
              <Feature step="03" icon={Sparkles} title="Catches what slipped" body="Overdue follow-ups and unanswered replies turned into ready-to-send drafts" />
            </div>
          </div>
        </section>

        <section id="proof" className="bg-card">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 md:grid-cols-[1.05fr,1fr] md:px-8 md:py-28">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Friday recap</p>
              <h3 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.04em] md:text-[48px]">A reliability score worth sharing</h3>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
                Every Friday Nyvlo tracks the promises you made and the ones it helped you keep
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Week of Jun 16</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">Beta 04</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
                <Stat label="Made" value="27" />
                <Stat label="Kept" value="24" />
                <Stat label="Caught" value="3" tone="primary" />
              </div>
              <div className="mt-5 rounded-lg border border-border bg-secondary/50 p-6 text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Reliability score</div>
                <div className="mt-2 text-[64px] font-semibold leading-none tracking-[-0.04em] text-primary tabular-nums">89</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-24 text-center md:px-8 md:py-28">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
            <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <h2 className="mt-5 text-[30px] font-semibold tracking-[-0.03em] md:text-[40px]">Yours and only yours</h2>
          <p className="mx-auto mt-5 max-w-[50ch] text-[15.5px] leading-relaxed text-muted-foreground">
            Nyvlo only remembers what you save or connect with no silent capture or employer monitoring
          </p>
        </section>

        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-3xl px-5 py-24 text-center md:px-8 md:py-28">
            <h2 className="text-[38px] font-semibold leading-[1.02] tracking-[-0.045em] md:text-[64px]">Start tomorrow sharper</h2>
            <p className="mx-auto mt-5 max-w-[40ch] text-[15.5px] text-muted-foreground">
              Connect Google and get set up in under a minute
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              <Link to="/auth" className="group inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-90">
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted">
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-8 text-[12px] text-muted-foreground md:flex-row md:items-center md:px-8">
          <div className="flex items-center gap-3">
            <NyvloMark size="sm" />
            <span className="text-muted-foreground/80">© 2026 Nyvlo Inc</span>
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

function ProductDemo() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-demo)]">
      <div className="flex items-center justify-between border-b border-border bg-secondary/55 px-4 py-3">
        <div className="flex items-center gap-2">
          <NyvloMark size="sm" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Work memory</span>
        </div>
        <div className="hidden items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground sm:flex">
          <span>Live scan</span>
          <span>⌘J</span>
        </div>
      </div>

      <div className="grid min-h-[520px] md:grid-cols-[240px,1fr,300px]">
        <aside className="hidden border-r border-border bg-secondary/30 p-4 md:block">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Sources</div>
          <div className="mt-4 space-y-2">
            {[
              [Calendar, "Calendar", "18 events"],
              [Mail, "Gmail", "124 threads"],
              [StickyNote, "Saved notes", "9 captures"],
            ].map(([Icon, label, count]) => {
              const SourceIcon = Icon as LucideIcon;
              return (
                <div key={label as string} className="flex items-center gap-3 rounded-md border border-border bg-background/70 px-3 py-2.5">
                  <SourceIcon className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{label as string}</div>
                    <div className="font-mono text-[10.5px] text-muted-foreground">{count as string}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 rounded-md border border-border bg-background/70 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">AI confidence</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[86%] rounded-full bg-primary" />
            </div>
            <div className="mt-2 text-[12px] text-muted-foreground">86 percent context match</div>
          </div>
        </aside>

        <section className="relative p-4 md:p-6">
          <div className="pointer-events-none absolute left-0 right-0 top-20 h-20 bg-primary/10 blur-2xl nyvlo-scan-line" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Needs attention</div>
              <h3 className="mt-1 text-[24px] font-semibold tracking-[-0.035em] text-foreground md:text-[32px]">Four open loops found</h3>
            </div>
            <div className="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              Updated now
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {demoItems.map((item) => (
              <DemoRow key={item.title} item={item} />
            ))}
          </div>
        </section>

        <aside className="border-t border-border bg-secondary/25 p-4 md:border-l md:border-t-0 md:p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Draft preview</div>
          <div className="mt-4 rounded-lg border border-border bg-background p-4">
            <div className="text-[13px] font-medium text-foreground">To Sarah Chen</div>
            <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
              <p>Hi Sarah</p>
              <p>Sorry for the delay here</p>
              <p>I pulled the pricing deck together and added the rollout notes from our sync</p>
              <p>Sending it now</p>
            </div>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-3 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90">
              Send draft
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniStat label="Saved" value="18m" />
            <MiniStat label="Risk" value="High" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function DemoRow({ item }: { item: { icon: LucideIcon; title: string; source: string; status: string; tone: string } }) {
  const Icon = item.icon;
  const toneClass = item.tone === "danger" ? "text-danger" : item.tone === "warning" ? "text-warning" : "text-primary";
  return (
    <div className="group grid gap-3 rounded-lg border border-border bg-background px-3 py-3 transition-colors hover:bg-secondary/40 sm:grid-cols-[auto,1fr,auto] sm:items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[14.5px] font-medium leading-tight text-foreground">{item.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          <span>{item.source}</span>
          <span className={toneClass}>{item.status}</span>
        </div>
      </div>
      <button className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
        Draft
      </button>
    </div>
  );
}

function ProofMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-[42px] font-semibold leading-none tracking-[-0.045em] text-foreground">{value}</div>
      <div className="max-w-[16ch] text-[14px] leading-snug text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({ step, icon: Icon, title, body }: { step: string; icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground">{step}</span>
        <span className="h-px flex-1 bg-border" />
        <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={["mt-1 text-[26px] font-semibold tracking-[-0.03em] tabular-nums", tone === "primary" ? "text-primary" : "text-foreground"].join(" ")}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-foreground">{value}</div>
    </div>
  );
}
