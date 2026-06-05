import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BarChart3, Check, Clock, Quote, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Receipts - renewal evidence desk for CS leaders" },
      {
        name: "description",
        content:
          "Receipts turns customer calls into cited renewal evidence: risks, stakeholder changes, value proof, CRM updates, and follow-up drafts your team can trust.",
      },
      { property: "og:title", content: "Receipts - renewal evidence desk for CS leaders" },
      {
        property: "og:description",
        content:
          "Turn renewal calls into cited evidence packages for CSMs, VP CS, RevOps, CFOs, and board updates.",
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
      <EvidenceLoop />
      <MultipleHats />
      <WhyNow />
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
          <a href="#evidence" className="hover:text-foreground">
            Evidence loop
          </a>
          <a href="#hats" className="hover:text-foreground">
            Buyer lenses
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
            Try the evidence desk <ArrowUpRight className="size-3" />
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
        <div className="grid lg:grid-cols-[1fr_0.8fr] gap-12 items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-7 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-3 py-1">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              For CS teams defending renewal revenue
            </div>
            <h1 className="font-display text-5xl md:text-[76px] font-semibold tracking-tight leading-[0.98]">
              Renewal evidence your whole company can trust.
            </h1>
            <p className="mt-7 text-base md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Receipts turns customer calls into cited renewal evidence: stakeholder changes, value
              proof, risks, CRM updates, and follow-up drafts. Every claim links back to the exact
              line that proved it.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/try"
                className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
              >
                Run the live demo <ArrowUpRight className="size-4" />
              </Link>
              <Link
                to="/waitlist"
                className="inline-flex items-center gap-2 text-sm font-medium border border-border px-5 py-3 rounded-full hover:bg-accent/40"
              >
                Backtest my renewals
              </Link>
            </div>

            <p className="mt-7 text-[11px] font-mono text-muted-foreground inline-flex items-center gap-2">
              <Clock className="size-3" />
              No signup for the demo. Your transcript is not stored.
            </p>
          </div>

          <div className="border border-border rounded-3xl bg-surface p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <span className="eyebrow">Renewal brief</span>
              <span className="text-[10px] font-mono rounded-full border border-warning/30 bg-warning/15 px-2 py-1 text-warning">
                Budget risk
              </span>
            </div>
            <div className="space-y-4 text-sm">
              {[
                [
                  "Exec sponsor changed",
                  "New CFO now reviews every line item over $100k.",
                  "L02-L04",
                ],
                [
                  "Value proof requested",
                  "Champion asked for ROI proof before the budget meeting.",
                  "L05-L06",
                ],
                [
                  "Adoption gap",
                  "Atlanta is at 11% weekly active usage while Phoenix is at 78%.",
                  "L08-L10",
                ],
              ].map(([title, body, cite]) => (
                <div key={title} className="rounded-2xl border border-border bg-background p-4">
                  <div className="font-display font-semibold tracking-tight">{title}</div>
                  <p className="mt-1.5 text-muted-foreground leading-relaxed">{body}</p>
                  <span className="mt-3 inline-flex text-[10px] font-mono rounded border border-warning/30 bg-warning/15 px-1.5 py-0.5 text-warning">
                    {cite}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceLoop() {
  const steps = [
    {
      n: "01",
      title: "Capture the moment.",
      body: "Paste a transcript from Gong, Zoom, Fathom, or a meeting note. Start with one renewal conversation before connecting the stack.",
    },
    {
      n: "02",
      title: "Separate facts from guesses.",
      body: "Receipts extracts decision makers, value proof, blockers, expansion signals, and next plays. Each item carries source-line evidence.",
    },
    {
      n: "03",
      title: "Ship the reviewed package.",
      body: "CSMs approve the follow-up, RevOps gets CRM fields, VP CS gets risk evidence, and finance gets the customer quote behind the forecast.",
    },
  ];
  return (
    <section id="evidence" className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <span className="eyebrow block mb-3">Evidence loop</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            The product is not another score. It is the receipts behind the renewal call.
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

function MultipleHats() {
  const hats = [
    {
      role: "CSM hat",
      need: "I need a follow-up I can trust in minutes.",
      proof:
        "Every paragraph has a citation, so the rep can edit fast without re-listening to the call.",
    },
    {
      role: "VP CS hat",
      need: "I need to know which renewals are really slipping.",
      proof:
        "Receipts turns objections, sponsor changes, adoption gaps, and requested proof into coachable evidence.",
    },
    {
      role: "CFO hat",
      need: "I need forecast confidence without another subjective health score.",
      proof:
        "Risk is explained with customer language, not a black-box number that cannot survive scrutiny.",
    },
    {
      role: "Investor/operator hat",
      need: "I need a wedge that can prove urgency before a platform exists.",
      proof:
        "The design-partner backtest measures whether evidence changes renewal action on real closed deals.",
    },
  ];
  return (
    <section id="hats" className="border-b border-border bg-surface/40">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <span className="eyebrow block mb-3">Pressure tested by role</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            If one stakeholder does not care, the product is not ready.
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
            Receipts is designed around a narrow fundable wedge: renewal teams already have calls,
            CRM notes, and dashboards. They lack trusted evidence that changes the next action
            before the renewal date slips.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {hats.map((h) => (
            <div key={h.role} className="border border-border rounded-2xl bg-background p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="size-4 text-success" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  {h.role}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight mb-3 leading-snug">
                {h.need}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{h.proof}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyNow() {
  const points = [
    {
      h: "AI adoption has a trust bottleneck.",
      b: "CS teams will use drafts, but leaders will not bet renewal forecasts on uncited claims. Receipts makes trust the interface.",
    },
    {
      h: "Renewal pressure is moving upstream.",
      b: "Boards and CFOs want proof before the quarter ends, not a post-mortem after churn. The call transcript already contains that proof.",
    },
    {
      h: "The wedge can be proven without integrations.",
      b: "A backtest on closed renewals shows whether cited evidence would have changed action. That is the traction test before the platform build.",
    },
  ];
  return (
    <section id="why" className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <span className="eyebrow block mb-3">Why this can earn traction</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            The fundable version is not "AI for CS." It is cited renewal evidence that changes
            behavior.
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
            Bring five closed renewals. Leave with the evidence your team missed.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Pick churns, downgrades, surprise renewals, or expansions from the last twelve months.
            We run a concierge evidence backtest and return the source moments, missed plays, CRM
            updates, and forecast memo your team would have had before the outcome.
          </p>
          <div className="mt-7 grid sm:grid-cols-3 gap-3 text-xs">
            {["Missed risk board", "Cited forecast memo", "CSM play review"].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-surface p-3">
                <BarChart3 className="size-3.5 mb-2 text-muted-foreground" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/waitlist"
              className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
            >
              Request a backtest <ArrowUpRight className="size-4" />
            </Link>
            <span className="text-[11px] font-mono text-muted-foreground">
              No integration. No commitment. Evidence first.
            </span>
          </div>
        </div>

        <figure className="border border-border rounded-2xl bg-surface p-6 md:p-8">
          <Quote className="size-5 text-muted-foreground mb-4" />
          <blockquote className="text-base md:text-lg font-display tracking-tight leading-snug">
            "Do not show me another dashboard. Show me the customer moments that would have changed
            what my team did."
          </blockquote>
          <figcaption className="mt-5 text-xs text-muted-foreground">
            The bar for a design partner: proof that creates action.
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
          <span className="font-mono">Receipts shows its work.</span>
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
