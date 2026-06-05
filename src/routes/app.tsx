import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Bot,
  Users,
  LayoutGrid,
  TrendingUp,
  Sparkles,
  Activity,
  Plug,
  ListChecks,
  Send,
  CornerDownLeft,
  Check,
} from "lucide-react";
import {
  ACCOUNTS,
  formatARR,
  type Account,
  type Channel,
  type Receipt,
} from "@/lib/loop/portfolio";
import { TODAYS_BRIEF, briefAccount, type BriefItem } from "@/lib/loop/brief";
import {
  AGENTS,
  AGENT_OUTCOMES,
  OVERNIGHT_FEED,
  type Agent,
  type FeedEvent,
} from "@/lib/loop/agents";
import { PERSONAS, PERSONA_ORDER, type PersonaId } from "@/lib/loop/personas";
import { Logo } from "@/components/brand/Logo";
import { IntegrationsGrid } from "@/components/integrations/IntegrationsGrid";

type AppSearch = { role: PersonaId };

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>): AppSearch => {
    const r = search.role;
    const role: PersonaId =
      r === "manager" || r === "leader" || r === "csm" ? r : "csm";
    return { role };
  },
  head: () => ({
    meta: [{ title: "Receipts — night-shift desk" }],
  }),
  component: WorkspaceApp,
});

// What the right pane is currently showing.
type RightPane =
  | { kind: "play"; accountId: string } // a specific account expanded
  | { kind: "portfolio" } // full book
  | { kind: "feed" } // overnight activity
  | { kind: "agents" } // the four agents
  | { kind: "integrations" }; // connector grid

function WorkspaceApp() {
  const { role } = useSearch({ from: "/app" });
  const navigate = useNavigate({ from: "/app" });

  // Default = the #1 play of the day, expanded. The thing users came to
  // see is on screen at load — no scroll, no overview, no marketing.
  const [pane, setPane] = useState<RightPane>(() => ({
    kind: "play",
    accountId: TODAYS_BRIEF[0]?.accountId ?? ACCOUNTS[0].id,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DeskTopBar
        persona={role}
        onPersona={(p) => navigate({ search: { role: p } })}
      />

      <div className="flex-1 grid grid-cols-[260px_1fr] min-h-0">
        <LeftRail persona={role} pane={pane} setPane={setPane} />
        <main className="overflow-y-auto bg-background">
          <RightPane pane={pane} persona={role} setPane={setPane} />
        </main>
      </div>
    </div>
  );
}

// ───────────────────────── TOP BAR ─────────────────────────

function DeskTopBar({
  persona,
  onPersona,
}: {
  persona: PersonaId;
  onPersona: (p: PersonaId) => void;
}) {
  return (
    <header className="border-b border-border h-12 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={18} />
          <span className="font-display font-semibold tracking-tight text-sm">Receipts</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-success">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Night-shift · live
        </span>
        <span className="hidden md:inline text-[10px] font-mono text-muted-foreground">
          Tue Nov 11 · 7:42a · {AGENT_OUTCOMES.conversationsRead} conversations read overnight
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5 p-0.5 bg-surface border border-border rounded-full">
          {PERSONA_ORDER.map((p) => {
            const active = p === persona;
            const Icon = p === "csm" ? Users : p === "manager" ? LayoutGrid : TrendingUp;
            return (
              <button
                key={p}
                onClick={() => onPersona(p)}
                className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full transition-colors ${
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
        <div className="size-7 rounded-full bg-foreground/5 border border-border text-[10px] font-mono font-semibold flex items-center justify-center">
          KR
        </div>
      </div>
    </header>
  );
}

// ───────────────────────── LEFT RAIL ─────────────────────────

function LeftRail({
  persona,
  pane,
  setPane,
}: {
  persona: PersonaId;
  pane: RightPane;
  setPane: (p: RightPane) => void;
}) {
  const briefCount = TODAYS_BRIEF.length;
  const watchCount = ACCOUNTS.length;
  const feedCount = OVERNIGHT_FEED.length;
  const agentCount = AGENTS.length;

  const activePlayId = pane.kind === "play" ? pane.accountId : null;

  return (
    <aside className="border-r border-border bg-surface/40 overflow-y-auto">
      <div className="p-4 space-y-6">
        <Section title="Today's brief" count={briefCount}>
          {TODAYS_BRIEF.map((b) => {
            const acc = briefAccount(b.accountId);
            if (!acc) return null;
            const active = activePlayId === b.accountId;
            const urgencyDot =
              b.urgency === "now"
                ? "bg-danger"
                : b.urgency === "today"
                ? "bg-warning"
                : "bg-muted-foreground/40";
            return (
              <button
                key={b.accountId}
                onClick={() => setPane({ kind: "play", accountId: b.accountId })}
                className={`relative w-full text-left rounded-md px-2.5 py-2 transition-colors ${
                  active
                    ? "bg-primary/5 text-foreground"
                    : "hover:bg-foreground/[0.04]"
                }`}
              >
                {active && (
                  <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                )}
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${urgencyDot}`} />
                  <span className="font-mono text-[10px] text-muted-foreground">#{b.rank}</span>
                  <span className="text-sm font-medium truncate">{acc.name}</span>
                </div>
                <div className="text-[11px] mt-0.5 text-muted-foreground font-mono">
                  {formatARR(b.arrAtStake)} · {acc.renewalDays}d
                </div>
              </button>
            );
          })}
        </Section>

        <NavGroup
          items={[
            {
              key: "portfolio",
              label: "Watchlist",
              count: watchCount,
              icon: ListChecks,
              active: pane.kind === "portfolio",
              onClick: () => setPane({ kind: "portfolio" }),
            },
            {
              key: "feed",
              label: "Overnight feed",
              count: feedCount,
              icon: Activity,
              active: pane.kind === "feed",
              onClick: () => setPane({ kind: "feed" }),
            },
            {
              key: "agents",
              label: "Agents",
              count: agentCount,
              icon: Bot,
              active: pane.kind === "agents",
              onClick: () => setPane({ kind: "agents" }),
            },
            {
              key: "integrations",
              label: "Integrations",
              icon: Plug,
              active: pane.kind === "integrations",
              onClick: () => setPane({ kind: "integrations" }),
            },
          ]}
        />

        <div className="border-t border-border pt-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">
            {PERSONAS[persona].label} view
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {PERSONAS[persona].promise}
          </p>
        </div>
      </div>
    </aside>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between px-2 mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[10px] font-mono text-muted-foreground">{count}</span>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavGroup({
  items,
}: {
  items: Array<{
    key: string;
    label: string;
    count?: number;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    onClick: () => void;
  }>;
}) {
  return (
    <div className="space-y-0.5">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={it.onClick}
          className={`w-full text-left rounded-md px-2.5 py-1.5 flex items-center gap-2.5 transition-colors ${
            it.active ? "bg-foreground text-background" : "hover:bg-foreground/5"
          }`}
        >
          <it.icon className="size-3.5" />
          <span className="text-sm flex-1">{it.label}</span>
          {it.count !== undefined && (
            <span
              className={`text-[10px] font-mono ${
                it.active ? "text-background/70" : "text-muted-foreground"
              }`}
            >
              {it.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ───────────────────────── RIGHT PANE ─────────────────────────

function RightPane({
  pane,
  persona,
  setPane,
}: {
  pane: RightPane;
  persona: PersonaId;
  setPane: (p: RightPane) => void;
}) {
  if (pane.kind === "play") {
    const account = ACCOUNTS.find((a) => a.id === pane.accountId);
    const brief = TODAYS_BRIEF.find((b) => b.accountId === pane.accountId);
    if (!account) return null;
    return <PlayDetail account={account} brief={brief} setPane={setPane} />;
  }
  if (pane.kind === "portfolio") return <WatchlistView setPane={setPane} />;
  if (pane.kind === "feed") return <FeedView />;
  if (pane.kind === "agents") return <AgentsView persona={persona} />;
  if (pane.kind === "integrations")
    return (
      <div className="max-w-4xl px-8 py-10">
        <IntegrationsGrid />
      </div>
    );
  return null;
}

// ───────────────────────── PLAY DETAIL (hero view) ─────────────────────────

function PlayDetail({
  account,
  brief,
  setPane,
}: {
  account: Account;
  brief?: BriefItem;
  setPane: (p: RightPane) => void;
}) {
  const gap = account.vendorScore.value - account.receiptsScore.value;
  const urgencyChip =
    brief?.urgency === "now"
      ? { text: "DO NOW", cls: "bg-danger/10 text-danger" }
      : brief?.urgency === "today"
      ? { text: "TODAY", cls: "bg-warning/15 text-warning" }
      : brief?.urgency === "this-week"
      ? { text: "THIS WEEK", cls: "bg-muted text-muted-foreground" }
      : { text: "WATCH", cls: "bg-muted text-muted-foreground" };

  return (
    <div className="max-w-5xl px-8 py-8">
      {/* Header: account identity + urgency */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${urgencyChip.cls}`}
            >
              {urgencyChip.text}
            </span>
            <span className="eyebrow">
              {account.segment} · {formatARR(account.arr)} ARR · {account.renewalDays}d to renewal
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            {account.name}
          </h1>
        </div>
        <button
          onClick={() => setPane({ kind: "portfolio" })}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
        >
          <ArrowLeft className="size-3" /> Watchlist
        </button>
      </div>

      {/* The play — editorial card, not a black slab */}
      {brief && (
        <div className="relative rounded-2xl p-6 mb-8 bg-surface border border-border shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_48px_-32px_rgba(0,0,0,0.12)] overflow-hidden">
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
          />
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              Today's play · before lunch
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              drafted 7:42a
            </span>
          </div>
          <p className="text-xl md:text-2xl font-display font-semibold leading-snug tracking-tight text-foreground">
            {brief.action}
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            <span className="font-medium text-foreground">Because: </span>
            {brief.because}
          </p>

          {/* Draft action surface — honest "draft only" affordance */}
          <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">
              <Send className="size-3" /> Open drafted email
            </button>
            <button className="inline-flex items-center gap-1.5 text-xs text-foreground hover:bg-foreground/5 border border-border px-3 py-1.5 rounded-full transition-colors">
              <CornerDownLeft className="size-3" /> Log to Salesforce
            </button>
            <span className="text-[10px] font-mono text-muted-foreground ml-auto">
              awaiting your signoff
            </span>
          </div>
        </div>
      )}

      {/* Two scores side by side */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
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
          basis={`${Math.abs(gap)} pt ${gap >= 0 ? "below" : "above"} CRM · ${account.receipts.length} receipts`}
          gap={gap}
        />
      </div>

      {/* Headline narrative */}
      <div className="mb-8">
        <div className="eyebrow mb-2">What's actually going on</div>
        <p className="text-base leading-relaxed max-w-3xl">{account.headline}</p>
      </div>

      {/* Receipts */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div className="eyebrow">Receipts · raw evidence</div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {account.receipts.length} signals · sorted by impact
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
        <p className="mt-5 text-[11px] text-muted-foreground leading-relaxed max-w-2xl">
          Every score is computed from these receipts and nothing else. Click any
          signal to see the source. Override if you disagree — Receipts learns from
          your overrides, it doesn't override you.
        </p>
      </div>
    </div>
  );
}

function ScoreCard({
  kind,
  value,
  label,
  basis,
  gap,
}: {
  kind: "vendor" | "receipts";
  value: number;
  label: "Green" | "Yellow" | "Red";
  basis: string;
  gap?: number;
}) {
  const color =
    label === "Green" ? "text-success" : label === "Yellow" ? "text-warning" : "text-danger";
  return (
    <div className="border border-border rounded-xl p-5 bg-surface">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">{kind === "vendor" ? "Your CRM score" : "Receipts score"}</span>
        {kind === "receipts" && gap !== undefined && Math.abs(gap) >= 20 && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-mono ${
              gap > 0 ? "text-danger" : "text-success"
            }`}
          >
            {gap > 0 ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
            {Math.abs(gap)} pt vs CRM
          </span>
        )}
      </div>
      <div className={`font-display text-4xl font-semibold mb-1 tabular-nums ${color}`}>
        {value}
        <span className="text-sm text-muted-foreground font-sans font-normal ml-2">{label}</span>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed mt-2">{basis}</div>
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
    <div className={`border border-border border-l-4 ${accent} rounded-md p-4 bg-surface`}>
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
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

// ───────────────────────── WATCHLIST ─────────────────────────

type SortKey = "gap" | "renewal" | "arr";

function WatchlistView({ setPane }: { setPane: (p: RightPane) => void }) {
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
        return (
          b.vendorScore.value -
          b.receiptsScore.value -
          (a.vendorScore.value - a.receiptsScore.value)
        );
      }
      if (sort === "renewal") return a.renewalDays - b.renewalDays;
      return b.arr - a.arr;
    });
    return list;
  }, [filter, sort]);

  return (
    <div className="max-w-5xl px-8 py-8">
      <div className="mb-6">
        <span className="eyebrow block mb-2">Watchlist</span>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Every account on your book — scored on what the customer actually said.
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          {([
            ["surprises", "Surprises"],
            ["red", "At risk"],
            ["all", "All"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                filter === k
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="text-[10px] font-mono text-muted-foreground ml-2">
            {accounts.length} shown
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-muted-foreground mr-1">Sort</span>
          {([
            ["gap", "Largest gap"],
            ["renewal", "Soonest renewal"],
            ["arr", "ARR"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                sort === k ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-surface">
        {accounts.map((a) => {
          const gap = a.vendorScore.value - a.receiptsScore.value;
          return (
            <button
              key={a.id}
              onClick={() => setPane({ kind: "play", accountId: a.id })}
              className="w-full text-left grid grid-cols-[1.6fr_0.7fr_0.7fr_0.6fr_auto] gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-accent/40 transition-colors items-center"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-sm">{a.name}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {a.segment}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.headline}</div>
              </div>
              <MiniScore value={a.vendorScore.value} label={a.vendorScore.label} muted />
              <MiniScore
                value={a.receiptsScore.value}
                label={a.receiptsScore.label}
                deltaPt={gap >= 20 ? gap : gap <= -20 ? gap : undefined}
              />
              <div className="text-xs">
                <div className="font-mono">{formatARR(a.arr)}</div>
                <div
                  className={`text-[11px] ${
                    a.renewalDays <= 14
                      ? "text-danger"
                      : a.renewalDays <= 45
                      ? "text-warning"
                      : "text-muted-foreground"
                  }`}
                >
                  {a.renewalDays}d
                </div>
              </div>
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniScore({
  value,
  label,
  muted,
  deltaPt,
}: {
  value: number;
  label: "Green" | "Yellow" | "Red";
  muted?: boolean;
  deltaPt?: number;
}) {
  const color =
    label === "Green" ? "bg-success" : label === "Yellow" ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${color} ${muted ? "opacity-60" : ""}`} />
      <span
        className={`font-mono text-sm tabular-nums ${
          muted ? "text-muted-foreground" : "text-foreground font-semibold"
        }`}
      >
        {value}
      </span>
      {deltaPt !== undefined && (
        <span
          className={`inline-flex items-center text-[10px] font-mono ${
            deltaPt > 0 ? "text-danger" : "text-success"
          }`}
        >
          {deltaPt > 0 ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
          {Math.abs(deltaPt)}
        </span>
      )}
    </div>
  );
}

// ───────────────────────── OVERNIGHT FEED ─────────────────────────

function FeedView() {
  const [filter, setFilter] = useState<"all" | Agent["id"]>("all");
  const events =
    filter === "all" ? OVERNIGHT_FEED : OVERNIGHT_FEED.filter((e) => e.agent === filter);
  const weightStyle: Record<FeedEvent["weight"], string> = {
    info: "border-l-muted text-muted-foreground",
    warn: "border-l-warning text-warning",
    danger: "border-l-danger text-danger",
    win: "border-l-success text-success",
  };

  return (
    <div className="max-w-4xl px-8 py-8">
      <div className="mb-6">
        <span className="eyebrow block mb-2">
          Overnight · {AGENT_OUTCOMES.hoursOfWork}h · {AGENT_OUTCOMES.signalsProcessed.toLocaleString()} signals
        </span>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          What the desk did between 6:14p and 7:42a.
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
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

      <div className="border border-border rounded-xl overflow-hidden bg-surface divide-y divide-border">
        {events.map((e) => {
          const agent = AGENTS.find((a) => a.id === e.agent)!;
          const [borderCls, textCls] = weightStyle[e.weight].split(" ");
          return (
            <div
              key={e.id}
              className={`grid grid-cols-[56px_120px_1fr_auto] gap-3 px-4 py-3 border-l-2 ${borderCls} items-start`}
            >
              <span className="font-mono text-[11px] text-muted-foreground pt-0.5">{e.at}</span>
              <span className="text-xs font-medium pt-0.5 truncate">{agent.name}</span>
              <div className="min-w-0">
                <p className="text-sm leading-snug">
                  <span className={`font-medium ${textCls}`}>{e.verb}</span>
                  {e.account && <span className="text-muted-foreground"> on </span>}
                  {e.account && <span className="text-foreground font-medium">{e.account}</span>}
                  <span className="text-muted-foreground"> — {e.detail}</span>
                </p>
                {e.citation && (
                  <p className="text-[11px] text-muted-foreground font-mono mt-1">
                    cite · {e.citation}
                  </p>
                )}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground pt-1 whitespace-nowrap">
                awaiting human
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── AGENTS ─────────────────────────

function AgentsView({ persona }: { persona: PersonaId }) {
  const statusDot: Record<Agent["status"], string> = {
    working: "bg-success",
    standby: "bg-warning",
    queued: "bg-muted-foreground",
  };
  const order = PERSONAS[persona].priorityAgents;
  const ordered = order.map((id) => AGENTS.find((a) => a.id === id)!).filter(Boolean);

  return (
    <div className="max-w-4xl px-8 py-8">
      <div className="mb-6">
        <span className="eyebrow block mb-2">The bench · 4 agents</span>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Specialist agents that augment you — not replace you.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
          Every play awaits your signoff. Override anything — the agent learns
          from your overrides. It does not override you.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {ordered.map((a) => (
          <div key={a.id} className="border border-border rounded-xl p-5 bg-surface flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2">
                <div className="size-7 rounded-md bg-foreground/5 border border-border flex items-center justify-center">
                  <Sparkles className="size-3.5 text-foreground" />
                </div>
                <span className="font-display font-semibold text-sm tracking-tight">{a.name}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span
                  className={`size-1.5 rounded-full ${statusDot[a.status]} ${
                    a.status === "working" ? "animate-pulse" : ""
                  }`}
                />
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
              <Stat label="watching" value={a.watching} />
              <Stat label="done today" value={a.completedToday} />
              <Stat label="flagged" value={a.flagged} danger />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div>
      <div className={`font-mono text-sm tabular-nums ${danger ? "text-danger" : ""}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

// Compile-safe (unused-import suppressors get noisy otherwise)
void Check;
