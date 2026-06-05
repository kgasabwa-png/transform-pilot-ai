import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { joinWaitlist } from "@/lib/waitlist.functions";
import { BACKTEST, BACKTEST_STATS } from "@/lib/loop/backtest";
import { formatARR } from "@/lib/loop/portfolio";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Become a design partner — Receipts" },
      {
        name: "description",
        content:
          "Request access to Receipts: the agentic renewal desk that turns customer conversations into cited, human-reviewed CS work.",
      },
      { property: "og:title", content: "Become a design partner — Receipts" },
      {
        property: "og:description",
        content:
          "Run a concierge backtest on closed renewals before connecting your stack. Your data, your overrides, every claim cited.",
      },
    ],
  }),
  component: WaitlistPage,
});

function WaitlistPage() {
  const join = useServerFn(joinWaitlist);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await join({
        data: { email, note: note || undefined, source: "waitlist-page" },
      });
      if (res.ok) setStatus("done");
      else {
        setErrorMsg(res.error ?? "Something went wrong.");
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Try again in a moment.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-[1180px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={20} />
            <span className="font-mono text-sm tracking-tight">receipts</span>
          </Link>
          <Link
            to="/app"
            search={{ role: "csm" }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Try the live demo <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 max-w-2xl">
          <span className="eyebrow block mb-4">Concierge backtest · design partner preview</span>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            Show us closed renewals. We'll show what Receipts would have caught.
          </h1>
          <p className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
            Send 5–15 anonymized closed renewals before you connect anything. We'll show which
            churns, expansions, and forecast misses the agents would have flagged — with the exact
            customer moments behind each call.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            {[
              "Your data, your overrides — every play awaits CSM signoff.",
              "Cited to the line. No black-box scores, no hallucinated quotes.",
              "Onboarded in a week. We sit with your team, not behind a portal.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 mt-0.5 text-foreground shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-xs text-muted-foreground font-mono">
            No integration required · sample output first
          </p>

          <BacktestPreview />
        </section>

        <section className="bg-accent/30 border-l border-border px-6 md:px-12 py-16 md:py-24 flex items-start">
          <div className="w-full max-w-md">
            {status === "done" ? (
              <div className="rounded-2xl border border-border bg-background p-8">
                <CheckCircle2 className="size-6 mb-4" />
                <h2 className="text-xl font-semibold tracking-tight">You're on the list.</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  We'll be in touch within 48 hours from{" "}
                  <span className="font-mono">founders@receipts.dev</span> to schedule a working
                  session. In the meantime, the live demo workspace is open — no login.
                </p>
                <Link
                  to="/app"
                  search={{ role: "csm" }}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-4 py-2.5 rounded-full hover:opacity-90"
                >
                  Open the workspace <ArrowUpRight className="size-4" />
                </Link>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-border bg-background p-8 space-y-5"
              >
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Work email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="mt-2 w-full bg-transparent border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/40"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    What's the messiest part of your CS week?{" "}
                    <span className="lowercase opacity-60">(optional)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Renewals slipping with no warning, expansion guesses, exec ghosting…"
                    className="mt-2 w-full bg-transparent border border-border rounded-lg px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/40 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium bg-foreground text-background px-4 py-3 rounded-full hover:opacity-90 disabled:opacity-50"
                >
                  {status === "submitting" ? "Sending…" : "Request access"}
                  {status !== "submitting" && <ArrowUpRight className="size-4" />}
                </button>
                {status === "error" && <p className="text-xs text-destructive">{errorMsg}</p>}
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  We only use your email to coordinate the beta. No marketing list, no sharing,
                  ever.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">Receipts · private beta</span>
          <Link to="/" className="hover:text-foreground">
            ← back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}

function BacktestPreview() {
  return (
    <div className="mt-10 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="eyebrow">Sample backtest output</span>
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-primary border border-primary/15 bg-primary/5 rounded-full px-2 py-0.5">
          sample data
        </span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <BacktestStat label="renewals replayed" value={`${BACKTEST_STATS.totalRenewals}`} />
        <BacktestStat
          label="surprise churns caught"
          value={`${BACKTEST_STATS.caughtByReceipts}/${BACKTEST_STATS.surpriseChurns}`}
        />
        <BacktestStat label="avg early warning" value={`${BACKTEST_STATS.avgEarlyWarningDays}d`} />
      </div>
      <div className="space-y-3">
        {BACKTEST.slice(0, 2).map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{item.account.replace(" (real)", "")}</span>
              <span className="text-xs font-mono text-muted-foreground">{formatARR(item.arr)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.oneLine}</p>
            <p className="mt-2 text-[11px] font-mono text-foreground/70">
              first receipt · "{item.firstSignal.quote}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BacktestStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
