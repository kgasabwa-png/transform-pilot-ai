import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { ArrowRight, Calendar, ShieldCheck, Sparkles, Mail, FileText, StickyNote } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyvlo · Catch what you forgot before anyone notices" },
      { name: "description", content: "Nyvlo quietly tracks the follow-ups, promises, and loose ends slipping through your week, then drafts the reply for you. Free during beta." },
      { property: "og:title", content: "Nyvlo · Catch what you forgot before anyone notices" },
      { property: "og:description", content: "The follow-ups, promises, and loose ends slipping through your week, surfaced before they cost you." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <NyvloMark size="lg" />
        </Link>
        <nav className="hidden items-center gap-7 text-[13.5px] text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden text-[13px] text-muted-foreground hover:text-foreground md:inline">Sign in</Link>
          <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90">
            Get started
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 nyvlo-grain opacity-60" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-[11.5px] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary nyvlo-dot-pulse" />
              Now in private beta
            </div>
            <h1 className="text-balance text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[68px]">
              Catch what you forgot<br className="hidden md:block" /> before anyone notices
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground md:text-[17px]">
              Nyvlo quietly tracks the follow-ups, promises, and loose ends slipping through your week, then drafts the reply for you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-[14px] font-medium text-background hover:opacity-90">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/try" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-[14px] font-medium text-foreground hover:bg-muted">
                Try the demo →
              </Link>
            </div>
            <div className="mt-3 text-[11.5px] text-muted-foreground">Free during beta · connect Google in 30 seconds · no credit card</div>
          </div>

          {/* product preview card */}
          <div className="mx-auto mt-14 max-w-3xl">
            <PreviewCard />
          </div>
        </div>
      </section>

      {/* THE MOMENT */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The Nyvlo moment</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-[30px] font-semibold leading-tight tracking-tight md:text-[40px]">
            "Oh shit, I told Sarah I'd send that two days ago."
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[15px] leading-relaxed text-muted-foreground">
            Everyone has felt this. Nyvlo is the moment <em className="not-italic text-foreground">before</em> it, when something quietly nudges you with the promise you made, the person waiting, and the draft already written.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-3">
          <Feature icon={Calendar} title="Grounded in your calendar" body="Nyvlo reads meeting titles, times, and attendees, then grounds every commitment in real context." />
          <Feature icon={StickyNote} title="Remember this, anywhere" body="One click on any page, email, or doc captures the moment: a promise, an ask, a file to send." />
          <Feature icon={Sparkles} title="Catches what slipped" body="Overdue follow-ups, unanswered emails, the doc you said you'd send. Drafts ready, one tap to ship." />
        </div>
      </section>

      {/* SCORE */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-20 md:grid-cols-[1.1fr,1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Friday recap</p>
            <h3 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">A reliability score people screenshot</h3>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Every Friday, Nyvlo tells you how many promises you made, how many you kept, and how many would have slipped without it.
            </p>
          </div>
          <div className="nyvlo-card p-6">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Week of Jun 16</span>
              <span className="font-mono text-[11px] text-muted-foreground">v0.4</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Stat label="Made" value="27" />
              <Stat label="Kept" value="24" />
              <Stat label="Caught" value="3" tone="primary" />
            </div>
            <div className="mt-6 rounded-lg bg-secondary/60 p-5 text-center">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Reliability score</div>
              <div className="mt-1 text-[52px] font-semibold leading-none tracking-tight text-primary">89</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section id="privacy" className="mx-auto max-w-4xl px-6 py-20 text-center">
        <ShieldCheck className="mx-auto h-7 w-7 text-primary" strokeWidth={1.5} />
        <h2 className="mt-4 text-[28px] font-semibold tracking-tight md:text-[34px]">Yours. Only yours.</h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Nyvlo only remembers what you save or connect. No silent browsing capture. No employer dashboard. Pause anytime. Delete everything in one click.
        </p>
      </section>

      {/* INSTALL / CTA */}
      <section id="install" className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-[34px] font-semibold tracking-tight md:text-[44px]">Never drop the ball again.</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">Sign up. Connect Google. You're set in under a minute.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-[14px] font-medium text-background hover:opacity-90">
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <NyvloMark />
            <span>© 2026 Nyvlo</span>
          </div>
          <div className="flex items-center gap-5">
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

function Feature({ icon: Icon, title, body }: { icon: typeof Calendar; title: string; body: string }) {
  return (
    <div>
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-[24px] font-semibold tracking-tight ${tone === "primary" ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function PreviewCard() {
  const rows = [
    { dot: "bg-danger",  title: "Send pricing deck to Sarah",  meta: "Acme · overdue 2 days",  src: "from meeting · pricing sync", Icon: Mail },
    { dot: "bg-danger",  title: "Reply to David at Luma",      meta: "interview slot · overdue 3 days", src: "from email", Icon: Mail },
    { dot: "bg-warning", title: "Share Q3 roadmap with Maria", meta: "Northwind · due today",  src: "from manual note", Icon: StickyNote },
    { dot: "bg-primary", title: "Prep notes for Luma interview", meta: "Friday 2pm",            src: "from calendar", Icon: FileText },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-30px_rgba(15,15,30,0.18)]">
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <NyvloMark size="sm" />
          Nyvlo · Today
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">⌘J ask anything</div>
      </div>
      <div className="px-5 py-5">
        <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Things needing attention</div>
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.title} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
              <span className={`h-2 w-2 rounded-full ${r.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">{r.title}</div>
                <div className="truncate text-[11.5px] text-muted-foreground">{r.meta} · {r.src}</div>
              </div>
              <button className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground/80">Send</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
