import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Clock,
  Bot,
  Users,
  LayoutGrid,
  TrendingUp,
} from "lucide-react";
import {
  ACCOUNTS,
  formatARR,
  type Account,
  type Channel,
  type Receipt,
} from "@/lib/loop/portfolio";
import { TODAYS_BRIEF, briefAccount } from "@/lib/loop/brief";
import {
  AGENTS,
  AGENT_OUTCOMES,
  OVERNIGHT_FEED,
  type Agent,
  type FeedEvent,
} from "@/lib/loop/agents";
import { PERSONAS, PERSONA_ORDER, type PersonaId } from "@/lib/loop/personas";
import { Logo } from "@/components/brand/Logo";

type AppSearch = { role: PersonaId };

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>): AppSearch => {
    const r = search.role;
    const role: PersonaId =
      r === "manager" || r === "leader" || r === "csm" ? r : "csm";
    return { role };
  },
  head: () => ({
    meta: [{ title: "Receipts — workspace" }],
  }),
  component: WorkspaceApp,
});

type SortKey = "gap" | "renewal" | "arr";

function WorkspaceApp() {
  const search = useSearch({ from: "/app" }) as AppSearch;
  const role: PersonaId = search.role;
  const persona = PERSONAS[role];
  const navigate = useNavigate({ from: "/app" });

  const [openAccountId, setOpenAccountId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("gap");
  const [filter, setFilter] = useState<"all" | "surprises" | "red">(
    role === "leader" ? "all" : "surprises",
  );

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
        return (
          (b.vendorScore.value - b.receiptsScore.value) -
          (a.vendorScore.value - a.receiptsScore.value)
        );
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
      <WorkspaceNav
        persona={role}
        onPersona={(p) => navigate({ search: { role: p } })}
      />
      <AutopilotTicker />
      <main className="max-w-[1280px] mx-auto px-8 py-10">
        <PersonaHero persona={role} />

        {role === "csm" && (
          <TodaysBrief onOpen={(id) => setOpenAccountId(id)} />
        )}

        {role === "leader" && <LeaderRollup />}

        {role === "manager" && <ManagerRollup />}

        <AgentRoster persona={role} />

        <section className="mt-16">
          <SectionHead
            eyebrow={
              role === "leader"
                ? "The book · cited forecast"
                : role === "manager"
                ? "Team coverage · gap by account"
                : "Your portfolio"
            }
            title={
              role === "leader"
                ? "Every account scored from the customer's own voice."
                : role === "manager"
                ? "Where your CSMs are flying blind."
                : "Every account on your book — scored on what the customer is saying."
            }
            sub={persona.who}
          />
          <Controls
            sort={sort}
            setSort={setSort}
            filter={filter}
            setFilter={setFilter}
            count={accounts.length}
          />
          <PortfolioTable accounts={accounts} onOpen={(id) => setOpenAccountId(id)} />
        </section>

        <OvernightFeed />

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

// ───────────────────────── NAV ─────────────────────────

function WorkspaceNav({
  persona,
  onPersona,
}: {
  persona: PersonaId;
  onPersona: (p: PersonaId) => void;
}) {
  return (
    <header className="border-b border-border sticky top-0 z-40 bg-background/85 backdrop-blur">
      <div className="max-w-[1280px] mx-auto px-8 h-14 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo />
          <span className="font-display font-semibold tracking-tight">Receipts</span>
        </Link>

        <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-full">
          {PERSONA_ORDER.map((p) => {
            const active = p === persona;
            const Icon = p === "csm" ? Users : p === "manager" ? LayoutGrid : TrendingUp;
            return (
              <button
                key={p}
                onClick={() => onPersona(p)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3" />
                {PERSONAS[p].label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground hidden md:inline text-xs">
            Keila Ramos · {PERSONAS[persona].label}
          </span>
          <div className="size-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
            KR
          </div>
        </div>
      </div>
    </header>
  );
}

function PersonaHero({ persona }: { persona: PersonaId }) {
  const p = PERSONAS[persona];
  return (
    <section className="mb-10 max-w-3xl pt-2">
      <div className="inline-flex items-center gap-2 mb-5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-3 py-1">
        <span className="size-1.5 rounded-full bg-success animate-pulse" />
        {p.hero.eyebrow}
      </div>
      <h1 className="font-display text-4xl md:text-[52px] font-semibold tracking-tight mb-5 leading-[1.05]">
        {p.hero.title}
      </h1>
      <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
        {p.hero.sub}
      </p>
    </section>
  );
}

// ───────────────────────── LEADER / MANAGER STRIPS ─────────────────────────

function LeaderRollup() {
  const misScored = ACCOUNTS.filter(
    (a) => a.vendorScore.label === "Green" && a.receiptsScore.label !== "Green",
  );
  const misScoredARR = misScored.reduce((s, a) => s + a.arr, 0);
  const totalARR = ACCOUNTS.reduce((s, a) => s + a.arr, 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden mb-12 border border-border">
      <Stat label="Cited forecast · Q1" value={formatARR(totalARR * 0.84)} sub="84% of book renewing on conversation evidence" />
      <Stat label="ARR mis-scored in CRM" value={formatARR(misScoredARR)} sub={`${misScored.length} accounts green in CRM, not in receipts`} accent="text-danger" />
      <Stat label="Avg early warning" value="38d" sub="before the incumbent score flipped" accent="text-foreground" />
      <Stat label="Citations per claim" value="3.2" sub="every score traces to source moments" />
    </div>
  );
}

function ManagerRollup() {
  const gaps = ACCOUNTS.filter(
    (a) => Math.abs(a.vendorScore.value - a.receiptsScore.value) >= 20,
  );
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden mb-12 border border-border">
      <Stat label="Team CSMs covered" value="8" sub="312 accounts under watch" />
      <Stat label="Coaching surface" value={`${gaps.length}`} sub="accounts with 20+ pt score gap" accent="text-warning" />
      <Stat label="ARR at risk · uncoached" value={formatARR(gaps.reduce((s, a) => s + a.arr, 0))} sub="surface-up to your 1:1s" />
      <Stat label="Briefs delivered today" value={`${AGENT_OUTCOMES.briefsDrafted}`} sub="across the team this morning" />
    </div>
  );
}

// ───────────────────────── SHARED PRIMITIVES ─────────────────────────

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
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

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
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
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">#{b.rank}</span>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${urgencyStyle[b.urgency]}`}>
                  {b.urgency.replace("-", " ")}
                </span>
              </div>
              <div className="font-display font-semibold text-base mb-1 tracking-tight">{acc.name}</div>
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
        {([["surprises", "Surprises"], ["red", "At risk"], ["all", "All accounts"]] as const).map(([k, label]) => (
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
        {([["gap", "Largest gap"], ["renewal", "Soonest renewal"], ["arr", "ARR"]] as const).map(([k, label]) => (
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

function PortfolioTable({ accounts, onOpen }: { accounts: Account[]; onOpen: (id: string) => void }) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-surface">
      <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.7fr_0.6fr] gap-4 px-6 py-3 border-b border-border text-[10px] uppercase tracking-[0.18em] font-mono text-muted-foreground">
        <div>Account</div>
        <div>CRM score</div>
        <div>Receipts</div>
        <div>ARR · Renewal</div>
        <div className="text-right">Open</div>
      </div>
      {accounts.map((a) => (
        <Row key={a.id} account={a} onOpen={() => onOpen(a.id)} />
      ))}
      {accounts.length === 0 && (
        <div className="p-12 text-center text-sm text-muted-foreground">No accounts match this filter.</div>
      )}
    </div>
  );
}

function Row({ account, onOpen }: { account: Account; onOpen: () => void }) {
  const gap = account.vendorScore.value - account.receiptsScore.value;
  const direction = gap >= 20 ? "down" : gap <= -20 ? "up" : "flat";
  const renewalColor =
    account.renewalDays <= 14 ? "text-danger" : account.renewalDays <= 45 ? "text-warning" : "text-muted-foreground";
  return (
    <button
      onClick={onOpen}
      className="w-full text-left grid grid-cols-[1.6fr_0.8fr_0.8fr_0.7fr_0.6fr] gap-4 px-6 py-5 border-b border-border last:border-b-0 hover:bg-accent/40 transition-colors group"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-semibold text-base">{account.name}</span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{account.segment}</span>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2 max-w-xl">{account.headline}</div>
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
  return (
    <div className="flex items-end gap-0.5 mt-2 h-3">
      {receipts.map((r) => {
        const color = r.weight < 0 ? "bg-danger" : r.weight > 0 ? "bg-success" : "bg-muted-foreground/30";
        const h = Math.min(12, 4 + Math.abs(r.weight) * 3);
        return (
          <span key={r.id} className={`w-1 rounded-sm ${color}`} style={{ height: `${h}px` }} title={r.source} />
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
  const color = label === "Green" ? "bg-success" : label === "Yellow" ? "bg-warning" : "bg-danger";
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`size-2 rounded-full ${color} ${muted ? "opacity-60" : ""}`} />
        <span className={`font-mono text-sm tabular-nums ${muted ? "text-muted-foreground" : "text-foreground font-semibold"}`}>
          {value}
        </span>
        {delta && deltaMagnitude !== undefined && (
          <span className={`inline-flex items-center text-[10px] font-mono ${delta === "down" ? "text-danger" : "text-success"}`}>
            {delta === "down" ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
            {deltaMagnitude}
          </span>
        )}
      </div>
      <div className="h-1 w-20 bg-foreground/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} ${muted ? "opacity-60" : ""}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ───────────────────────── DRAWER ─────────────────────────

function AccountDrawer({ account, onClose }: { account: Account; onClose: () => void }) {
  const gap = account.vendorScore.value - account.receiptsScore.value;
  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex justify-end" onClick={onClose}>
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
          <button onClick={onClose} className="size-8 rounded-full hover:bg-accent flex items-center justify-center" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <ScoreCard kind="vendor" value={account.vendorScore.value} label={account.vendorScore.label} basis={account.vendorScore.basis} />
            <ScoreCard
              kind="receipts"
              value={account.receiptsScore.value}
              label={account.receiptsScore.label}
              basis={`${gap >= 0 ? gap : -gap} pt ${gap >= 0 ? "below" : "above"} CRM · ${account.receipts.length} receipts`}
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
              <span className="text-[10px] font-mono text-muted-foreground">{account.receipts.length} signals</span>
            </div>
            <div className="space-y-2">
              {account.receipts.slice().sort((a, b) => a.weight - b.weight).map((r) => (
                <ReceiptCard key={r.id} receipt={r} />
              ))}
            </div>
          </section>

          <section className="text-xs text-muted-foreground border-t border-border pt-4">
            Every score is computed from these receipts and nothing else. No black box — click a signal, see the source, override if you disagree. Receipts learns from your overrides; it doesn't override you.
          </section>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ kind, value, label, basis }: { kind: "vendor" | "receipts"; value: number; label: "Green" | "Yellow" | "Red"; basis: string }) {
  const color = label === "Green" ? "text-success" : label === "Yellow" ? "text-warning" : "text-danger";
  return (
    <div className="border border-border rounded-xl p-4 bg-surface">
      <div className="eyebrow mb-3">{kind === "vendor" ? "Your CRM score" : "Receipts score"}</div>
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
            negative ? "bg-danger/10 text-danger" : positive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          }`}
        >
          {signalLabel[receipt.signal]} {receipt.weight > 0 ? "+" : ""}
          {receipt.weight}
        </span>
      </div>
      <blockquote className="text-sm leading-relaxed text-foreground">"{receipt.quote}"</blockquote>
    </div>
  );
}

// ───────────────────────── AUTOPILOT TICKER ─────────────────────────

function AutopilotTicker() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % OVERNIGHT_FEED.length), 3200);
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
          Night-shift desk · live
        </span>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:inline">{e.at}</span>
        <span className="text-[10px] font-mono text-foreground shrink-0">{agent.name}</span>
        <span className="text-muted-foreground/40 shrink-0">·</span>
        <p key={e.id} className="text-xs truncate animate-reveal" title={e.detail}>
          <span className={`font-medium ${weightStyle[e.weight]}`}>{e.verb}</span>
          {e.account && <span className="text-muted-foreground"> on </span>}
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

function AgentRoster({ persona }: { persona: PersonaId }) {
  const statusDot: Record<Agent["status"], string> = {
    working: "bg-success",
    standby: "bg-warning",
    queued: "bg-muted-foreground",
  };
  const order = PERSONAS[persona].priorityAgents;
  const ordered = order.map((id) => AGENTS.find((a) => a.id === id)!).filter(Boolean);
  const personaCharter: Record<PersonaId, string> = {
    csm: "Reports to you. You sign every play before it ships. Override anything — the agent learns.",
    manager: "Reports the team-wide gap pattern. Highlights where coaching has the highest payoff this week.",
    leader: "Rebuilds the renewal forecast from raw conversation. Every score traces to source moments.",
  };
  return (
    <section id="agents" className="mt-16 scroll-mt-20">
      <SectionHead
        eyebrow={`The bench · 4 agents · ${PERSONAS[persona].label.toLowerCase()} view`}
        title="Specialist agents that augment you — not replace you."
        sub={personaCharter[persona]}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {ordered.map((a) => (
          <div key={a.id} className="border border-border rounded-2xl p-5 bg-surface flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2">
                <div className="size-7 rounded-md bg-foreground/5 border border-border flex items-center justify-center">
                  <Bot className="size-3.5 text-foreground" />
                </div>
                <span className="font-display font-semibold text-sm tracking-tight">{a.name}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span className={`size-1.5 rounded-full ${statusDot[a.status]} ${a.status === "working" ? "animate-pulse" : ""}`} />
                {a.status}
              </span>
            </div>
            <div className="eyebrow mb-2">{a.role}</div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{a.charter}</p>
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
  const events = filter === "all" ? OVERNIGHT_FEED : OVERNIGHT_FEED.filter((e) => e.agent === filter);
  const weightStyle: Record<FeedEvent["weight"], string> = {
    info: "border-l-muted text-muted-foreground",
    warn: "border-l-warning text-warning",
    danger: "border-l-danger text-danger",
    win: "border-l-success text-success",
  };
  return (
    <section id="overnight" className="mt-16 scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div className="max-w-xl">
          <span className="eyebrow block mb-2">
            Overnight · {AGENT_OUTCOMES.hoursOfWork}h of work · {AGENT_OUTCOMES.conversationsRead} conversations · {AGENT_OUTCOMES.signalsProcessed.toLocaleString()} signals
          </span>
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight leading-tight">
            What the desk did between 6:14p and 7:42a.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {([["all", "All"], ...AGENTS.map((a) => [a.id, a.name] as const)] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k as typeof filter)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                filter === k ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="border border-border rounded-2xl overflow-hidden bg-surface divide-y divide-border">
        {events.map((e) => {
          const agent = AGENTS.find((a) => a.id === e.agent)!;
          const [borderCls, textCls] = weightStyle[e.weight].split(" ");
          return (
            <div key={e.id} className={`grid grid-cols-[64px_140px_1fr_auto] gap-4 px-5 py-3.5 border-l-2 ${borderCls} items-start`}>
              <span className="font-mono text-[11px] text-muted-foreground pt-0.5">{e.at}</span>
              <span className="text-xs font-medium pt-0.5">{agent.name}</span>
              <div className="min-w-0">
                <p className="text-sm leading-relaxed">
                  <span className={`font-medium ${textCls}`}>{e.verb}</span>
                  {e.account && <span className="text-muted-foreground"> on </span>}
                  {e.account && <span className="text-foreground font-medium">{e.account}</span>}
                  <span className="text-muted-foreground"> — {e.detail}</span>
                </p>
                {e.citation && (
                  <p className="text-[11px] text-muted-foreground font-mono mt-1">cite · {e.citation}</p>
                )}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground pt-1 whitespace-nowrap">awaiting human</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border mt-20 pt-8 pb-12 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="font-mono">Receipts · v0.4 · 4 agents · 3 personas · 47-account backtest</div>
      <div>Augments humans. Cites every claim.</div>
    </footer>
  );
}
