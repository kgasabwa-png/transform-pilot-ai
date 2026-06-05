import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  X,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Filter,
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Receipts Inbox — the renewal risk your health score is missing" },
      {
        name: "description",
        content:
          "A morning view of your portfolio ranked by what customers are actually saying — every score cited back to the exact call, Slack, or email moment.",
      },
    ],
  }),
  component: ReceiptsInbox,
});

type SortKey = "gap" | "renewal" | "arr";

function ReceiptsInbox() {
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
      <main className="max-w-[1280px] mx-auto px-8 py-10">
        <Hero />
        <StatStrip />
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
        <HowItWorks />
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
    <header className="border-b border-border">
      <div className="max-w-[1280px] mx-auto px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-background text-[11px] font-bold font-mono">
              R
            </span>
          </div>
          <span className="font-display font-semibold tracking-tight">
            Receipts
          </span>
          <span className="eyebrow ml-3 hidden sm:inline">
            Inbox · Tue Nov 11
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground hidden md:inline">
            Keila Ramos
          </span>
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
    <section className="mb-10 max-w-3xl">
      <span className="eyebrow block mb-4">Receipts · Morning view</span>
      <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-4 leading-[1.05]">
        Your portfolio, ranked by what customers are actually saying.
      </h1>
      <p className="text-lg text-muted-foreground leading-relaxed">
        Health scores read what your team logged. Receipts reads the calls,
        the Slack messages, and the emails — and tells you which renewals
        your dashboard is lying to you about.
      </p>
    </section>
  );
}

function StatStrip() {
  const surprises = surpriseCount(ACCOUNTS);
  const atRisk = arrAtRisk(ACCOUNTS);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden mb-8 border border-border">
      <Stat
        label="Surprise renewals caught"
        value={String(surprises)}
        sub={`of ${ACCOUNTS.length} accounts · Gainsight ≠ Receipts`}
        accent="text-foreground"
      />
      <Stat
        label="ARR mis-scored as healthy"
        value={formatARR(
          ACCOUNTS.filter(
            (a) =>
              a.vendorScore.label === "Green" && a.receiptsScore.label !== "Green",
          ).reduce((s, a) => s + a.arr, 0),
        )}
        sub="green on dashboard · red in receipts"
        accent="text-danger"
      />
      <Stat
        label="ARR your dashboard understates"
        value={formatARR(
          ACCOUNTS.filter(
            (a) =>
              a.vendorScore.label !== "Green" && a.receiptsScore.label === "Green",
          ).reduce((s, a) => s + a.arr, 0),
        )}
        sub="yellow/red on dashboard · advocates in receipts"
        accent="text-success"
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
      <div className={`font-display text-3xl font-semibold mb-1 ${accent ?? ""}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
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
    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
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
        <span className="text-xs text-muted-foreground ml-2 font-mono">
          {count} shown
        </span>
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
              sort === k
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
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
    <div className="border border-border rounded-2xl overflow-hidden bg-surface mb-16">
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
  const direction =
    gap >= 20 ? "down" : gap <= -20 ? "up" : "flat";
  return (
    <button
      onClick={onOpen}
      className="w-full text-left grid grid-cols-[1.6fr_0.8fr_0.8fr_0.7fr_0.6fr] gap-4 px-6 py-5 border-b border-border last:border-b-0 hover:bg-accent/40 transition-colors group"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-semibold text-base">
            {account.name}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {account.segment}
          </span>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2 max-w-xl">
          {account.headline}
        </div>
      </div>
      <ScoreCell
        value={account.vendorScore.value}
        label={account.vendorScore.label}
        muted
      />
      <ScoreCell
        value={account.receiptsScore.value}
        label={account.receiptsScore.label}
        delta={direction === "down" ? "down" : direction === "up" ? "up" : undefined}
        deltaMagnitude={Math.abs(gap)}
      />
      <div>
        <div className="font-mono text-sm">{formatARR(account.arr)}</div>
        <div className="text-xs text-muted-foreground">
          {account.renewalDays}d to renewal
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
    label === "Green"
      ? "bg-success"
      : label === "Yellow"
      ? "bg-warning"
      : "bg-danger";
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`size-2 rounded-full ${color} ${muted ? "opacity-60" : ""}`}
        />
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
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {account.name}
            </h2>
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
            Every score is computed from these receipts and nothing else. No
            black box — if a signal looks wrong, click it, see the source, and
            override.
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
    label === "Green"
      ? "text-success"
      : label === "Yellow"
      ? "text-warning"
      : "text-danger";
  return (
    <div className="border border-border rounded-xl p-4 bg-surface">
      <div className="eyebrow mb-3">
        {kind === "vendor" ? "Gainsight score" : "Receipts score"}
      </div>
      <div className={`font-display text-3xl font-semibold mb-1 ${color}`}>
        {value}
        <span className="text-sm text-muted-foreground font-sans font-normal ml-2">
          {label}
        </span>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">
        {basis}
      </div>
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
  const accent = negative
    ? "border-l-danger"
    : positive
    ? "border-l-success"
    : "border-l-border";
  return (
    <div
      className={`border border-border border-l-4 ${accent} rounded-md p-4 bg-surface`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs">
          <Icon className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-muted-foreground">
            {receipt.source}
          </span>
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

function HowItWorks() {
  return (
    <section className="border-t border-border pt-12 mb-16">
      <span className="eyebrow block mb-4">How Receipts works</span>
      <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-8 max-w-2xl">
        Three reads your dashboard doesn't do.
      </h2>
      <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-2xl overflow-hidden">
        <Step
          icon={Sparkles}
          title="Ingest the actual conversation"
          body="Call transcripts (Gong, Zoom), Slack Connect channels, and shared inboxes. The customer's voice — not what your team had time to log."
        />
        <Step
          icon={AlertTriangle}
          title="Score on signals that move renewals"
          body="Champion change, economic buyer shift, competitive mention, roadmap dependency, exec silence. Ten signals trained on what actually predicts churn."
        />
        <Step
          icon={TrendingUp}
          title="Cite every number"
          body="Every score links back to the exact quote, channel, and timestamp. No black box. Your VP can audit the forecast in a single click."
        />
      </div>
    </section>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-surface p-8">
      <Icon className="size-5 mb-4 text-primary" />
      <h3 className="font-display text-lg font-semibold mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border pt-8 pb-12 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="font-mono">Receipts · v0.1 · synthetic portfolio</div>
      <div>
        Eight accounts. Real signals. The morning view your CFO will trust.
      </div>
    </footer>
  );
}
