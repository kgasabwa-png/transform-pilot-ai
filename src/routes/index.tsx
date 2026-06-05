import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Quote } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Compound. The save, already shipped." },
      {
        name: "description",
        content:
          "Compound is the post-call workspace for CSMs. You finish a renewal call and your follow-ups are already drafted, queued, and waiting for one signature.",
      },
      { property: "og:title", content: "Compound. The save, already shipped." },
      {
        property: "og:description",
        content:
          "Finish the call. Open your laptop. The work is done. One signature ships it.",
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
      <Proof />
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
          <span className="font-display font-semibold tracking-tight">Compound</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-xs text-muted-foreground">
          <a href="#proof" className="hover:text-foreground">Proof</a>
          <a href="#why" className="hover:text-foreground">Why now</a>
          <a href="#partners" className="hover:text-foreground">Partners</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/waitlist"
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
          >
            Request access
          </Link>
          <Link
            to="/app"
            search={{ role: "csm", demo: true }}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3.5 py-1.5 rounded-full hover:opacity-90"
          >
            See it after a call <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 pt-20 pb-20 md:pt-28 md:pb-28 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 mb-7 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-3 py-1">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            For CSMs carrying a renewal book
          </div>
          <h1 className="font-display text-5xl md:text-[68px] font-semibold tracking-tight leading-[1.0]">
            The save,{" "}
            <span className="italic text-muted-foreground">already</span>{" "}
            shipped.
          </h1>
          <p className="mt-7 text-base md:text-lg text-muted-foreground leading-relaxed">
            You finish a renewal call. You open your laptop. The follow-ups are
            already written. The CRM is already updated. Your manager already
            has the brief. You read for ninety seconds and sign once.
          </p>
          <p className="mt-4 text-base md:text-lg text-foreground/90 leading-relaxed">
            Six hours of after-call work, done before you close the tab.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              search={{ role: "csm", demo: true }}
              className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
            >
              Walk into the workspace <ArrowUpRight className="size-4" />
            </Link>
            <Link
              to="/waitlist"
              className="inline-flex items-center gap-2 text-sm font-medium border border-border px-5 py-3 rounded-full hover:bg-accent/40"
            >
              Talk to the founders
            </Link>
          </div>

          <p className="mt-7 text-[11px] font-mono text-muted-foreground">
            Read-only by default. You sign every outbound. Your data stays yours.
          </p>
        </div>

        <AfterCallTile />
      </div>
    </section>
  );
}

// A single living receipt of one save. No taxonomy, no playbook,
// no five-step recipe. Just the moment the CSM walks back in.
function AfterCallTile() {
  const [signed, setSigned] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="border border-border rounded-2xl bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success" />
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Call ended {formatElapsed(seconds)} ago
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          Acme · Q1 renewal
        </span>
      </div>
      <div className="p-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">
          While you said goodbye, this happened
        </div>
        <div className="font-display text-lg font-semibold tracking-tight mb-5 leading-snug">
          Recap drafted. CRM updated. Manager briefed.
        </div>

        <div className="space-y-2.5 mb-6 text-[13px]">
          <Row label="Recap email to champion" status="Drafted in your outbox" />
          <Row label="Salesforce: opportunity stage" status="Staged" />
          <Row label="Follow-up tasks" status="4 queued in Asana" />
          <Row label="Internal Slack note" status="Ready for #renewals" />
        </div>

        <button
          onClick={() => setSigned(true)}
          disabled={signed}
          className={`w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition ${
            signed
              ? "bg-success/15 text-success border border-success/30"
              : "bg-foreground text-background hover:opacity-90"
          }`}
        >
          {signed ? "Signed. Shipped." : "Sign once. Ship it all."}
        </button>
        <p className="text-[11px] text-muted-foreground text-center mt-3">
          One signature. Four tools updated. You go home.
        </p>
      </div>
    </div>
  );
}

function Row({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border/60 last:border-0">
      <span className="text-foreground/90">{label}</span>
      <span className="text-[11px] font-mono text-muted-foreground">{status}</span>
    </div>
  );
}

function formatElapsed(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  return `${m}m ${r}s`;
}

function Proof() {
  // The product writes a timestamped ledger during every call. That artifact
  // does not exist in any other CS tool, so the section is shaped like the
  // artifact itself. The layout IS the differentiator.
  const entries: {
    t: string;
    surface: string;
    action: string;
    detail: string;
    weight?: "primary" | "muted";
  }[] = [
    { t: "00:04", surface: "Listening", action: "Call joined", detail: "Acme · Q1 renewal · 4 attendees", weight: "muted" },
    { t: "07:12", surface: "Salesforce", action: "Stage staged", detail: "Negotiation → Verbal commit" },
    { t: "11:48", surface: "Salesforce", action: "Field staged", detail: "Renewal risk: Medium → Low" },
    { t: "18:30", surface: "Asana", action: "Task queued", detail: "Send pricing addendum to procurement" },
    { t: "18:31", surface: "Asana", action: "Task queued", detail: "Loop in Solutions on SSO rollout" },
    { t: "24:09", surface: "Gmail", action: "Draft written", detail: "Recap to champion. 312 words. Cites 3 commitments." },
    { t: "31:55", surface: "Asana", action: "Task queued", detail: "Schedule QBR for week of Mar 17" },
    { t: "36:20", surface: "Slack", action: "Note composed", detail: "#renewals brief. 1 paragraph. 2 asks for manager." },
    { t: "41:02", surface: "Asana", action: "Task queued", detail: "Update mutual action plan with new milestone" },
    { t: "42:00", surface: "Compound", action: "Call ended", detail: "Workspace ready. Waiting for one signature.", weight: "primary" },
  ];

  return (
    <section id="proof" className="border-b border-border bg-background">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <span className="eyebrow block mb-4">The proof is the receipt</span>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
              42 minutes on a call.
              <br />
              <span className="text-muted-foreground italic">9 things on your desk.</span>
            </h2>
            <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-md">
              This is the ledger Compound writes during one renewal call. Every
              line is reversible. Every line cites the moment in the transcript
              it came from. Nothing leaves your tools without your signature.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
              <Stat n="4" l="Tools touched" />
              <Stat n="9" l="Actions staged" />
              <Stat n="1" l="Signature left" />
            </div>
          </div>

          <div className="border border-border rounded-2xl bg-surface overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-background">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-success animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Live ledger · Acme renewal · Mar 04
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                ledger.compound
              </span>
            </div>
            <ol>
              {entries.map((e, i) => (
                <li
                  key={i}
                  className={`grid grid-cols-[56px_104px_1fr] gap-4 px-5 py-3.5 items-baseline border-b border-border/60 last:border-0 transition ${
                    e.weight === "primary" ? "bg-accent/40" : "hover:bg-accent/25"
                  }`}
                >
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    {e.t}
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                      e.weight === "muted"
                        ? "text-muted-foreground/60"
                        : e.weight === "primary"
                          ? "text-foreground"
                          : "text-foreground/70"
                    }`}
                  >
                    {e.surface}
                  </span>
                  <span className="text-[13px] leading-snug">
                    <span
                      className={`font-medium ${
                        e.weight === "muted" ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {e.action}.
                    </span>{" "}
                    <span className="text-muted-foreground">{e.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="px-5 py-4 border-t border-border bg-background flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                End of call. Workspace waiting.
              </span>
              <span className="font-mono text-[10px] text-foreground">
                → 1 signature
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="bg-background py-4 px-2 text-center">
      <div className="font-display text-2xl font-semibold tracking-tight tabular-nums">
        {n}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mt-1">
        {l}
      </div>
    </div>
  );
}


function Why() {
  return (
    <section id="why" className="border-b border-border bg-surface/40">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 md:py-28 grid lg:grid-cols-[0.9fr_1fr] gap-12 items-start">
        <div>
          <span className="eyebrow block mb-3">Why this, why now</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05]">
            Every CS tool tells you the customer is at risk.
          </h2>
          <p className="mt-4 font-display text-2xl md:text-3xl font-semibold tracking-tight text-muted-foreground leading-[1.1]">
            None of them do the work that follows.
          </p>
        </div>
        <div className="space-y-6 text-base text-foreground/90 leading-relaxed">
          <p>
            Your CSMs are not short on signal. They are short on time. The
            average renewals manager spends six hours after every customer call
            translating it back into their stack. Notes, drafts, CRM fields,
            tasks, internal updates.
          </p>
          <p>
            That work is the job. It is also the work that gets skipped at 7pm
            on a Thursday, and it is the work churn lives inside of.
          </p>
          <p className="text-foreground font-medium">
            Compound is what closes that loop. The proof is what you find when
            you open your laptop.
          </p>
        </div>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section id="partners" className="border-b border-border">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 md:py-28 grid lg:grid-cols-[1fr_0.8fr] gap-14 items-start">
        <div className="max-w-xl">
          <span className="eyebrow block mb-3">Design partners</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05]">
            Six CS teams. One quarter. Founder in the room.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Weekly working sessions with the founders. Concierge setup on your
            actual stack. Founding pricing locked for life. We pick six teams
            and stop.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/waitlist"
              className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-3 rounded-full hover:opacity-90"
            >
              Request access <ArrowUpRight className="size-4" />
            </Link>
            <span className="text-[11px] font-mono text-muted-foreground">
              3 of 6 slots open
            </span>
          </div>
        </div>

        <figure className="border border-border rounded-2xl bg-surface p-8">
          <Quote className="size-5 text-muted-foreground mb-4" />
          <blockquote className="text-base md:text-lg font-display tracking-tight leading-snug">
            "I stopped doing the 7pm recap. It is just there when I open Gmail.
            That is the whole pitch."
          </blockquote>
          <figcaption className="mt-5 text-xs text-muted-foreground">
            Illustrative partner quote. Director of CS, SaaS, $40M ARR.
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
          <span className="font-mono">Compound</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/waitlist" className="hover:text-foreground">Request access</Link>
          <Link to="/app" search={{ role: "csm", demo: true }} className="hover:text-foreground">
            See it after a call
          </Link>
          <a href="mailto:founders@compound.dev" className="hover:text-foreground">
            founders@compound.dev
          </a>
        </div>
      </div>
    </footer>
  );
}
