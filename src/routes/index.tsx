import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Quote, Clock, Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Receipts , the renewal tool that shows its work" },
      {
        name: "description",
        content:
          "Paste a customer call. Get a drafted renewal email and CRM update where every line cites the exact moment that justified it. Approve in 90 seconds.",
      },
      { property: "og:title", content: "Receipts , the renewal tool that shows its work" },
      {
        property: "og:description",
        content:
          "Drafted renewal follow-ups where every claim is cited back to the line of the call that justified it.",
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
      <Receipts />
      <Why />
      <Partners />
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
          <span className="font-display font-semibold tracking-tight">Receipts</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-xs text-muted-foreground">
          <a href="#receipts" className="hover:text-foreground">
            How it works
          </a>
          <a href="#why" className="hover:text-foreground">
            Why it matters
          </a>
          <a href="#partners" className="hover:text-foreground">
            Design partners
          </a>
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
            Try the demo <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-7 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-3 py-1">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            For CS teams at mid-market SaaS
          </div>
          <h1 className="font-display text-5xl md:text-[72px] font-semibold tracking-tight leading-[1.02]">
            The renewal tool that shows its work.
          </h1>
          <p className="mt-7 text-base md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Paste a customer call. Get a drafted follow-up email and a CRM update where every single
            line cites the exact moment that justified it. Approve in 90 seconds.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/try"
              className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
            >
              Try it on a sample call <ArrowUpRight className="size-4" />
            </Link>
            <Link
              to="/waitlist"
              className="inline-flex items-center gap-2 text-sm font-medium border border-border px-5 py-3 rounded-full hover:bg-accent/40"
            >
              Become a design partner
            </Link>
          </div>

          <p className="mt-7 text-[11px] font-mono text-muted-foreground inline-flex items-center gap-2">
            <Clock className="size-3" />
            No signup for the demo. Your transcript is not stored.
          </p>
        </div>
      </div>
    </section>
  );
}

function Receipts() {
  const steps = [
    {
      n: "01",
      title: "Paste a call.",
      body: "Drop in the transcript from Gong, Zoom, Fathom, or a meeting note. One call at a time. No integration to set up.",
    },
    {
      n: "02",
      title: "Get the cited draft.",
      body: "Receipts returns a follow-up email, a CRM update, and flagged risks. Every paragraph carries a citation chip linking back to the line of the call that justified it.",
    },
    {
      n: "03",
      title: "Approve in 90 seconds.",
      body: "Click any chip to jump to the source line. Edit, approve and copy to clipboard, or reject. Nothing sends without you.",
    },
  ];
  return (
    <section id="receipts" className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <span className="eyebrow block mb-3">How it works</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            One call in. A cited renewal package out.
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Why() {
  const points = [
    {
      h: "CSMs do not trust black-box AI.",
      b: "Receipts shows the quote behind every claim. No score without a source line. That is the whole product.",
    },
    {
      h: "Managers can coach from real evidence.",
      b: "Every approved or rejected draft is a labeled signal. Patterns surface across the team, anchored to the moments that matter.",
    },
    {
      h: "Forecast scrutiny gets easier.",
      b: "When the CFO asks why a renewal is at risk, the answer is the customer's own words, with a timestamp.",
    },
  ];
  return (
    <section id="why" className="border-b border-border bg-surface/40">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <span className="eyebrow block mb-3">Why receipts</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            Every other AI tool surfaces a score. We show the line that proved it.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {points.map((p) => (
            <div key={p.h} className="border border-border rounded-2xl bg-background p-6">
              <Check className="size-4 text-success mb-3" />
              <h3 className="font-display text-base font-semibold tracking-tight mb-2 leading-snug">
                {p.h}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section id="partners" className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24 grid lg:grid-cols-[1fr_0.8fr] gap-12 items-start">
        <div className="max-w-xl">
          <span className="eyebrow block mb-3">Design partner program</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05]">
            Send us five closed renewals. We will show you what we would have caught.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Pick five renewals from the last twelve months, anything that ended in churn, downgrade,
            or surprise expansion. We run a concierge backtest and return the customer moments your
            team did not act on, with citations.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/waitlist"
              className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
            >
              Request access <ArrowUpRight className="size-4" />
            </Link>
            <span className="text-[11px] font-mono text-muted-foreground">
              No integration. No commitment. Sample output first.
            </span>
          </div>
        </div>

        <figure className="border border-border rounded-2xl bg-surface p-6 md:p-8">
          <Quote className="size-5 text-muted-foreground mb-4" />
          <blockquote className="text-base md:text-lg font-display tracking-tight leading-snug">
            "If the citations are real, the budget conversation gets much easier. Show me the
            moments my team missed, in the customer's own words."
          </blockquote>
          <figcaption className="mt-5 text-xs text-muted-foreground">
            What we hear from VP CS in every first call.
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
          <span className="font-mono">Receipts , shows its work.</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/try" className="hover:text-foreground">
            Try the demo
          </Link>
          <Link to="/waitlist" className="hover:text-foreground">
            Request access
          </Link>
          <a href="mailto:founders@receipts.dev" className="hover:text-foreground">
            founders@receipts.dev
          </a>
        </div>
      </div>
    </footer>
  );
}
