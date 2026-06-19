import { createFileRoute, Link } from "@tanstack/react-router";
import { NyvloMark } from "@/components/nyvlo/Shell";
import { ArrowRight, Check, ShieldCheck, Calendar, StickyNote, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyvlo — The AI that catches what you forgot" },
      { name: "description", content: "Nyvlo finds the follow-ups, promises, and loose ends slipping through your week — and drafts the reply for you. Private beta now open." },
      { property: "og:title", content: "Nyvlo — The AI that catches what you forgot" },
      { property: "og:description", content: "The AI that catches what you forgot. Private beta now open." },
      { property: "og:url", content: "https://transform-pilot-ai.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://transform-pilot-ai.lovable.app/" }],
  }),
  component: Landing,
});

const serif = { fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif" } as const;

function Landing() {
  return (
    <div className="min-h-dvh w-full bg-[#fafaf9] text-[#111] selection:bg-blue-500/20 selection:text-blue-900">
      <Nav />
      <Hero />
      <Moment />
      <HowItWorks />
      <Score />
      <Privacy />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ---------------- nav ---------------- */

function Nav() {
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
      <Link to="/" className="flex items-center gap-2 text-[#111]">
        <NyvloMark size="lg" />
      </Link>
      <nav className="hidden items-center gap-10 text-[13px] text-[#111]/50 md:flex">
        <a href="#how" className="uppercase tracking-[0.14em] transition-colors hover:text-[#111]">How it works</a>
        <a href="#score" className="uppercase tracking-[0.14em] transition-colors hover:text-[#111]">Score</a>
        <a href="#privacy" className="uppercase tracking-[0.14em] transition-colors hover:text-[#111]">Privacy</a>
      </nav>
      <div className="flex items-center gap-3">
        <Link to="/auth" className="hidden text-[13px] text-[#111]/50 hover:text-[#111] md:inline">Sign in</Link>
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#111] px-5 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-[#111]/85 active:scale-[0.98]"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}

/* ---------------- hero ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-12 lg:grid-cols-2 lg:gap-12 lg:pb-32 lg:pt-20">
        {/* content */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#111]/10 bg-white px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#111]/50">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
            </span>
            Private beta — v0.4
          </div>

          <h1 className="text-balance text-[48px] font-normal leading-[1.05] tracking-[-0.01em] text-[#111] md:text-[64px] lg:text-[76px]" style={serif}>
            The AI that catches<br className="hidden sm:block" /> what you{" "}
            <em className="not-italic text-blue-600">forgot.</em>
          </h1>

          <p className="max-w-md text-[16px] leading-[1.65] text-[#111]/55 md:text-[17px]">
            Nyvlo finds the follow-ups, promises, and loose ends slipping through your week —
            and drafts the reply for you. Quiet, private, on your side.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-full bg-[#111] px-7 py-3.5 text-[14px] font-medium text-white transition-all hover:bg-[#111]/85 active:scale-[0.98]"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/try"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#111]/15 bg-transparent px-7 py-3.5 text-[14px] font-medium text-[#111] transition-all hover:border-[#111]/30 hover:bg-[#111]/[0.02]"
            >
              Try the demo
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[12.5px] text-[#111]/40">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.5} /> 30s setup</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.5} /> Google calendar + sent mail</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.5} /> No credit card</span>
          </div>

          <div className="flex gap-14 border-t border-[#111]/8 pt-8">
            <Stat value="24" label="Promises caught" />
            <Stat value="89" label="Reliability score" />
            <Stat value="<60s" label="To first catch" />
          </div>
        </div>

        {/* visual */}
        <div className="relative">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[22px] font-semibold tracking-tight text-[#111] tabular-nums">{value}</div>
      <div className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-[#111]/40">{label}</div>
    </div>
  );
}

/* ---------------- hero visual: quiet product card ---------------- */

function HeroVisual() {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[#111]/8 bg-white shadow-[0_2px_24px_rgba(0,0,0,0.04)]">
      <div className="flex h-11 items-center gap-2 border-b border-[#111]/6 px-5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#111]/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#111]/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#111]/10" />
        <span className="ml-2 text-[10.5px] tracking-tight text-[#111]/30">Nyvlo</span>
      </div>

      <div className="space-y-5 p-6">
        {/* promise card */}
        <div className="rounded-xl border border-[#111]/8 bg-[#fafaf9] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12.5px] font-medium text-[#111]/60">Sarah Chen</p>
              <p className="mt-1 text-[14px] leading-snug text-[#111]">"I'll send the pricing deck by Thursday"</p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-600">+2d</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
              <Check className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.5} />
            </div>
            <span className="text-[12.5px] text-[#111]/50">Draft ready</span>
          </div>
        </div>

        {/* week summary */}
        <div className="rounded-xl border border-[#111]/8 bg-white p-5">
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-[#111]/40">This week</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <MiniStat label="Made" value="27" />
            <MiniStat label="Kept" value="24" />
            <MiniStat label="Caught" value="3" accent />
          </div>
        </div>

        {/* reliability */}
        <div className="rounded-xl border border-[#111]/8 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.14em] text-[#111]/40">Reliability</p>
              <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-[#111]" style={serif}>
                89<span className="text-[14px] font-medium text-[#111]/35">/100</span>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <ArrowRight className="h-4 w-4 -rotate-45 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#111]/5">
            <div className="h-full w-[89%] rounded-full bg-blue-500" />
          </div>
          <p className="mt-3 text-[11px] text-[#111]/35">Week of Jun 16 · +6 vs last</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#111]/40">{label}</div>
      <div className={`mt-1 text-[22px] font-semibold tracking-tight tabular-nums ${accent ? "text-blue-600" : "text-[#111]"}`}>
        {value}
      </div>
    </div>
  );
}

/* ---------------- the moment ---------------- */

function Moment() {
  return (
    <section className="relative border-y border-[#111]/6 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-28 md:py-36">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-[#111]/40">
          The Nyvlo moment
        </p>
        <blockquote className="mx-auto mt-8 max-w-2xl text-balance text-center text-[32px] font-normal leading-[1.15] tracking-[-0.01em] text-[#111] md:text-[44px]" style={serif}>
          “Oh — I told Sarah I'd send that <em className="not-italic text-blue-600">two days ago.</em>”
        </blockquote>
        <p className="mx-auto mt-7 max-w-lg text-center text-[16px] leading-[1.7] text-[#111]/50">
          Everyone has felt this. Nyvlo is the moment <span className="text-[#111]/80">before</span> it —
          when something quietly nudges you with the promise you made, the person waiting, and the draft already written.
        </p>
      </div>
    </section>
  );
}

/* ---------------- how it works ---------------- */

function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <div className="mb-16 md:mb-20">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#111]/40">How it works</p>
        <h2 className="mt-4 text-balance text-[36px] font-normal leading-[1.1] tracking-[-0.01em] text-[#111] md:text-[48px]" style={serif}>
          Three quiet steps.<br className="hidden md:block" /> <span className="text-[#111]/40">No new habit.</span>
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Step
          n="01"
          icon={Calendar}
          title="Reads your calendar"
          body="Nyvlo grounds every commitment in real meetings, real people, and real timing."
        />
        <Step
          n="02"
          icon={StickyNote}
          title="Catches your promises"
          body="One click on any page, email, or doc captures the moment a promise was made."
        />
        <Step
          n="03"
          icon={Sparkles}
          title="Surfaces what slipped"
          body="An overdue follow-up. An unanswered email. A doc you said you'd send. Draft ready, one tap to ship."
        />
      </div>
    </section>
  );
}

function Step({ n, icon: Icon, title, body }: { n: string; icon: typeof Calendar; title: string; body: string }) {
  return (
    <div className="relative rounded-2xl border border-[#111]/6 bg-white p-8 md:p-10">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fafaf9]">
          <Icon className="h-4 w-4 text-blue-600" strokeWidth={1.75} />
        </div>
        <span className="text-[11px] uppercase tracking-[0.16em] text-[#111]/25">{n}</span>
      </div>
      <h3 className="mt-8 text-[19px] font-semibold tracking-tight text-[#111]">{title}</h3>
      <p className="mt-2.5 text-[14.5px] leading-[1.65] text-[#111]/50">{body}</p>
    </div>
  );
}

/* ---------------- score ---------------- */

function Score() {
  return (
    <section id="score" className="relative border-t border-[#111]/6 bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-28 md:grid-cols-[1.05fr,1fr] md:py-36">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#111]/40">Friday recap</p>
          <h3 className="mt-4 text-balance text-[32px] font-normal leading-[1.1] tracking-[-0.01em] text-[#111] md:text-[44px]" style={serif}>
            A reliability score people <em className="not-italic text-blue-600">screenshot.</em>
          </h3>
          <p className="mt-6 max-w-md text-[16px] leading-[1.65] text-[#111]/50">
            Every Friday, Nyvlo tells you how many promises you made, how many you kept, and
            how many would have slipped without it. It's honest, and only yours.
          </p>
          <ul className="mt-8 space-y-3 text-[14.5px] text-[#111]/70">
            <Bullet>Per-person reliability — never broadcast, never gamed.</Bullet>
            <Bullet>Trend across weeks, not vanity for a day.</Bullet>
            <Bullet>"Would have slipped" is the headline metric.</Bullet>
          </ul>
        </div>

        {/* score card */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-2xl border border-[#111]/8 bg-[#fafaf9] p-8 shadow-[0_2px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-baseline justify-between">
              <span className="text-[10.5px] uppercase tracking-[0.16em] text-[#111]/40">Week of Jun 16</span>
              <span className="text-[10.5px] text-[#111]/30">v0.4</span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <ScoreStat label="Made" value="27" />
              <ScoreStat label="Kept" value="24" />
              <ScoreStat label="Caught" value="3" accent />
            </div>
            <div className="mt-8 rounded-xl border border-[#111]/6 bg-white p-7 text-center">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#111]/40">Reliability score</div>
              <div className="mt-3 text-[72px] font-normal leading-none tracking-tight text-[#111] tabular-nums" style={serif}>
                89
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-blue-600">
                <ArrowRight className="h-3.5 w-3.5 -rotate-45" /> +6 vs last week
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
      <span>{children}</span>
    </li>
  );
}

function ScoreStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[#111]/6 bg-white p-4 text-center">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#111]/40">{label}</div>
      <div className={`mt-2 text-[26px] font-semibold tracking-tight tabular-nums ${accent ? "text-blue-600" : "text-[#111]"}`}>
        {value}
      </div>
    </div>
  );
}

/* ---------------- privacy ---------------- */

function Privacy() {
  const pact = [
    "Only what you save or connect — no silent browsing capture.",
    "No employer dashboard. No social leaderboard. Yours alone.",
    "Pause anytime. Delete everything in a single click.",
    "Tokens encrypted at rest. Read-only Google scopes by default.",
  ];
  return (
    <section id="privacy" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <div className="grid items-start gap-12 md:grid-cols-[auto,1fr]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#111]/8">
          <ShieldCheck className="h-5 w-5 text-blue-600" strokeWidth={1.6} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#111]/40">The pact</p>
          <h2 className="mt-3 text-balance text-[32px] font-normal leading-[1.1] tracking-[-0.01em] text-[#111] md:text-[44px]" style={serif}>
            Yours. Only yours.
          </h2>
          <ul className="mt-10 grid gap-3 text-[14.5px] text-[#111]/70 md:grid-cols-2">
            {pact.map((line) => (
              <li key={line} className="flex items-start gap-3 rounded-xl border border-[#111]/6 bg-white p-5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" strokeWidth={2.2} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- final cta ---------------- */

function FinalCTA() {
  return (
    <section className="relative border-t border-[#111]/6">
      <div className="mx-auto max-w-3xl px-6 py-28 text-center md:py-36">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#111]/40">Get started</p>
        <h2 className="mx-auto mt-5 max-w-2xl text-balance text-[40px] font-normal leading-[1.05] tracking-[-0.01em] text-[#111] md:text-[60px]" style={serif}>
          Never drop the ball <em className="not-italic text-blue-600">again.</em>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-[16px] leading-[1.65] text-[#111]/50">
          Sign up. Connect Google. You're set in under a minute.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 rounded-full bg-[#111] px-7 py-3.5 text-[14px] font-medium text-white hover:bg-[#111]/85"
          >
            Get started free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/try"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#111]/15 bg-transparent px-7 py-3.5 text-[14px] font-medium text-[#111] hover:border-[#111]/30 hover:bg-[#111]/[0.02]"
          >
            Try the demo
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- footer ---------------- */

function Footer() {
  return (
    <footer className="border-t border-[#111]/6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-[13px] text-[#111]/40 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-[#111]/60">
          <NyvloMark />
          <span>© 2026 Nyvlo</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="uppercase tracking-[0.14em]">Privacy · soon</span>
          <a href="mailto:hello@nyvlo.app" className="uppercase tracking-[0.14em] transition-colors hover:text-[#111]">Contact</a>
        </div>
      </div>
    </footer>
  );
}
