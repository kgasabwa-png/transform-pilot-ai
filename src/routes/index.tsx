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

const mono = { fontFamily: "'JetBrains Mono', ui-monospace, SF Mono, Menlo, monospace" } as const;

function Landing() {
  return (
    <div className="min-h-dvh w-full bg-[#0a0a0a] text-white selection:bg-blue-500/30 selection:text-blue-100">
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
    <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <Link to="/" className="flex items-center gap-2 text-white">
        <NyvloMark size="lg" />
      </Link>
      <nav className="hidden items-center gap-9 text-[12.5px] text-white/50 md:flex" style={mono}>
        <a href="#how" className="uppercase tracking-[0.18em] transition-colors hover:text-white">How</a>
        <a href="#score" className="uppercase tracking-[0.18em] transition-colors hover:text-white">Score</a>
        <a href="#privacy" className="uppercase tracking-[0.18em] transition-colors hover:text-white">Privacy</a>
      </nav>
      <div className="flex items-center gap-2">
        <Link to="/auth" className="hidden text-[13px] text-white/50 hover:text-white md:inline">Sign in</Link>
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 rounded-sm bg-white px-3.5 py-2 text-[13px] font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
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
      {/* faint grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* corner ticks */}
      <CornerTicks />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-10 lg:grid-cols-12 lg:gap-12 lg:pb-32 lg:pt-16">
        {/* content */}
        <div className="space-y-9 lg:col-span-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/55" style={mono}>
              Private beta · v0.4
            </span>
          </div>

          <h1 className="text-balance text-[44px] font-semibold leading-[1.04] tracking-[-0.02em] text-white md:text-[64px] lg:text-[72px]">
            The AI that catches<br className="hidden sm:block" /> what you{" "}
            <span className="text-blue-500">forgot.</span>
          </h1>

          <p className="max-w-lg text-[16px] leading-relaxed text-white/45 md:text-[17px]">
            Nyvlo finds the follow-ups, promises, and loose ends slipping through your week —
            and drafts the reply for you. Quiet, private, on your side.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-sm bg-white px-7 py-3.5 text-[14px] font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/try"
              className="inline-flex items-center gap-1.5 rounded-sm border border-white/10 bg-transparent px-7 py-3.5 text-[14px] font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              Try the demo
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[11.5px] text-white/35" style={mono}>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3 text-blue-400" /> 30s setup</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3 text-blue-400" /> Google calendar + sent mail</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3 text-blue-400" /> No credit card</span>
          </div>

          <div className="flex gap-12 border-t border-white/5 pt-7">
            <Stat value="24" label="Promises caught" />
            <Stat value="89" label="Reliability score" />
            <Stat value="<60s" label="To first catch" />
          </div>
        </div>

        {/* visual */}
        <div className="relative lg:col-span-6">
          <div className="absolute -inset-16 rounded-full bg-blue-500/10 blur-[120px]" />
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[22px] font-semibold tracking-tight text-white tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/35" style={mono}>{label}</div>
    </div>
  );
}

function CornerTicks() {
  const tick = "absolute h-3 w-3 border-white/15";
  return (
    <>
      <span className={`${tick} left-6 top-24 border-l border-t`} />
      <span className={`${tick} right-6 top-24 border-r border-t`} />
      <span className={`${tick} left-6 bottom-12 border-b border-l`} />
      <span className={`${tick} right-6 bottom-12 border-b border-r`} />
    </>
  );
}

/* ---------------- hero visual: technical capture log ---------------- */

function HeroVisual() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f] shadow-2xl">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 0)", backgroundSize: "22px 22px" }}
      />

      {/* tiny technical labels in corners */}
      <div className="absolute left-4 top-4 text-[9.5px] uppercase tracking-[0.22em] text-white/30" style={mono}>
        // capture stream
      </div>
      <div className="absolute right-4 top-4 text-[9.5px] uppercase tracking-[0.22em] text-white/30" style={mono}>
        live · 02:14
      </div>

      <div className="absolute left-1/2 top-1/2 w-[88%] -translate-x-1/2 -translate-y-1/2 space-y-4">
        {/* editor card */}
        <div className="overflow-hidden rounded-lg border border-white/10 bg-[#151515] shadow-2xl transition-transform duration-500 hover:-translate-y-1">
          <div className="flex h-8 items-center gap-2 border-b border-white/5 px-4">
            <div className="h-2 w-2 rounded-full bg-white/10" />
            <div className="h-2 w-2 rounded-full bg-white/10" />
            <div className="h-2 w-2 rounded-full bg-white/10" />
            <span className="ml-2 text-[10px] tracking-tight text-white/30" style={mono}>capture.log</span>
          </div>
          <div className="space-y-2 p-5 text-[12.5px] leading-relaxed" style={mono}>
            <LogRow n="01" label="event" value="promise.detected" tone="blue" />
            <LogRow n="02" label="source" value='"thread:sarah@acme.com"' tone="white" />
            <LogRow n="03" label="text" value='"I’ll send the pricing deck"' tone="white" />
            <LogRow n="04" label="due" value="+2d" tone="orange" />
            <LogRow n="05" label="status" value='"draft.ready"' tone="green" />
          </div>
        </div>

        {/* floating reliability card */}
        <div className="absolute -bottom-10 -right-4 w-52 rotate-2 rounded-lg bg-white p-4 text-black shadow-2xl">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">Reliability</div>
          <div className="mt-0.5 text-[28px] font-semibold leading-none tracking-tight">
            89<span className="text-sm font-medium text-black/40">/100</span>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-black/5">
            <div className="h-full w-[89%] rounded-full bg-blue-500" />
          </div>
          <div className="mt-2 text-[10.5px] text-black/40">Week of Jun 16 · +6 vs last</div>
        </div>

        {/* floating validation chip */}
        <div className="absolute -top-12 -left-6 -rotate-3 rounded-lg border border-white/20 bg-[#1a1a1a] px-4 py-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/15">
              <Check className="h-4 w-4 text-blue-400" strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[10px] font-medium text-white/40" style={mono}>caught</div>
              <div className="text-[12px] font-semibold tracking-tight text-white">Before it slipped</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogRow({ n, label, value, tone }: { n: string; label: string; value: string; tone: "blue" | "white" | "orange" | "green" }) {
  const toneClass =
    tone === "blue" ? "text-blue-400 font-medium"
      : tone === "orange" ? "text-orange-400"
      : tone === "green" ? "text-green-400"
      : "text-white/85";
  return (
    <div className="flex gap-4">
      <span className="select-none text-white/20">{n}</span>
      <span className="text-white/55">{label}:</span>
      <span className={toneClass}>{value}</span>
    </div>
  );
}

/* ---------------- the moment ---------------- */

function Moment() {
  return (
    <section className="relative border-y border-white/5 bg-[#0c0c0c]">
      <div className="mx-auto max-w-4xl px-6 py-24 md:py-28">
        <p className="text-center text-[10px] uppercase tracking-[0.24em] text-white/35" style={mono}>
          The Nyvlo moment
        </p>
        <blockquote className="mx-auto mt-6 max-w-3xl text-balance text-center text-[28px] font-medium leading-[1.18] tracking-tight text-white md:text-[40px]">
          “Oh shit — I told Sarah I’d send that <span className="text-blue-500">two days ago.</span>”
        </blockquote>
        <p className="mx-auto mt-6 max-w-xl text-center text-[15px] leading-relaxed text-white/45">
          Everyone has felt this. Nyvlo is the moment <em className="not-italic text-white/80">before</em> it —
          when something quietly nudges you with the promise you made, the person waiting, and the draft already written.
        </p>
      </div>
    </section>
  );
}

/* ---------------- how it works ---------------- */

function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-7xl px-6 py-24 md:py-28">
      <div className="mb-14 flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/35" style={mono}>// How it works</p>
          <h2 className="mt-3 text-balance text-[32px] font-semibold leading-tight tracking-tight md:text-[44px]">
            Three quiet steps. <span className="text-white/45">No new habit.</span>
          </h2>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 md:grid-cols-3">
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
          body="An overdue follow-up. An unanswered email. A doc you said you’d send. Draft ready, one tap to ship."
        />
      </div>
    </section>
  );
}

function Step({ n, icon: Icon, title, body }: { n: string; icon: typeof Calendar; title: string; body: string }) {
  return (
    <div className="relative bg-[#0a0a0a] p-7 md:p-9">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded border border-white/10 bg-white/[0.03]">
          <Icon className="h-4 w-4 text-blue-400" strokeWidth={1.75} />
        </div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/25" style={mono}>{n}</span>
      </div>
      <h3 className="mt-7 text-[18px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-white/45">{body}</p>
    </div>
  );
}

/* ---------------- score ---------------- */

function Score() {
  return (
    <section id="score" className="relative border-t border-white/5 bg-[#0c0c0c]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-[1.05fr,1fr] md:py-28">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/35" style={mono}>// Friday recap</p>
          <h3 className="mt-3 text-balance text-[30px] font-semibold leading-tight tracking-tight md:text-[40px]">
            A reliability score people <span className="text-blue-500">screenshot.</span>
          </h3>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/45">
            Every Friday, Nyvlo tells you how many promises you made, how many you kept, and
            how many would have slipped without it. It’s honest, and only yours.
          </p>
          <ul className="mt-7 space-y-2.5 text-[13.5px] text-white/65">
            <Bullet>Per-person reliability — never broadcast, never gamed.</Bullet>
            <Bullet>Trend across weeks, not vanity for a day.</Bullet>
            <Bullet>“Would have slipped” is the headline metric.</Bullet>
          </ul>
        </div>

        {/* score card */}
        <div className="relative">
          <div className="absolute -inset-10 rounded-full bg-blue-500/8 blur-[100px]" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] p-7 shadow-2xl">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/40" style={mono}>Week of Jun 16</span>
              <span className="text-[10px] text-white/30" style={mono}>v0.4</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <ScoreStat label="Made" value="27" />
              <ScoreStat label="Kept" value="24" />
              <ScoreStat label="Caught" value="3" accent />
            </div>
            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40" style={mono}>Reliability score</div>
              <div className="mt-2 text-[68px] font-semibold leading-none tracking-tight text-white tabular-nums">
                89
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-blue-400" style={mono}>
                <ArrowRight className="h-3 w-3 -rotate-45" /> +6 vs last week
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
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
      <span>{children}</span>
    </li>
  );
}

function ScoreStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded border border-white/10 bg-[#0a0a0a] p-3 text-center">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40" style={mono}>{label}</div>
      <div className={`mt-1.5 text-[24px] font-semibold tracking-tight tabular-nums ${accent ? "text-blue-400" : "text-white"}`}>
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
    <section id="privacy" className="relative mx-auto max-w-5xl px-6 py-24 md:py-28">
      <div className="grid items-start gap-12 md:grid-cols-[auto,1fr]">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
          <ShieldCheck className="h-5 w-5 text-blue-400" strokeWidth={1.6} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/35" style={mono}>// The pact</p>
          <h2 className="mt-3 text-balance text-[30px] font-semibold leading-tight tracking-tight md:text-[40px]">
            Yours. Only yours.
          </h2>
          <ul className="mt-8 grid gap-3 text-[14px] text-white/65 md:grid-cols-2">
            {pact.map((line) => (
              <li key={line} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" strokeWidth={2.2} />
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
    <section className="relative border-t border-white/5">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/35" style={mono}>// Get started</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-[36px] font-semibold leading-[1.05] tracking-tight md:text-[56px]">
          Never drop the ball <span className="text-blue-500">again.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/45">
          Sign up. Connect Google. You’re set in under a minute.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 rounded-sm bg-white px-7 py-3.5 text-[14px] font-semibold text-black hover:bg-white/90"
          >
            Get started free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/try"
            className="inline-flex items-center gap-1.5 rounded-sm border border-white/10 bg-transparent px-7 py-3.5 text-[14px] font-semibold text-white hover:border-white/20 hover:bg-white/[0.04]"
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
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-7 text-[12px] text-white/35 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-white/55">
          <NyvloMark />
          <span style={mono}>© 2026 Nyvlo</span>
        </div>
        <div className="flex items-center gap-6" style={mono}>
          <span className="uppercase tracking-[0.18em]">Privacy · soon</span>
          <a href="mailto:hello@nyvlo.app" className="uppercase tracking-[0.18em] transition-colors hover:text-white">Contact</a>
        </div>
      </div>
    </footer>
  );
}
