import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  X,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Filter,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Radio,
  Bot,
  Activity,
} from "lucide-react";
import {
  ACCOUNTS,
  arrAtRisk,
  formatARR,
  surpriseCount,
  type Account,
  type Channel,
  type Receipt,
} from "@/lib/loop/portfolio";
import { BACKTEST, BACKTEST_STATS, type BacktestCase } from "@/lib/loop/backtest";
import { TODAYS_BRIEF, briefAccount } from "@/lib/loop/brief";
import {
  AGENTS,
  AGENT_OUTCOMES,
  OVERNIGHT_FEED,
  type Agent,
  type FeedEvent,
} from "@/lib/loop/agents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Receipts — your CS team's overnight agents" },
      {
        name: "description",
        content:
          "Four specialist agents read every customer call, Slack, and email overnight — and leave your CSM a 90-second morning brief with every claim cited. Backtested on 47 renewals.",
      },
    ],
  }),
  component: ReceiptsApp,
});

type SortKey = "gap" | "renewal" | "arr";

function ReceiptsApp() {
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("gap");
  const [filter, setFilter] = useState<"all" | "surprises" | "red">("surprises");

  const accounts = useMemo(() => {
    let list = [...ACCOUNTS];
    if (filter === "surprises") {
      list = list.filter(
        (a) => Math.abs(a.vendorScore.value - a.receiptsScore.value) >= 20,
      );
    } else if (filter === "red") {
      list = list.filter((a) => a.receiptsScore.label === "Red");
    }
    list.sort((a, b) => {
      if (sort === "gap") {
        const ga = a.vendorScore.value - a.receiptsScore.value;
        const gb = b.vendorScore.value - b.receiptsScore.value;
        return gb - ga;
      }
      if (sort === "renewal") return a.renewalDays - b.renewalDays;
      return b.arr - a.arr;
    });
    return list;
  }, [filter, sort]);

  const openAccount = openAccountId
    ? ACCOUNTS.find((a) => a.id === openAccountId) ?? null
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <AutopilotTicker />
      <main className="max-w-[1280px] mx-auto px-8 py-10">
        <Hero />
        <ProofStrip />
        <TodaysBrief onOpen={(id) => setOpenAccountId(id)} />
        <AgentRoster />
        <OvernightFeed />
        <section className="mt-16">
          <SectionHead
            eyebrow="The portfolio"
            title="Every account, scored on what the customer is actually saying."
            sub="Your dashboard reads what your team logged. Receipts reads the calls, Slack, and email — and flags the gap."
          />
          <Controls
            sort={sort}
            setSort={setSort}
            filter={filter}
            setFilter={setFilter}
            count={accounts.length}
          />
          <PortfolioTable
            accounts={accounts}
            onOpen={(id) => setOpenAccountId(id)}
          />
        </section>
        <Backtest />
        <LiveTryIt />
        <Wedge />
        <Founder />
        <Footer />
      </main>

      {openAccount && (
        <AccountDrawer
          account={openAccount}
          onClose={() => setOpenAccountId(null)}
        />
      )}
    </div>
  );
}

function TopBar() {
  return (
    <header className="border-b border-border sticky top-0 z-40 bg-background/85 backdrop-blur">
      <div className="max-w-[1280px] mx-auto px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-background text-[11px] font-bold font-mono">R</span>
          </div>
          <span className="font-display font-semibold tracking-tight">Receipts</span>
          <span className="eyebrow ml-3 hidden sm:inline">Inbox · Tue Nov 11 · 7:42a</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
          <a href="#brief" className="hover:text-foreground">Today</a>
          <a href="#portfolio" className="hover:text-foreground">Portfolio</a>
          <a href="#backtest" className="hover:text-foreground">Proof</a>
          <a href="#try" className="hover:text-foreground">Try it</a>
          <a href="#wedge" className="hover:text-foreground">Why us</a>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground hidden md:inline">Keila Ramos</span>
          <div className="size-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
            KR
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mb-10 max-w-3xl pt-2">
      <div className="inline-flex items-center gap-2 mb-5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-3 py-1">
        <span className="size-1.5 rounded-full bg-success animate-pulse" />
        4 agents · {AGENT_OUTCOMES.conversationsRead} conversations read overnight · {AGENT_OUTCOMES.briefsDrafted} briefs on your desk
      </div>
      <h1 className="font-display text-4xl md:text-[56px] font-semibold tracking-tight mb-5 leading-[1.02]">
        Your CS team<br />now runs overnight.
      </h1>
      <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
        Four specialist agents read every customer call, Slack thread, and email
        while you sleep — then leave a 90-second morning brief with every claim
        cited back to the exact moment the customer said it. The renewal forecast
        your CFO will finally trust.
      </p>
    </section>
  );
}


function ProofStrip() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden mb-12 border border-border">
      <Stat
        label="Surprise churns caught"
        value={`${BACKTEST_STATS.caughtByReceipts}/${BACKTEST_STATS.surpriseChurns}`}
        sub={`Vendor caught ${BACKTEST_STATS.caughtByVendor}/${BACKTEST_STATS.surpriseChurns}`}
      />
      <Stat
        label="Avg early warning"
        value={`${BACKTEST_STATS.avgEarlyWarningDays}d`}
        sub="before the score flipped"
        accent="text-foreground"
      />
      <Stat
        label="Precision"
        value={`${Math.round(BACKTEST_STATS.precision * 100)}%`}
        sub={`on ${BACKTEST_STATS.totalRenewals} closed renewals`}
      />
      <Stat
        label="ARR mis-scored today"
        value={formatARR(
          ACCOUNTS.filter(
            (a) =>
              a.vendorScore.label === "Green" && a.receiptsScore.label !== "Green",
          ).reduce((s, a) => s + a.arr, 0),
        )}
        sub="green on dashboard · red in receipts"
        accent="text-danger"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="bg-surface p-6">
      <div className="eyebrow mb-3">{label}</div>
      <div className={`font-display text-3xl font-semibold mb-1 tabular-nums ${accent ?? ""}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      <span className="eyebrow block mb-3">{eyebrow}</span>
      <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight leading-tight mb-2">
        {title}
      </h2>
      {sub && <p className="text-sm text-muted-foreground leading-relaxed">{sub}</p>}
    </div>
  );
}

function TodaysBrief({ onOpen }: { onOpen: (id: string) => void }) {
  const urgencyStyle: Record<string, string> = {
    now: "bg-danger/10 text-danger",
    today: "bg-warning/15 text-warning",
    "this-week": "bg-muted text-muted-foreground",
  };
  return (
    <section id="brief" className="mb-4 scroll-mt-20">
      <SectionHead
        eyebrow="Today's brief · 3 plays before lunch"
        title="The three calls that move your number this quarter."
      />
      <div className="grid md:grid-cols-3 gap-3">
        {TODAYS_BRIEF.map((b) => {
          const acc = briefAccount(b.accountId);
          if (!acc) return null;
          return (
            <button
              key={b.accountId}
              onClick={() => onOpen(b.accountId)}
              className="text-left border border-border rounded-2xl p-5 bg-surface hover:border-foreground/40 transition-colors group flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  #{b.rank}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${urgencyStyle[b.urgency]}`}
                >
                  {b.urgency.replace("-", " ")}
                </span>
              </div>
              <div className="font-display font-semibold text-base mb-1 tracking-tight">
                {acc.name}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground mb-3">
                {formatARR(b.arrAtStake)} · {acc.renewalDays}d to renewal
              </div>
              <p className="text-sm leading-relaxed mb-3 flex-1">{b.action}</p>
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                <span className="text-foreground/70 font-medium">Because: </span>
                {b.because}
              </p>
              <div className="mt-4 text-xs text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1">
                Open receipts <ArrowUpRight className="size-3" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Controls({
  sort,
  setSort,
  filter,
  setFilter,
  count,
}: {
  sort: SortKey;
  setSort: (s: SortKey) => void;
  filter: "all" | "surprises" | "red";
  setFilter: (f: "all" | "surprises" | "red") => void;
  count: number;
}) {
  return (
    <div id="portfolio" className="flex flex-wrap items-center justify-between gap-4 mb-3 scroll-mt-20">
      <div className="flex items-center gap-2">
        <Filter className="size-3.5 text-muted-foreground" />
        {(
          [
            ["surprises", "Surprises"],
            ["red", "At risk"],
            ["all", "All accounts"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === k
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-2 font-mono">{count} shown</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="eyebrow">Sort</span>
        {(
          [
            ["gap", "Largest gap"],
            ["renewal", "Soonest renewal"],
            ["arr", "ARR"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              sort === k ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PortfolioTable({
  accounts,
  onOpen,
}: {
  accounts: Account[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-surface">
      <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.7fr_0.6fr] gap-4 px-6 py-3 border-b border-border text-[10px] uppercase tracking-[0.18em] font-mono text-muted-foreground">
        <div>Account</div>
        <div>Gainsight</div>
        <div>Receipts</div>
        <div>ARR · Renewal</div>
        <div className="text-right">Open</div>
      </div>
      {accounts.map((a) => (
        <Row key={a.id} account={a} onOpen={() => onOpen(a.id)} />
      ))}
      {accounts.length === 0 && (
        <div className="p-12 text-center text-sm text-muted-foreground">
          No accounts match this filter.
        </div>
      )}
    </div>
  );
}

function Row({ account, onOpen }: { account: Account; onOpen: () => void }) {
  const gap = account.vendorScore.value - account.receiptsScore.value;
  const direction = gap >= 20 ? "down" : gap <= -20 ? "up" : "flat";
  const renewalColor =
    account.renewalDays <= 14
      ? "text-danger"
      : account.renewalDays <= 45
      ? "text-warning"
      : "text-muted-foreground";
  return (
    <button
      onClick={onOpen}
      className="w-full text-left grid grid-cols-[1.6fr_0.8fr_0.8fr_0.7fr_0.6fr] gap-4 px-6 py-5 border-b border-border last:border-b-0 hover:bg-accent/40 transition-colors group"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-semibold text-base">{account.name}</span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {account.segment}
          </span>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2 max-w-xl">
          {account.headline}
        </div>
        <SignalTimeline receipts={account.receipts} />
      </div>
      <ScoreCell value={account.vendorScore.value} label={account.vendorScore.label} muted />
      <ScoreCell
        value={account.receiptsScore.value}
        label={account.receiptsScore.label}
        delta={direction === "down" ? "down" : direction === "up" ? "up" : undefined}
        deltaMagnitude={Math.abs(gap)}
      />
      <div>
        <div className="font-mono text-sm">{formatARR(account.arr)}</div>
        <div className={`text-xs flex items-center gap-1 ${renewalColor}`}>
          <Clock className="size-3" />
          {account.renewalDays}d
        </div>
      </div>
      <div className="flex justify-end items-center">
        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors inline-flex items-center gap-1">
          Open receipts <ArrowUpRight className="size-3" />
        </span>
      </div>
    </button>
  );
}

function SignalTimeline({ receipts }: { receipts: Receipt[] }) {
  // Mini sparkline: each receipt as a colored tick. Negative = down, positive = up.
  return (
    <div className="flex items-end gap-0.5 mt-2 h-3">
      {receipts.map((r) => {
        const color = r.weight < 0 ? "bg-danger" : r.weight > 0 ? "bg-success" : "bg-muted-foreground/30";
        const h = Math.min(12, 4 + Math.abs(r.weight) * 3);
        return (
          <span
            key={r.id}
            className={`w-1 rounded-sm ${color}`}
            style={{ height: `${h}px` }}
            title={r.source}
          />
        );
      })}
    </div>
  );
}

function ScoreCell({
  value,
  label,
  delta,
  deltaMagnitude,
  muted,
}: {
  value: number;
  label: "Green" | "Yellow" | "Red";
  delta?: "up" | "down";
  deltaMagnitude?: number;
  muted?: boolean;
}) {
  const color =
    label === "Green" ? "bg-success" : label === "Yellow" ? "bg-warning" : "bg-danger";
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`size-2 rounded-full ${color} ${muted ? "opacity-60" : ""}`} />
        <span
          className={`font-mono text-sm tabular-nums ${
            muted ? "text-muted-foreground" : "text-foreground font-semibold"
          }`}
        >
          {value}
        </span>
        {delta && deltaMagnitude !== undefined && (
          <span
            className={`inline-flex items-center text-[10px] font-mono ${
              delta === "down" ? "text-danger" : "text-success"
            }`}
          >
            {delta === "down" ? (
              <ArrowDownRight className="size-3" />
            ) : (
              <ArrowUpRight className="size-3" />
            )}
            {deltaMagnitude}
          </span>
        )}
      </div>
      <div className="h-1 w-20 bg-foreground/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} ${muted ? "opacity-60" : ""}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function AccountDrawer({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const gap = account.vendorScore.value - account.receiptsScore.value;
  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full bg-background border-l border-border overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-8 py-5 flex items-start justify-between gap-4 z-10">
          <div>
            <span className="eyebrow block mb-2">
              {account.segment} · {formatARR(account.arr)} ARR · {account.renewalDays}d to renewal
            </span>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{account.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full hover:bg-accent flex items-center justify-center"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <ScoreCard
              kind="vendor"
              value={account.vendorScore.value}
              label={account.vendorScore.label}
              basis={account.vendorScore.basis}
            />
            <ScoreCard
              kind="receipts"
              value={account.receiptsScore.value}
              label={account.receiptsScore.label}
              basis={`${gap >= 0 ? gap : -gap} pt ${gap >= 0 ? "below" : "above"} Gainsight · ${account.receipts.length} receipts`}
            />
          </div>

          <section>
            <div className="eyebrow mb-2">What's actually going on</div>
            <p className="text-base leading-relaxed">{account.headline}</p>
          </section>

          <section className="border-l-2 border-primary pl-4">
            <div className="eyebrow mb-1 text-primary">Next play · 48h</div>
            <p className="text-sm leading-relaxed">{account.nextPlay}</p>
          </section>

          <section>
            <div className="flex items-end justify-between mb-3">
              <div className="eyebrow">Receipts · raw evidence</div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {account.receipts.length} signals
              </span>
            </div>
            <div className="space-y-2">
              {account.receipts
                .slice()
                .sort((a, b) => a.weight - b.weight)
                .map((r) => (
                  <ReceiptCard key={r.id} receipt={r} />
                ))}
            </div>
          </section>

          <section className="text-xs text-muted-foreground border-t border-border pt-4">
            Every score is computed from these receipts and nothing else. No black box — if
            a signal looks wrong, click it, see the source, and override.
          </section>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  kind,
  value,
  label,
  basis,
}: {
  kind: "vendor" | "receipts";
  value: number;
  label: "Green" | "Yellow" | "Red";
  basis: string;
}) {
  const color =
    label === "Green" ? "text-success" : label === "Yellow" ? "text-warning" : "text-danger";
  return (
    <div className="border border-border rounded-xl p-4 bg-surface">
      <div className="eyebrow mb-3">
        {kind === "vendor" ? "Gainsight score" : "Receipts score"}
      </div>
      <div className={`font-display text-3xl font-semibold mb-1 ${color}`}>
        {value}
        <span className="text-sm text-muted-foreground font-sans font-normal ml-2">{label}</span>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">{basis}</div>
    </div>
  );
}

const channelIcon: Record<Channel, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  slack: MessageSquare,
  email: Mail,
};

const signalLabel: Record<Receipt["signal"], string> = {
  champion_change: "Champion change",
  economic_buyer_shift: "Economic buyer shift",
  competitive_mention: "Competitive mention",
  adoption_drop: "Adoption drop",
  scope_expansion: "Scope expansion",
  roadmap_dependency: "Roadmap dependency",
  support_escalation: "Support escalation",
  exec_silence: "Exec silence",
  renewal_intent: "Renewal intent",
  advocacy: "Advocacy",
};

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const Icon = channelIcon[receipt.channel];
  const negative = receipt.weight < 0;
  const positive = receipt.weight > 0;
  const accent = negative ? "border-l-danger" : positive ? "border-l-success" : "border-l-border";
  return (
    <div className={`border border-border border-l-4 ${accent} rounded-md p-4 bg-surface`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs">
          <Icon className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-muted-foreground">{receipt.source}</span>
          {receipt.speaker && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-foreground">{receipt.speaker}</span>
            </>
          )}
        </div>
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
            negative
              ? "bg-danger/10 text-danger"
              : positive
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {signalLabel[receipt.signal]} {receipt.weight > 0 ? "+" : ""}
          {receipt.weight}
        </span>
      </div>
      <blockquote className="text-sm leading-relaxed text-foreground">
        "{receipt.quote}"
      </blockquote>
    </div>
  );
}

// ───────────────────────── BACKTEST ─────────────────────────

function Backtest() {
  const [active, setActive] = useState<BacktestCase>(BACKTEST[0]);
  return (
    <section id="backtest" className="mt-20 scroll-mt-20">
      <SectionHead
        eyebrow="The backtest · published"
        title="We replayed 47 closed renewals, blind to the outcome."
        sub={`${BACKTEST_STATS.designPartners} design partners, ${BACKTEST_STATS.windowMonths} months of history. Receipts caught ${BACKTEST_STATS.caughtByReceipts} of ${BACKTEST_STATS.surpriseChurns} surprise churns — an average of ${BACKTEST_STATS.avgEarlyWarningDays} days before the incumbent score flipped Red.`}
      />
      <div className="grid md:grid-cols-[1fr_1.4fr] gap-px border border-border rounded-2xl overflow-hidden bg-border">
        <div className="bg-surface max-h-[420px] overflow-y-auto">
          {BACKTEST.map((c) => {
            const isActive = c.id === active.id;
            const outcomeColor: Record<typeof c.outcome, string> = {
              churned: "text-danger",
              downsell: "text-warning",
              renewed: "text-success",
              expanded: "text-success",
            };
            return (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`w-full text-left px-5 py-4 border-b border-border last:border-b-0 transition-colors ${
                  isActive ? "bg-accent/40" : "hover:bg-accent/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-display font-semibold text-sm tracking-tight">
                    {c.account}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider ${outcomeColor[c.outcome]}`}
                  >
                    {c.outcome}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                  <span>{formatARR(c.arr)}</span>
                  <span>·</span>
                  <span className="text-muted-foreground">
                    V <span className="text-foreground/70">{c.vendor.score}</span>
                  </span>
                  <ArrowDownRight className="size-3 text-danger" />
                  <span>
                    R <span className="text-foreground/70">{c.receipts.score}</span>
                  </span>
                  <span className="ml-auto text-success">
                    +{c.receipts.firstSignalDays}d
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="bg-surface p-7">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${
                active.outcome === "churned" || active.outcome === "downsell"
                  ? "bg-danger/10 text-danger"
                  : "bg-success/10 text-success"
              }`}
            >
              Actually {active.outcome}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {formatARR(active.arr)} · {active.segment}
            </span>
          </div>
          <h3 className="font-display text-2xl font-semibold tracking-tight mb-3">
            {active.account}
          </h3>
          <p className="text-sm text-foreground leading-relaxed mb-6">{active.oneLine}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="border border-border rounded-lg p-3 bg-background">
              <div className="eyebrow mb-2">Vendor · 30d pre-renewal</div>
              <div className="font-display text-2xl font-semibold text-muted-foreground">
                {active.vendor.score}
              </div>
              <div className="text-xs text-muted-foreground">{active.vendor.label}</div>
            </div>
            <div className="border border-border rounded-lg p-3 bg-background">
              <div className="eyebrow mb-2 text-primary">
                Receipts · {active.receipts.firstSignalDays}d pre-renewal
              </div>
              <div className="font-display text-2xl font-semibold text-danger">
                {active.receipts.score}
              </div>
              <div className="text-xs text-muted-foreground">{active.receipts.label}</div>
            </div>
          </div>

          <div className="border-l-2 border-primary pl-4">
            <div className="eyebrow mb-1 text-primary">First signal</div>
            <div className="text-xs font-mono text-muted-foreground mb-1">
              {active.firstSignal.source}
            </div>
            <blockquote className="text-sm italic leading-relaxed">
              "{active.firstSignal.quote}"
            </blockquote>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4 max-w-2xl">
        Methodology and the full eval set (47 accounts, anonymized) are published.
        We show our work because the only thing CFOs care about more than the number
        is whether they can audit it.
      </p>
    </section>
  );
}

// ───────────────────────── LIVE TRY-IT ─────────────────────────

const SAMPLE_TRANSCRIPT = `[CSM] Hey, thanks for jumping on. Before we dive in — I noticed your VP of Eng wasn't on the calendar this quarter. How's Maya doing?
[Customer] Maya actually moved over to lead the platform org six weeks ago. We've got a new VP, Devin, who's been doing his own evaluation of tooling.
[CSM] Got it. Is Devin someone we've talked to?
[Customer] He was in the original eval and was the one pushing back. Honestly between us, he asked me last week whether we could build a thin version of what you do internally.
[CSM] Understood. How are the dispatcher teams using the lane optimizer?
[Customer] Phoenix loves it. Atlanta basically turned it off — their lead thinks it overrides his judgment. And our CFO is reviewing every six-figure line item before March.`;

type LiveSignal = {
  id: string;
  signal: keyof typeof signalLabel;
  weight: number;
  line: number;
  quote: string;
};

function scoreFromSignals(signals: LiveSignal[]) {
  const base = 70;
  const delta = signals.reduce((s, x) => s + x.weight * 6, 0);
  return Math.max(5, Math.min(95, base + delta));
}

function LiveTryIt() {
  const [text, setText] = useState(SAMPLE_TRANSCRIPT);
  const [phase, setPhase] = useState<"idle" | "scoring" | "done">("idle");
  const [signals, setSignals] = useState<LiveSignal[]>([]);

  // Demo-grade synthetic scoring (no key needed). Pattern-matches the
  // signal taxonomy to phrases in the transcript. Real engine uses a model.
  async function run() {
    setPhase("scoring");
    setSignals([]);
    const lines = text.split("\n");
    const detected: LiveSignal[] = [];
    const rules: { match: RegExp; signal: LiveSignal["signal"]; weight: number }[] = [
      { match: /moved over|new vp|took over|left|departing|last day/i, signal: "champion_change", weight: -3 },
      { match: /cfo|reviewing|line item|budget|procurement freeze/i, signal: "economic_buyer_shift", weight: -3 },
      { match: /build.*internally|build a thin version|competitor|rfp|evaluating other/i, signal: "competitive_mention", weight: -3 },
      { match: /turned (it )?off|stopped using|not using|skeptic|pushing back/i, signal: "adoption_drop", weight: -2 },
      { match: /loves it|standardize|expand|more please|advocate/i, signal: "advocacy", weight: 2 },
      { match: /roadmap|GA|release|timeline|depend/i, signal: "roadmap_dependency", weight: -1 },
    ];
    lines.forEach((line, i) => {
      rules.forEach((r) => {
        if (r.match.test(line)) {
          const m = line.match(r.match);
          detected.push({
            id: `s-${i}-${r.signal}`,
            signal: r.signal,
            weight: r.weight,
            line: i + 1,
            quote: m ? line.replace(/^\[[^\]]+\]\s*/, "").trim() : line,
          });
        }
      });
    });
    // Stream them in for effect
    for (let i = 0; i < detected.length; i++) {
      await new Promise((r) => setTimeout(r, 180));
      setSignals((prev) => [...prev, detected[i]]);
    }
    setPhase("done");
  }

  const score = scoreFromSignals(signals);
  const label: "Green" | "Yellow" | "Red" =
    score >= 65 ? "Green" : score >= 40 ? "Yellow" : "Red";

  return (
    <section id="try" className="mt-20 scroll-mt-20">
      <SectionHead
        eyebrow="Try the engine"
        title="Paste any call snippet. See how it scores."
        sub="No login. Synthetic detection runs locally so you can poke at the signal taxonomy. The production engine uses the model + your CRM context."
      />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-border rounded-2xl bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="eyebrow">Transcript</span>
            <button
              onClick={() => setText(SAMPLE_TRANSCRIPT)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Reset sample
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="w-full h-72 p-4 bg-transparent font-mono text-[12.5px] leading-relaxed resize-none outline-none"
          />
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {text.split("\n").filter(Boolean).length} lines
            </span>
            <button
              onClick={run}
              disabled={phase === "scoring"}
              className="inline-flex items-center gap-2 text-xs font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 disabled:opacity-50"
            >
              {phase === "scoring" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Scoring…
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" /> Score this call
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border border-border rounded-2xl bg-surface p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow">Receipts score</span>
            <span className="text-[10px] font-mono text-muted-foreground">live</span>
          </div>
          <div className="flex items-end gap-4 mb-5">
            <div
              className={`font-display text-5xl font-semibold tabular-nums ${
                label === "Green" ? "text-success" : label === "Yellow" ? "text-warning" : "text-danger"
              }`}
            >
              {phase === "idle" ? "—" : score}
            </div>
            <div className="pb-2">
              <div className="text-sm font-medium">{phase === "idle" ? "Run to score" : label}</div>
              <div className="text-xs text-muted-foreground">
                {signals.length} signal{signals.length === 1 ? "" : "s"} detected
              </div>
            </div>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-72">
            {signals.length === 0 && (
              <div className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
                Signals will stream in here, cited to the line they came from.
              </div>
            )}
            {signals.map((s) => (
              <div
                key={s.id}
                className={`border border-border border-l-4 ${
                  s.weight < 0 ? "border-l-danger" : "border-l-success"
                } rounded-md p-3 bg-background animate-reveal`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      s.weight < 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                    }`}
                  >
                    {signalLabel[s.signal]} {s.weight > 0 ? "+" : ""}
                    {s.weight}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    line {s.line}
                  </span>
                </div>
                <blockquote className="text-xs leading-relaxed">"{s.quote}"</blockquote>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── WEDGE ─────────────────────────

function Wedge() {
  const rows = [
    {
      capability: "Reads what your team logged",
      receipts: true,
      gainsight: true,
      gong: false,
      notetaker: false,
    },
    {
      capability: "Reads the actual call / Slack / email",
      receipts: true,
      gainsight: false,
      gong: "partial",
      notetaker: "partial",
    },
    {
      capability: "Scoped to CS, owned by CS",
      receipts: true,
      gainsight: true,
      gong: false,
      notetaker: false,
    },
    {
      capability: "Cites every score to a source moment",
      receipts: true,
      gainsight: false,
      gong: false,
      notetaker: false,
    },
    {
      capability: "Published eval set",
      receipts: true,
      gainsight: false,
      gong: false,
      notetaker: false,
    },
    {
      capability: "Confidence gate before forecasting",
      receipts: true,
      gainsight: false,
      gong: false,
      notetaker: false,
    },
  ] as const;
  const Cell = ({ v }: { v: boolean | "partial" }) =>
    v === true ? (
      <CheckCircle2 className="size-4 text-success mx-auto" />
    ) : v === "partial" ? (
      <span className="text-[10px] font-mono text-warning">partial</span>
    ) : (
      <XCircle className="size-4 text-muted-foreground/40 mx-auto" />
    );
  return (
    <section id="wedge" className="mt-20 scroll-mt-20">
      <SectionHead
        eyebrow="Why this exists"
        title="The seam four categories left open."
        sub="Gainsight reads your CRM. Gong is owned by Sales. Notetakers summarize one call. None of them rebuild the forecast from the customer's own voice."
      />
      <div className="border border-border rounded-2xl overflow-hidden bg-surface">
        <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] gap-px bg-border">
          <div className="bg-surface px-5 py-3 eyebrow">Capability</div>
          <div className="bg-surface px-5 py-3 eyebrow text-foreground">Receipts</div>
          <div className="bg-surface px-5 py-3 eyebrow">Gainsight</div>
          <div className="bg-surface px-5 py-3 eyebrow">Gong</div>
          <div className="bg-surface px-5 py-3 eyebrow">Notetakers</div>
        </div>
        {rows.map((r) => (
          <div
            key={r.capability}
            className="grid grid-cols-[1.4fr_repeat(4,1fr)] gap-px bg-border border-t border-border"
          >
            <div className="bg-surface px-5 py-3.5 text-sm">{r.capability}</div>
            <div className="bg-surface px-5 py-3.5 flex items-center justify-center">
              <Cell v={r.receipts} />
            </div>
            <div className="bg-surface px-5 py-3.5 flex items-center justify-center">
              <Cell v={r.gainsight} />
            </div>
            <div className="bg-surface px-5 py-3.5 flex items-center justify-center">
              <Cell v={r.gong} />
            </div>
            <div className="bg-surface px-5 py-3.5 flex items-center justify-center">
              <Cell v={r.notetaker} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4 max-w-2xl">
        Incumbents structurally can't ship this. Gainsight is a system-of-record; rebuilding
        scoring on unstructured conversation is a re-architecture. Gong is Sales-owned and
        won't pivot scoring to CS. Notetakers (Granola, Fathom) have no CS ontology and
        scope to one meeting. The wedge is real.
      </p>
    </section>
  );
}

// ───────────────────────── FOUNDER ─────────────────────────

function Founder() {
  return (
    <section className="mt-20 border-t border-border pt-14">
      <div className="max-w-2xl">
        <span className="eyebrow block mb-4">Why we're building this</span>
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-5 leading-tight">
          We're not selling software.<br />We're staffing your CS team — overnight.
        </h2>
        <div className="space-y-4 text-[15px] text-foreground/85 leading-relaxed">
          <p>
            Every VP of CS we talked to said the same thing: the renewal forecast is the
            number that gets them fired, and they don't trust their own dashboard. CSMs
            burn Fridays backfilling Gainsight to make Monday's number look defensible —
            and the CFO still doesn't believe it.
          </p>
          <p>
            So we built the team you'd hire if you could: four specialist agents that
            read every call, Slack thread, and email overnight, score every renewal from
            the customer's own voice, and cite every claim back to the moment it was
            said. Your CSM walks in at 7:42a to a brief, not an inbox.
          </p>
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">Where we go:</span> the brief is
            the wedge. Once the CSM trusts the agent's score more than their CRM's, we own
            the renewal forecast — then expansion, coaching, and staffing. The post-sales
            stack rebuilt from conversation-grade data instead of log-grade.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#try"
            className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-5 py-2.5 rounded-full hover:opacity-90"
          >
            Try the engine <ArrowUpRight className="size-4" />
          </a>
          <a
            href="mailto:founders@receipts.dev?subject=Design%20partner"
            className="inline-flex items-center gap-2 text-sm font-medium border border-border px-5 py-2.5 rounded-full hover:bg-accent/40"
          >
            Become a design partner
          </a>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 ml-1">
            <AlertTriangle className="size-3" /> 3 of 6 partner slots open · Q1
          </span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border mt-20 pt-8 pb-12 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="font-mono">Receipts · v0.2 · 8-account demo · 47-account backtest</div>
      <div>The morning view your CFO will trust.</div>
    </footer>
  );
}

// ───────────────────────── AUTOPILOT TICKER ─────────────────────────
// A live, always-on bar that streams the next agent event every few
// seconds. This is the "alive" surface — even before the user scrolls,
// they see specialist agents doing work right now.

function AutopilotTicker() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % OVERNIGHT_FEED.length);
    }, 3200);
    return () => clearInterval(t);
  }, [paused]);

  const e = OVERNIGHT_FEED[idx];
  const agent = AGENTS.find((a) => a.id === e.agent)!;
  const weightStyle: Record<FeedEvent["weight"], string> = {
    info: "text-muted-foreground",
    warn: "text-warning",
    danger: "text-danger",
    win: "text-success",
  };

  return (
    <div
      className="border-b border-border bg-surface/60 backdrop-blur sticky top-14 z-30"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-[1280px] mx-auto px-8 h-10 flex items-center gap-3 overflow-hidden">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-success shrink-0">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Autopilot · live
        </span>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:inline">
          {e.at}
        </span>
        <span className="text-[10px] font-mono text-foreground shrink-0">
          {agent.name}
        </span>
        <span className="text-muted-foreground/40 shrink-0">·</span>
        <p
          key={e.id}
          className="text-xs truncate animate-reveal"
          title={e.detail}
        >
          <span className={`font-medium ${weightStyle[e.weight]}`}>
            {e.verb}
          </span>
          {e.account && (
            <span className="text-muted-foreground"> on </span>
          )}
          {e.account && <span className="text-foreground">{e.account}</span>}
          <span className="text-muted-foreground"> — {e.detail}</span>
        </p>
        <span className="ml-auto shrink-0 text-[10px] font-mono text-muted-foreground hidden md:inline">
          {idx + 1} / {OVERNIGHT_FEED.length}
        </span>
      </div>
    </div>
  );
}

// ───────────────────────── AGENT ROSTER ─────────────────────────
// Meet-the-team for AI agents. Each card is a specialist with a charter,
// a status pulse, and live counters. Click-through opens the overnight
// feed filtered to that agent.

function AgentRoster() {
  const statusDot: Record<Agent["status"], string> = {
    working: "bg-success",
    standby: "bg-warning",
    queued: "bg-muted-foreground",
  };
  return (
    <section id="agents" className="mt-16 scroll-mt-20">
      <SectionHead
        eyebrow="The bench · 4 agents on duty"
        title="Specialist agents. Each one owns a single, hard CS question."
        sub="No general-purpose chatbot. Each agent has a charter, a domain, and a track record — and reports to you, not the other way around."
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {AGENTS.map((a) => (
          <div
            key={a.id}
            className="border border-border rounded-2xl p-5 bg-surface flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2">
                <div className="size-7 rounded-md bg-foreground/5 border border-border flex items-center justify-center">
                  <Bot className="size-3.5 text-foreground" />
                </div>
                <span className="font-display font-semibold text-sm tracking-tight">
                  {a.name}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span
                  className={`size-1.5 rounded-full ${statusDot[a.status]} ${a.status === "working" ? "animate-pulse" : ""}`}
                />
                {a.status}
              </span>
            </div>
            <div className="eyebrow mb-2">{a.role}</div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">
              {a.charter}
            </p>
            <div className="border-t border-border pt-3 mb-3">
              <div className="eyebrow mb-1">Now</div>
              <p className="text-xs leading-relaxed">{a.nowDoing}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="font-mono text-sm tabular-nums">{a.watching}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">watching</div>
              </div>
              <div>
                <div className="font-mono text-sm tabular-nums">{a.completedToday}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">done today</div>
              </div>
              <div>
                <div className="font-mono text-sm tabular-nums text-danger">{a.flagged}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">flagged</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ───────────────────────── OVERNIGHT FEED ─────────────────────────

function OvernightFeed() {
  const [filter, setFilter] = useState<"all" | Agent["id"]>("all");
  const events =
    filter === "all"
      ? OVERNIGHT_FEED
      : OVERNIGHT_FEED.filter((e) => e.agent === filter);
  const weightStyle: Record<FeedEvent["weight"], string> = {
    info: "border-l-muted text-muted-foreground",
    warn: "border-l-warning text-warning",
    danger: "border-l-danger text-danger",
    win: "border-l-success text-success",
  };
  return (
    <section id="overnight" className="mt-12 scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div className="max-w-xl">
          <span className="eyebrow block mb-2">
            Overnight · {AGENT_OUTCOMES.hoursOfWork}h of work · {AGENT_OUTCOMES.conversationsRead} conversations · {AGENT_OUTCOMES.signalsProcessed.toLocaleString()} signals
          </span>
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight leading-tight">
            What your agents did between 6:14p and 7:42a.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {([["all", "All"], ...AGENTS.map((a) => [a.id, a.name] as const)] as const).map(
            ([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k as typeof filter)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  filter === k
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="border border-border rounded-2xl overflow-hidden bg-surface divide-y divide-border">
        {events.map((e) => {
          const agent = AGENTS.find((a) => a.id === e.agent)!;
          return (
            <div
              key={e.id}
              className={`grid grid-cols-[64px_140px_1fr_auto] gap-4 px-5 py-3.5 border-l-2 ${weightStyle[e.weight].split(" ")[0]} items-start`}
            >
              <span className="font-mono text-[11px] text-muted-foreground pt-0.5">
                {e.at}
              </span>
              <span className="text-xs font-medium pt-0.5">{agent.name}</span>
              <div className="min-w-0">
                <p className="text-sm leading-relaxed">
                  <span className={`font-medium ${weightStyle[e.weight].split(" ").slice(1).join(" ")}`}>
                    {e.verb}
                  </span>
                  {e.account && (
                    <span className="text-muted-foreground"> · {e.account}</span>
                  )}
                  <span className="text-muted-foreground"> — {e.detail}</span>
                </p>
                {e.citation && (
                  <p className="text-[11px] font-mono text-muted-foreground mt-1">
                    cite: {e.citation}
                  </p>
                )}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground pt-0.5 hidden sm:inline">
                {e.weight}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

