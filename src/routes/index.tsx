import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Compass, Workflow, BarChart3, Users, FileText } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fluent — The AI Transformation Execution Platform" },
      {
        name: "description",
        content:
          "Fluent turns unclear AI ambition into governance, adoption plans, use cases, roadmaps, and execution artifacts for the enterprise.",
      },
    ],
  }),
  component: Landing,
});

function Nav() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-8">
        <Link to="/" className="font-display text-xl font-bold tracking-tighter uppercase">
          Fluent
        </Link>
        <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <a href="#problem" className="hover:text-foreground transition-colors">Problem</a>
          <a href="#solution" className="hover:text-foreground transition-colors">Solution</a>
          <a href="#outputs" className="hover:text-foreground transition-colors">Outputs</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2">
          Sign in
        </Link>
        <Link
          to="/signup"
          className="bg-foreground text-background text-sm font-semibold px-5 py-2 rounded-full hover:bg-foreground/90 transition-all"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      <Nav />

      {/* Hero */}
      <header className="max-w-7xl mx-auto px-6 pt-24 pb-24">
        <div className="animate-reveal">
          <div className="inline-block px-3 py-1 border border-primary/20 bg-primary/5 rounded-full mb-8">
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">
              Strategic Execution Layer
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance mb-8 max-w-5xl">
            The AI Transformation <span className="text-primary">Execution</span> Platform.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed text-pretty mb-12">
            Fluent turns unclear AI ambition into governance, adoption plans, use cases, roadmaps,
            and the execution artifacts your operating model actually needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/signup"
              className="bg-primary text-primary-foreground text-lg font-semibold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all ring-1 ring-primary inline-flex items-center gap-2"
            >
              Build My Transformation Plan <ArrowRight className="size-5" />
            </Link>
            <a
              href="#how"
              className="px-8 py-4 text-lg font-semibold border border-border rounded-xl hover:bg-foreground/5 transition-all text-center"
            >
              View Methodology
            </a>
          </div>
        </div>
      </header>

      {/* Dashboard preview */}
      <section className="max-w-7xl mx-auto px-6 pb-32 animate-reveal">
        <div className="bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex justify-between items-end mb-12 flex-wrap gap-6">
              <div>
                <span className="eyebrow block mb-2">Global Portfolio View</span>
                <h2 className="text-3xl font-display font-semibold">Transformation Status</h2>
              </div>
              <div className="flex gap-4">
                <div className="bg-foreground/5 px-4 py-2 rounded-lg">
                  <span className="text-xs text-muted-foreground block mb-1">Active Use Cases</span>
                  <span className="font-mono font-bold">142</span>
                </div>
                <div className="bg-foreground/5 px-4 py-2 rounded-lg">
                  <span className="text-xs text-muted-foreground block mb-1">Value Realized</span>
                  <span className="font-mono font-bold text-primary">$12.4M</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {[
                { l: "Governance Health", v: "94%", c: "bg-success", w: "w-[94%]" },
                { l: "Adoption Velocity", v: "72%", c: "bg-primary", w: "w-[72%]" },
                { l: "Risk Exposure", v: "Low", c: "bg-success", w: "w-1/3" },
                { l: "Artifact Readiness", v: "88%", c: "bg-primary", w: "w-[88%]" },
              ].map((m) => (
                <div key={m.l} className="p-6 border border-border rounded-2xl bg-background">
                  <span className="eyebrow block mb-4">{m.l}</span>
                  <div className="text-4xl font-display font-bold mb-2">{m.v}</div>
                  <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                    <div className={`h-full ${m.c} ${m.w}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-border rounded-2xl overflow-hidden">
              <div className="bg-foreground/5 p-4 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold font-mono">EXECUTION ROADMAP: Q3 — Q4</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                  Live · 2m ago
                </span>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { lane: "GOVERNANCE", items: [{ w: "w-1/3", label: "Policy Framework v2", solid: false }, { w: "w-1/4", label: "Risk Controls Rollout", solid: true }] },
                  { lane: "ADOPTION", items: [{ w: "w-2/5", label: "Manager Enablement", solid: false }] },
                  { lane: "CAPABILITY", items: [{ w: "w-1/2", label: "Enterprise LLM Gateway", solid: false }] },
                ].map((row) => (
                  <div key={row.lane} className="flex gap-4">
                    <div className="w-32 flex-shrink-0 text-[10px] font-mono text-muted-foreground py-2">
                      {row.lane}
                    </div>
                    <div className="flex-grow flex gap-1">
                      {row.items.map((it, i) => (
                        <div
                          key={i}
                          className={`h-8 ${it.w} ${it.solid ? "bg-primary" : "bg-primary/10 border-l-2 border-primary"} rounded p-2 flex items-center`}
                        >
                          <span className={`text-[10px] font-bold truncate ${it.solid ? "text-primary-foreground" : ""}`}>
                            {it.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="max-w-7xl mx-auto px-6 pb-32">
        <span className="eyebrow block mb-4">The problem</span>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl mb-12">
          AI ambition stalls between the boardroom and the operating model.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { t: "Strategy without execution", d: "Pilots multiply. Adoption flatlines. Outcomes never make it into operating metrics." },
            { t: "Governance as afterthought", d: "Legal, security, and risk only get involved once the damage has a name." },
            { t: "Change at the wrong altitude", d: "Slide decks travel. Behavior doesn't. Managers can't translate the strategy into team-level rituals." },
          ].map((p) => (
            <div key={p.t} className="p-8 border border-border rounded-2xl bg-card">
              <h3 className="font-display text-xl font-semibold mb-3">{p.t}</h3>
              <p className="text-muted-foreground leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="max-w-7xl mx-auto px-6 pb-32">
        <span className="eyebrow block mb-4">The solution</span>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl mb-6">
          A single platform for AI transformation execution.
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mb-12">
          Fluent acts as your transformation PMO, governance advisor, and change-management lead —
          turning messy intent into a defensible execution package.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { i: Compass, t: "Diagnose", d: "Score maturity across 10 dimensions of readiness." },
            { i: Workflow, t: "Plan", d: "Generate the governance, adoption, and execution artifacts." },
            { i: BarChart3, t: "Execute", d: "Track health, governance, adoption, and ROI in one view." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="p-8 border border-border rounded-2xl bg-card">
              <div className="size-10 rounded-lg bg-primary/10 grid place-items-center text-primary mb-6">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{t}</h3>
              <p className="text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-7xl mx-auto px-6 pb-32">
        <span className="eyebrow block mb-4">How it works</span>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl mb-12">
          From intake to execution package in one session.
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { n: "01", t: "Describe your reality", d: "Company, tools, constraints, ambitions. No theory." },
            { n: "02", t: "Get a diagnosis", d: "Maturity scoring across leadership, data, governance, change." },
            { n: "03", t: "Receive artifacts", d: "Governance plan, use case matrix, adoption package, roadmap." },
            { n: "04", t: "Edit and execute", d: "Refine each section, regenerate, copy into your operating cadence." },
          ].map((s) => (
            <div key={s.n} className="p-8 border border-border rounded-2xl bg-card">
              <div className="font-mono text-xs text-primary mb-6">{s.n}</div>
              <h3 className="font-display text-xl font-semibold mb-2">{s.t}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outputs */}
      <section id="outputs" className="max-w-7xl mx-auto px-6 pb-32">
        <span className="eyebrow block mb-4">The outputs</span>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl mb-12">
          Eight execution artifacts. Every section answers eight questions.
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            "Executive Summary",
            "AI Maturity Assessment",
            "Use Case Discovery",
            "Prioritization Matrix",
            "Governance Package",
            "Adoption Package",
            "30/60/90/365 Roadmap",
            "Health & ROI Metrics",
          ].map((o, i) => (
            <div key={o} className="p-6 border border-border rounded-2xl bg-card">
              <div className="font-mono text-[10px] text-muted-foreground mb-3">
                {String.fromCharCode(65 + i)}
              </div>
              <h3 className="font-display text-lg font-semibold">{o}</h3>
            </div>
          ))}
        </div>
        <div className="mt-12 p-8 border border-border rounded-2xl bg-foreground/[0.02]">
          <span className="eyebrow block mb-4">Every artifact answers</span>
          <div className="grid md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
            {[
              "What should we do?",
              "Why does it matter?",
              "Who owns it?",
              "When does it happen?",
              "What risks exist?",
              "How do we measure success?",
              "What artifact gets created?",
              "What is the next action?",
            ].map((q) => (
              <div key={q} className="flex items-start gap-2">
                <FileText className="size-4 text-primary mt-0.5 shrink-0" />
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <span className="eyebrow block mb-4">Who it's for</span>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl mb-12">
          Built for the people accountable for AI outcomes.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            "AI Transformation Leads",
            "Operations Leaders",
            "HR / People Leaders",
            "IT / Security Leaders",
            "Executives accountable for AI",
          ].map((r) => (
            <div key={r} className="p-6 border border-border rounded-2xl bg-card flex items-start gap-3">
              <Users className="size-5 text-primary shrink-0 mt-0.5" />
              <span className="font-medium">{r}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="rounded-[2rem] border border-border bg-foreground text-background p-12 md:p-20 text-center">
          <ShieldCheck className="size-10 mx-auto mb-6 text-primary" />
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6 text-balance">
            Stop mistaking pilots for transformation.
          </h2>
          <p className="text-lg text-background/70 max-w-2xl mx-auto mb-10">
            Generate your AI Transformation Execution Package in minutes. Defensible, structured,
            edit-ready.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-lg font-semibold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-primary/30 ring-1 ring-primary"
          >
            Build My Transformation Plan <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="font-display text-lg font-bold tracking-tighter uppercase text-foreground">
            Fluent
          </div>
          <div>© {new Date().getFullYear()} Fluent. The AI Transformation Execution Platform.</div>
        </div>
      </footer>
    </div>
  );
}
