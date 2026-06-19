import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { ArrowRight, Calendar, Sparkles, StickyNote } from "lucide-react";

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

const display = { fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif" } as const;

function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* NAV */}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-8">
        <Link to="/" className="flex items-center gap-2">
          <NyvloMark size="lg" />
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] text-foreground/60 md:flex">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden text-[13px] text-foreground/60 hover:text-foreground md:inline">Sign in</Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 bg-foreground px-3.5 py-1.5 text-[12.5px] font-semibold text-background hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24">
        {/* HERO */}
        <section className="mb-24 w-full text-center">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary nyvlo-dot-pulse" />
            Private beta · v0.4
          </span>
          <h1
            style={display}
            className="mb-8 text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-balance md:text-[64px]"
          >
            Catch what you forgot<br className="hidden md:block" /> before anyone notices
          </h1>
          <p className="mx-auto mb-10 max-w-lg text-[16px] leading-relaxed text-foreground/65 md:text-[17px]">
            Nyvlo quietly tracks the follow-ups, promises, and loose ends slipping through your week, then drafts the reply for you.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-foreground px-7 py-3 text-[13.5px] font-semibold text-background hover:opacity-90"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/try"
              className="inline-flex items-center gap-1.5 border border-foreground px-7 py-3 text-[13.5px] font-semibold text-foreground hover:bg-secondary"
            >
              Try the demo
            </Link>
          </div>
          <div className="mt-5 text-[11.5px] text-foreground/45">
            Free during beta · connect Google in 30 seconds · no credit card
          </div>
        </section>

        {/* PRODUCT PREVIEW */}
        <section className="mb-24 w-full bg-secondary p-1">
          <div className="bg-background p-7 md:p-8">
            <div className="mb-7 flex items-center justify-between">
              <h3 style={display} className="text-[12px] font-semibold uppercase tracking-[0.18em]">
                Things needing attention
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/40">
                <span className="h-1.5 w-1.5 rounded-full bg-primary nyvlo-dot-pulse" />
                Live · Today
              </div>
            </div>
            <div className="flex flex-col">
              {[
                { dot: "bg-primary",        title: "Send pricing deck to Sarah",      meta: "Acme · overdue 2 days",        time: "from pricing sync" },
                { dot: "bg-primary",        title: "Reply to David at Luma",          meta: "Interview slot · overdue 3d",  time: "from email" },
                { dot: "bg-foreground/15",  title: "Share Q3 roadmap with Maria",     meta: "Northwind · due today",        time: "from manual note" },
                { dot: "bg-foreground/15",  title: "Prep notes for Luma interview",   meta: "Friday 2pm",                   time: "from calendar" },
              ].map((r, i, arr) => (
                <div
                  key={r.title}
                  className={`flex items-center justify-between py-3.5 ${i < arr.length - 1 ? "border-b border-foreground/5" : ""}`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.dot}`} />
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-medium">{r.title}</div>
                      <div className="truncate text-[11.5px] text-foreground/45">{r.meta}</div>
                    </div>
                  </div>
                  <span className="ml-4 hidden whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/40 sm:inline">
                    {r.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE NYVLO MOMENT */}
        <section className="mb-24 max-w-xl text-center">
          <p
            style={display}
            className="mb-6 text-[24px] font-semibold leading-snug tracking-tight md:text-[28px]"
          >
            "Oh shit, I told Sarah I'd send that two days ago."
          </p>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-foreground/40">
            The Nyvlo moment, the second before
          </span>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="mb-24 grid w-full grid-cols-1 gap-12 md:grid-cols-3">
          <Step n="01" icon={Calendar} title="Grounded in your calendar" body="Reads meeting titles, times, and attendees, then grounds every commitment in real context." />
          <Step n="02" icon={StickyNote} title="Remember this, anywhere" body="One click on any page, email, or doc captures the moment: a promise, an ask, a file to send." />
          <Step n="03" icon={Sparkles} title="Catches what slipped" body="Overdue follow-ups, unanswered emails, the doc you said you'd send. Drafts ready, one tap to ship." />
        </section>

        {/* RELIABILITY / FRIDAY RECAP */}
        <section className="mb-24 flex w-full flex-col gap-6 md:flex-row">
          <div className="flex flex-1 flex-col justify-center bg-secondary p-8">
            <h3 style={display} className="text-[56px] font-semibold leading-none tracking-[-0.02em]">
              89
            </h3>
            <p className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.2em] text-foreground/55">
              Reliability score · week of Jun 16
            </p>
          </div>
          <div className="flex flex-1 flex-col border border-foreground p-8">
            <h4 style={display} className="mb-5 text-[15px] font-semibold uppercase tracking-[0.14em]">
              Friday recap
            </h4>
            <div className="mb-6 grid grid-cols-3 gap-3 text-center">
              <Stat label="Made" value="27" />
              <Stat label="Kept" value="24" />
              <Stat label="Caught" value="3" accent />
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-foreground/70">
              3 promises would have slipped without Nyvlo. You kept 24 of 27 commitments.
            </p>
            <div className="h-[3px] w-full bg-secondary">
              <div className="h-full bg-primary" style={{ width: "89%" }} />
            </div>
          </div>
        </section>

        {/* PRIVACY */}
        <section className="mb-24 w-full border-y border-foreground/10 py-12 text-center">
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-foreground/40">
            Yours, only yours
          </p>
          <p className="text-[14px] font-medium text-foreground/80">
            Only what you save or connect. No silent capture. No employer dashboard. Pause anytime, delete everything in one click.
          </p>
        </section>

        {/* FINAL CTA */}
        <section className="mb-8 text-center">
          <h2
            style={display}
            className="mb-8 text-[36px] font-semibold tracking-tight md:text-[44px]"
          >
            Never drop the ball again
          </h2>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary px-10 py-4 text-[14px] font-semibold text-primary-foreground hover:opacity-90"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-5 text-[11.5px] text-foreground/45">
            Connect Google in 30 seconds · no credit card
          </p>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-foreground/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6 text-[12px] text-foreground/55">
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

function Step({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: string;
  icon: typeof Calendar;
  title: string;
  body: string;
}) {
  return (
    <div>
      <span style={display} className="mb-4 block text-[12px] font-bold tracking-widest text-primary">
        {n}
      </span>
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center bg-secondary">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <h4 style={display} className="mb-2 text-[16px] font-semibold tracking-tight">
        {title}
      </h4>
      <p className="text-[13.5px] leading-relaxed text-foreground/60">{body}</p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-foreground/10 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/45">{label}</div>
      <div
        style={display}
        className={`mt-1 text-[22px] font-semibold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
