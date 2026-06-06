import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Quote } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ledgerline. The save, already shipped." },
      {
        name: "description",
        content:
          "Ledgerline drafts the post-call work for every account. Every line pinned to the verbatim quote it came from. You read one screen and sign once.",
      },
      { property: "og:title", content: "Ledgerline. The save, already shipped." },
      {
        property: "og:description",
        content:
          "Finish the call. Open your laptop. The work is drafted, every line pinned to the customer's exact words. One signature ships it.",
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
          <span className="font-display font-semibold tracking-tight">Ledgerline</span>
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
            You finish a renewal call. The recap is drafted, the CRM is staged,
            your manager has the brief. Every line is pinned to the exact words
            your customer said.
          </p>
          <p className="mt-4 text-base md:text-lg text-foreground/90 leading-relaxed">
            You read for ninety seconds and sign once.
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
          Recap drafted. CRM staged. Manager briefed.
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

// The ledger writes one line per action during the call. The moat is that
// every line carries the verbatim words it came from, so the receipt and
// the proof live in the same row.
const ENTRIES: {
  t: string;
  surface: string;
  action: string;
  detail: string;
  quote?: string;
  weight?: "primary" | "muted";
}[] = [
  { t: "00:04", surface: "Listening", action: "Call joined", detail: "Acme · Q1 renewal · 4 attendees", weight: "muted" },
  {
    t: "07:12",
    surface: "Salesforce",
    action: "Stage staged",
    detail: "Negotiation → Verbal commit",
    quote: "we'd want to lock pricing before the board meeting on the 22nd",
  },
  {
    t: "11:48",
    surface: "Salesforce",
    action: "Field staged",
    detail: "Renewal risk: Medium → Low",
    quote: "honestly the SSO rollout fixed the thing my CTO was worried about",
  },
  {
    t: "18:30",
    surface: "Asana",
    action: "Task queued",
    detail: "Send pricing addendum to procurement",
    quote: "send the redlined addendum straight to Maya in procurement",
  },
  { t: "18:31", surface: "Asana", action: "Task queued", detail: "Loop in Solutions on SSO rollout" },
  {
    t: "24:09",
    surface: "Gmail",
    action: "Draft written",
    detail: "Recap to champion. 312 words. Cites 3 commitments.",
    quote: "put the three things we agreed to in writing so I can forward it up",
  },
  { t: "31:55", surface: "Asana", action: "Task queued", detail: "Schedule QBR for week of Mar 17" },
  {
    t: "36:20",
    surface: "Slack",
    action: "Note composed",
    detail: "#renewals brief. 1 paragraph. 2 asks for manager.",
    quote: "I'll need an exec on the next call, just for the optics",
  },
  { t: "41:02", surface: "Asana", action: "Task queued", detail: "Update mutual action plan with new milestone" },
  { t: "42:00", surface: "Ledgerline", action: "Call ended", detail: "Workspace ready. Waiting for one signature.", weight: "primary" },
];

const SURFACES = ["Listening", "Salesforce", "Asana", "Gmail", "Slack", "Ledgerline"] as const;
const RANGES = [
  { label: "All", min: 0, max: 60 },
  { label: "0–15 min", min: 0, max: 15 },
  { label: "15–30 min", min: 15, max: 30 },
  { label: "30–45 min", min: 30, max: 45 },
] as const;

function parseMinutes(t: string) {
  const [m, s] = t.split(":").map(Number);
  return m + s / 60;
}

function Proof() {
  const [activeSurfaces, setActiveSurfaces] = useState<Set<string>>(
    new Set(SURFACES)
  );
  const [rangeIdx, setRangeIdx] = useState(0);

  const range = RANGES[rangeIdx];

  const filtered = useMemo(() => {
    return ENTRIES.filter((e) => {
      const inRange =
        parseMinutes(e.t) >= range.min && parseMinutes(e.t) < range.max;
      return activeSurfaces.has(e.surface) && inRange;
    });
  }, [activeSurfaces, range]);

  const toolsTouched = useMemo(
    () => new Set(filtered.map((e) => e.surface)).size,
    [filtered]
  );

  function toggleSurface(name: string) {
    setActiveSurfaces((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  return (
    <section id="proof" className="border-b border-border bg-background">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <span className="eyebrow block mb-4">Every line pinned to the call</span>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
              42 minutes on a call.
              <br />
              <span className="text-muted-foreground italic">9 things on your desk.</span>
            </h2>
            <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-md">
              This is the ledger Ledgerline writes during one renewal call. Every
              line cites the customer's exact words, in the moment they said
              them. Nothing leaves your tools without your signature.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
              <Stat n={String(toolsTouched)} l="Tools touched" />
              <Stat n={String(filtered.length)} l="Actions staged" />
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
                ledger.ledgerline
              </span>
            </div>

            <div className="px-5 py-3 border-b border-border bg-background/60">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mr-1">
                  Tool
                </span>
                {SURFACES.map((s) => {
                  const on = activeSurfaces.has(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSurface(s)}
                      className={`text-[10px] font-mono uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        on
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground mr-1">
                  Window
                </span>
                {RANGES.map((r, i) => {
                  const on = i === rangeIdx;
                  return (
                    <button
                      key={r.label}
                      onClick={() => setRangeIdx(i)}
                      className={`text-[10px] font-mono uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        on
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <ol>
              {filtered.map((e, i) => (
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
                  <div className="text-[13px] leading-snug">
                    <span
                      className={`font-medium ${
                        e.weight === "muted" ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {e.action}.
                    </span>{" "}
                    <span className="text-muted-foreground">{e.detail}</span>
                    {e.quote && (
                      <div className="mt-1.5 flex items-start gap-2 pl-3 border-l-2 border-success/50">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-success/80 mt-0.5 shrink-0">
                          Quote
                        </span>
                        <span className="text-[12px] italic text-foreground/80">
                          "{e.quote}"
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                  No entries match the selected filters.
                </li>
              )}
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
          <span className="eyebrow block mb-3">Score the work, or do the work</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05]">
            Your dashboard scores the account.
          </h2>
          <p className="mt-4 font-display text-2xl md:text-3xl font-semibold tracking-tight text-muted-foreground leading-[1.1]">
            We do the work.
          </p>
        </div>
        <div className="space-y-6 text-base text-foreground/90 leading-relaxed">
          <p>
            Health scores tell you an account is at risk. They don't write the
            follow-up, stage the CRM, or post the internal note. That work is
            what actually moves the renewal.
          </p>
          <p>
            And today it depends on whether the CSM had the hours. It gets done
            on the accounts someone reached, and skipped on the rest.
          </p>
          <p className="text-foreground font-medium">
            Ledgerline closes that loop. The proof is what you find when you
            open your laptop.
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
            "I stopped doing the 7pm recap. It's just there when I open Gmail.
            That's the whole pitch."
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
          <span className="font-mono">Ledgerline</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/waitlist" className="hover:text-foreground">Request access</Link>
          <Link to="/app" search={{ role: "csm", demo: true }} className="hover:text-foreground">
            See it after a call
          </Link>
          <a href="mailto:founders@ledgerline.dev" className="hover:text-foreground">
            founders@ledgerline.dev
          </a>
        </div>
      </div>
    </footer>
  );
}
