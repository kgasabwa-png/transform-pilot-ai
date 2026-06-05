import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bot,
  CalendarClock,
  Check,
  ChevronRight,
  FileText,
  Mail,
  MessageSquare,
  PencilLine,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BACKTEST, BACKTEST_STATS } from "@/lib/loop/backtest";
import { ACCOUNTS, formatARR, type Account, type Receipt } from "@/lib/loop/portfolio";
import { AGENTS, AGENT_OUTCOMES, type AgentId } from "@/lib/loop/agents";
import { PERSONA_ORDER, type PersonaId } from "@/lib/loop/personas";
import { ReceiptModal } from "@/components/loop/ReceiptModal";

type DraftActionKind = "email" | "crm" | "meeting" | "proposal";
type ActionStatus = "pending" | "approved" | "skipped" | "rejected";

type DraftAction = {
  id: string;
  kind: DraftActionKind;
  accountId: string;
  agent: AgentId;
  title: string;
  why: string;
  body: string;
  arrImpact: number;
  primaryCta: string;
  createdAt: string;
  evidenceIds: string[];
  diff?: { from: string; to: string; field: string };
};

type CoachingMoment = {
  id: string;
  csm: string;
  accountId: string;
  title: string;
  impact: number;
  clipAt: string;
  clip: string;
  suggestion: string;
  receiptId: string;
};

type ForecastDelta = {
  id: string;
  accountId: string;
  agent: AgentId;
  amount: number;
  title: string;
  reason: string;
  receiptId: string;
  csmVisible: boolean;
};

const DRAFT_ACTIONS: DraftAction[] = [
  {
    id: "act-quill-rfp",
    kind: "email",
    accountId: "quill",
    agent: "renewal-risk",
    title: "Send this RFP recovery note to Quill's champion",
    why: "Procurement BCC'd us on the competitor rubric and the champion has delayed the QBR twice.",
    body: "Subject: Quick alignment before procurement closes the RFP\n\nHi Morgan,\n\nI saw procurement's publishing-ops RFP is already moving. Rather than guess from the outside, can we do 15 minutes today to decide whether we should submit, partner with you on the rubric, or document why we're not a fit?\n\nIf there is a blocker, I would rather get it in writing today than let your team spend cycles on a silent mismatch.\n\n- Sam",
    arrImpact: 96000,
    primaryCta: "Approve & send",
    createdAt: "this morning at 7:41a",
    evidenceIds: ["ql-1", "ql-2"],
  },
  {
    id: "act-halcyon-stage",
    kind: "crm",
    accountId: "halcyon",
    agent: "exec-silence",
    title: "Update Halcyon renewal stage before forecast review",
    why: "Champion left, replacement was the original skeptic, and three exec-reset follow-ups have no reply.",
    body: "Move renewal stage to Risk, add Devin as economic buyer, and attach the four cited signals to the account note.",
    arrImpact: 312000,
    primaryCta: "Approve CRM diff",
    createdAt: "this morning at 7:33a",
    evidenceIds: ["hc-1", "hc-2", "hc-3"],
    diff: { field: "Renewal stage", from: "Commit", to: "Risk" },
  },
  {
    id: "act-northwind-brief",
    kind: "proposal",
    accountId: "northwind",
    agent: "champion-watch",
    title: "Ship a CFO-framed value brief to Priya",
    why: "Renee is reviewing every $100k+ vendor line and a competitor look-alike is already in the budget exercise.",
    body: "Draft value brief: cost per delivered mile, long-haul override reduction, and Optoro integration timeline. Send to Priya with a request to forward before Renee's budget meeting.",
    arrImpact: 184000,
    primaryCta: "Approve brief",
    createdAt: "overnight",
    evidenceIds: ["nw-1", "nw-2", "nw-3"],
  },
  {
    id: "act-blueprint-expand",
    kind: "proposal",
    accountId: "blueprint",
    agent: "expansion-scout",
    title: "Draft a two-BU expansion proposal for Blueprint",
    why: "The customer is standardizing on the product while the CRM still reads flat usage as renewal risk.",
    body: "Create a combined renewal + expansion proposal for Phoenix and Austin, with procurement copied before the renewal call.",
    arrImpact: 64000,
    primaryCta: "Draft proposal",
    createdAt: "2h ago",
    evidenceIds: ["bp-1", "bp-2", "bp-3"],
  },
];

const COACHING_MOMENTS: CoachingMoment[] = [
  {
    id: "coach-tessera-signal",
    csm: "Sam Okafor",
    accountId: "tessera",
    title: "Sam missed an expansion buying signal on Tessera",
    impact: 84000,
    clipAt: "00:14:22",
    clip: "Tessera CIO: \"You're table stakes for us now. I'd like to talk multi-year with an expanded footprint at the next review.\"",
    suggestion:
      "Coach Sam to anchor on the CIO's expansion language first, then isolate the weak BU as enablement instead of delaying the proposal.",
    receiptId: "ts-1",
  },
  {
    id: "coach-halcyon-escalation",
    csm: "Jordan Pace",
    accountId: "halcyon",
    title: "Jordan waited too long to escalate sponsor silence",
    impact: 312000,
    clipAt: "email thread",
    clip: "Three follow-ups to Devin after Marie's departure received no reply. The account stayed Commit in CRM.",
    suggestion:
      "Send Jordan a 1:1 note: after two silent exec follow-ups, move to Risk and ask for exec-to-exec support the same week.",
    receiptId: "hc-2",
  },
  {
    id: "coach-blueprint-save-motion",
    csm: "Keila Ramos",
    accountId: "blueprint",
    title: "Keila nearly ran a save play on an expansion account",
    impact: 64000,
    clipAt: "Slack Connect",
    clip: 'Blueprint: "Decision: we standardize on this for the Phoenix and Austin sites starting Q1."',
    suggestion:
      "Use this in team standup: flat usage can mean automation is working. Ask for standardization language before triggering save motions.",
    receiptId: "bp-1",
  },
];

const FORECAST_DELTAS: ForecastDelta[] = [
  {
    id: "delta-quill",
    accountId: "quill",
    agent: "renewal-risk",
    amount: -96000,
    title: "Quill Media downgraded after hidden RFP surfaced",
    reason: "Procurement BCC'd a competitor rubric; responses due before renewal.",
    receiptId: "ql-1",
    csmVisible: false,
  },
  {
    id: "delta-blueprint",
    accountId: "blueprint",
    agent: "expansion-scout",
    amount: 154000,
    title: "Blueprint promoted from save motion to expansion",
    reason: "Procurement is combining renewal with two new business units.",
    receiptId: "bp-2",
    csmVisible: true,
  },
  {
    id: "delta-halcyon",
    accountId: "halcyon",
    agent: "exec-silence",
    amount: -180000,
    title: "Halcyon confidence range widened",
    reason: "Economic buyer changed and the new owner has gone silent.",
    receiptId: "hc-1",
    csmVisible: true,
  },
  {
    id: "delta-tessera",
    accountId: "tessera",
    agent: "expansion-scout",
    amount: 240000,
    title: "Tessera expansion moved into Q3 upside",
    reason: "CIO asked to discuss multi-year with expanded footprint.",
    receiptId: "ts-1",
    csmVisible: false,
  },
];

const screenMeta: Record<
  PersonaId,
  { title: string; eyebrow: string; icon: ComponentType<{ className?: string }> }
> = {
  csm: { title: "The Approval Queue", eyebrow: "CSM workspace", icon: Users },
  manager: { title: "The Coaching Room", eyebrow: "Manager workspace", icon: MessageSquare },
  leader: { title: "The Forecast Floor", eyebrow: "VP workspace", icon: TrendingUp },
};

export function ApprovalWorkspace({
  role,
  demo,
  onRoleChange,
}: {
  role: PersonaId;
  demo?: boolean;
  onRoleChange: (role: PersonaId) => void;
}) {
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>({});
  const [shipped, setShipped] = useState<Array<{ action: DraftAction; at: string }>>([]);
  const [activeAction, setActiveAction] = useState<DraftAction | null>(null);
  const [openReceipt, setOpenReceipt] = useState<Receipt | null>(null);
  const [openAccount, setOpenAccount] = useState<Account | null>(null);

  const pendingActions = DRAFT_ACTIONS.filter(
    (action) => (statuses[action.id] ?? "pending") === "pending",
  );
  const approvedArr = shipped.reduce((sum, item) => sum + item.action.arrImpact, 0);

  function markAction(action: DraftAction, status: ActionStatus) {
    setStatuses((prev) => ({ ...prev, [action.id]: status }));
    if (status === "approved") {
      setShipped((prev) => [{ action, at: "just now" }, ...prev]);
      toast.success(`${accountName(action.accountId)} action shipped`, {
        description: "The sample book updated and the action moved to Shipped today.",
      });
    } else if (status === "skipped") {
      toast("Action skipped", {
        description: "Receipts will use the skip as feedback for this account.",
      });
    } else if (status === "rejected") {
      toast("Signal rejected", {
        description: "Override captured. The agent is learning your bar.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {demo && <SampleBanner />}
      <WorkspaceTopBar role={role} onRoleChange={onRoleChange} />

      <main className="flex-1 overflow-y-auto">
        {role === "csm" && (
          <ApprovalQueue
            actions={pendingActions}
            shipped={shipped}
            approvedArr={approvedArr}
            statuses={statuses}
            onOpenAction={setActiveAction}
            onMark={markAction}
            onReceipt={setOpenReceipt}
            onAccount={setOpenAccount}
          />
        )}
        {role === "manager" && (
          <CoachingRoom onReceipt={setOpenReceipt} onAccount={setOpenAccount} />
        )}
        {role === "leader" && (
          <ForecastFloor onReceipt={setOpenReceipt} onAccount={setOpenAccount} />
        )}
      </main>

      <ActionConfirmModal
        action={activeAction}
        open={activeAction !== null}
        onClose={() => setActiveAction(null)}
        onShip={(action) => {
          markAction(action, "approved");
          setActiveAction(null);
        }}
      />
      <AccountDrawer
        account={openAccount}
        open={openAccount !== null}
        onClose={() => setOpenAccount(null)}
        onReceipt={setOpenReceipt}
      />
      <ReceiptModal
        receipt={openReceipt}
        open={openReceipt !== null}
        onClose={() => setOpenReceipt(null)}
      />
    </div>
  );
}

function WorkspaceTopBar({
  role,
  onRoleChange,
}: {
  role: PersonaId;
  onRoleChange: (role: PersonaId) => void;
}) {
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur h-auto md:h-16 px-4 md:px-6 py-3 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={20} />
          <span className="font-display font-semibold tracking-tight text-base">Receipts</span>
        </Link>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          the closing crew
        </span>
        <span className="hidden lg:inline text-xs text-muted-foreground">
          {todayLabel()} · {AGENT_OUTCOMES.conversationsRead} sample conversations read
        </span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto">
        <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-full">
          {PERSONA_ORDER.map((persona) => {
            const active = persona === role;
            const meta = screenMeta[persona];
            const Icon = meta.icon;
            return (
              <button
                key={persona}
                onClick={() => onRoleChange(persona)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {meta.title}
              </button>
            );
          })}
        </div>
        <div className="size-8 rounded-full bg-foreground/5 border border-border text-[11px] font-mono font-semibold flex items-center justify-center">
          SC
        </div>
      </div>
    </header>
  );
}

function SampleBanner() {
  return (
    <div className="border-b border-border/60 bg-primary/5 px-4 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
      <SampleTag />
      <span className="text-foreground/75">
        Previewing as <span className="font-medium text-foreground">Sarah Chen</span>, renewals lead
        · {ACCOUNTS.length} synthetic accounts · approvals stay in this browser session.
      </span>
      <Link
        to="/waitlist"
        className="inline-flex items-center gap-1 text-foreground font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors"
      >
        Run a backtest on your book <ArrowUpRight className="size-3" />
      </Link>
    </div>
  );
}

function ApprovalQueue({
  actions,
  shipped,
  approvedArr,
  statuses,
  onOpenAction,
  onMark,
  onReceipt,
  onAccount,
}: {
  actions: DraftAction[];
  shipped: Array<{ action: DraftAction; at: string }>;
  approvedArr: number;
  statuses: Record<string, ActionStatus>;
  onOpenAction: (action: DraftAction) => void;
  onMark: (action: DraftAction, status: ActionStatus) => void;
  onReceipt: (receipt: Receipt) => void;
  onAccount: (account: Account) => void;
}) {
  const pendingArr = actions.reduce((sum, action) => sum + action.arrImpact, 0);

  return (
    <WorkspaceFrame
      eyebrow={screenMeta.csm.eyebrow}
      title="The Approval Queue"
      sub="Four agents closed the loop while you were away. Approve, edit, skip, or reject before anything ships in your name."
      sidebar={<ShippedToday shipped={shipped} approvedArr={approvedArr} />}
    >
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <MetricCard label="Awaiting approval" value={`${actions.length} actions`} sample />
        <MetricCard label="Renewal dollars in queue" value={formatARR(pendingArr)} sample />
        <MetricCard label="Avg approval target" value="47 sec" sample />
      </div>

      <div className="space-y-4">
        {actions.length === 0 ? (
          <EmptyState
            title="All actions shipped."
            body="The sample book is clear. Switch to the Forecast Floor to audit how these approvals moved the number."
          />
        ) : (
          actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              status={statuses[action.id] ?? "pending"}
              onOpen={() => onOpenAction(action)}
              onSkip={() => onMark(action, "skipped")}
              onReject={() => onMark(action, "rejected")}
              onReceipt={onReceipt}
              onAccount={onAccount}
            />
          ))
        )}
      </div>
    </WorkspaceFrame>
  );
}

function ActionCard({
  action,
  status,
  onOpen,
  onSkip,
  onReject,
  onReceipt,
  onAccount,
}: {
  action: DraftAction;
  status: ActionStatus;
  onOpen: () => void;
  onSkip: () => void;
  onReject: () => void;
  onReceipt: (receipt: Receipt) => void;
  onAccount: (account: Account) => void;
}) {
  const account = getAccount(action.accountId);
  const evidence = evidenceFor(action.evidenceIds);
  const agent = AGENTS.find((item) => item.id === action.agent);
  const Icon = actionIcon[action.kind];

  return (
    <article className="border border-border rounded-2xl bg-surface p-5 md:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="size-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
              <Icon className="size-4 text-primary" />
            </span>
            <button
              onClick={() => onAccount(account)}
              className="text-sm font-semibold hover:underline underline-offset-4"
            >
              {account.name}
            </button>
            <span className="text-xs text-muted-foreground">
              · {formatARR(action.arrImpact)} at stake
            </span>
            <span className="text-xs text-muted-foreground">· {action.createdAt}</span>
            <SampleTag compact />
          </div>
          <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight leading-tight">
            {action.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            <span className="font-medium text-foreground">Why: </span>
            {action.why}
          </p>
        </div>
        <div className="text-xs text-muted-foreground lg:text-right">
          <div className="font-mono uppercase tracking-[0.14em] text-[10px] mb-1">Prepared by</div>
          <div className="font-medium text-foreground">{agent?.name}</div>
        </div>
      </div>

      {action.diff && (
        <div className="mt-4 grid sm:grid-cols-[1fr_auto_1fr] gap-2 items-center rounded-xl border border-border bg-background p-3">
          <DiffBlock label={`${action.diff.field} now`} value={action.diff.from} muted />
          <ChevronRight className="hidden sm:block size-4 text-muted-foreground" />
          <DiffBlock label="Receipts recommendation" value={action.diff.to} danger />
        </div>
      )}

      <div className="mt-5 rounded-xl bg-background border border-border p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Draft work product
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-line">{action.body}</p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Receipts behind this action
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {evidence.length} cited signals
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {evidence.map((receipt) => (
            <button
              key={receipt.id}
              onClick={() => onReceipt(receipt)}
              className="text-left rounded-lg border border-border bg-background p-3 hover:bg-accent/40 transition-colors"
            >
              <div className="text-[10px] font-mono text-muted-foreground mb-1">
                {receipt.source}
              </div>
              <p className="text-xs leading-relaxed line-clamp-2">"{receipt.quote}"</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center gap-2">
        <button
          onClick={onOpen}
          disabled={status === "approved"}
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send className="size-4" />
          {action.primaryCta}
        </button>
        <button
          onClick={onSkip}
          className="inline-flex items-center gap-1.5 text-sm text-foreground hover:bg-foreground/5 border border-border px-4 py-2 rounded-full transition-colors"
        >
          Skip
        </button>
        <button
          onClick={onReject}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-full transition-colors"
        >
          Reject + teach agent
        </button>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
          {status === "pending" ? "awaiting your signoff" : status}
        </span>
      </div>
    </article>
  );
}

function ShippedToday({
  shipped,
  approvedArr,
}: {
  shipped: Array<{ action: DraftAction; at: string }>;
  approvedArr: number;
}) {
  return (
    <aside className="rounded-2xl border border-border bg-surface p-5 sticky top-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="eyebrow mb-1">Shipped today</div>
          <h3 className="font-display text-xl font-semibold tracking-tight">
            {formatARR(approvedArr)} advanced
          </h3>
        </div>
        <SampleTag compact />
      </div>
      {shipped.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Approve an action and it will move here with a receipt trail. This is the loop investors
          and users need to feel.
        </p>
      ) : (
        <div className="space-y-3">
          {shipped.map(({ action, at }) => (
            <div key={`${action.id}-${at}`} className="border-l-2 border-success pl-3">
              <div className="text-xs font-medium">{accountName(action.accountId)}</div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{action.title}</p>
              <div className="text-[10px] font-mono text-success mt-1">shipped {at}</div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function CoachingRoom({
  onReceipt,
  onAccount,
}: {
  onReceipt: (receipt: Receipt) => void;
  onAccount: (account: Account) => void;
}) {
  const [sent, setSent] = useState<Record<string, string>>({});
  const unresolved = COACHING_MOMENTS.filter((moment) => !sent[moment.id]);
  const impact = COACHING_MOMENTS.reduce((sum, moment) => sum + moment.impact, 0);

  function mark(moment: CoachingMoment, label: string) {
    setSent((prev) => ({ ...prev, [moment.id]: label }));
    toast.success(label, {
      description: `${moment.csm}'s coaching note now has the underlying receipt attached.`,
    });
  }

  return (
    <WorkspaceFrame
      eyebrow={screenMeta.manager.eyebrow}
      title="The Coaching Room"
      sub="Not another team rollup. These are moments the agents found where a CSM needs coaching before ARR moves."
      sidebar={<ManagerAside unresolved={unresolved.length} impact={impact} />}
    >
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <MetricCard label="Coachable moments" value={`${unresolved.length} open`} sample />
        <MetricCard label="Next-quarter ARR likely affected" value={formatARR(impact)} sample />
        <MetricCard label="Pattern detected" value="Procurement blind spot" sample />
      </div>

      <div className="space-y-4">
        {COACHING_MOMENTS.map((moment) => {
          const account = getAccount(moment.accountId);
          const receipt = getReceipt(moment.receiptId);
          const status = sent[moment.id];
          return (
            <article
              key={moment.id}
              className="border border-border rounded-2xl bg-surface p-5 md:p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-medium">{moment.csm}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <button
                      onClick={() => onAccount(account)}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
                    >
                      {account.name}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      · {formatARR(moment.impact)} ARR signal
                    </span>
                    <SampleTag compact />
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight leading-tight">
                    {moment.title}
                  </h2>
                </div>
                {status && (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <Check className="size-3.5" /> {status}
                  </span>
                )}
              </div>

              <div className="mt-5 rounded-xl border border-border bg-background p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Transcript clip · {moment.clipAt}
                </div>
                <blockquote className="text-sm leading-relaxed">"{moment.clip}"</blockquote>
              </div>

              <div className="mt-4 grid lg:grid-cols-[1fr_260px] gap-4">
                <div>
                  <div className="text-xs font-medium mb-1">Suggested coaching note</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {moment.suggestion}
                  </p>
                </div>
                <button
                  onClick={() => onReceipt(receipt)}
                  className="text-left rounded-xl border border-border bg-background p-3 hover:bg-accent/40 transition-colors"
                >
                  <div className="text-[10px] font-mono text-muted-foreground mb-1">
                    Attached receipt
                  </div>
                  <p className="text-xs line-clamp-3">"{receipt.quote}"</p>
                </button>
              </div>

              <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center gap-2">
                <button
                  onClick={() => mark(moment, "Sent to CSM")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                >
                  <Send className="size-4" /> Send to {moment.csm.split(" ")[0]}
                </button>
                <button
                  onClick={() => mark(moment, "Added to 1:1")}
                  className="inline-flex items-center gap-1.5 text-sm border border-border px-4 py-2 rounded-full hover:bg-foreground/5 transition-colors"
                >
                  <CalendarClock className="size-4" /> Add to 1:1
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </WorkspaceFrame>
  );
}

function ManagerAside({ unresolved, impact }: { unresolved: number; impact: number }) {
  return (
    <aside className="rounded-2xl border border-border bg-surface p-5 sticky top-6">
      <div className="eyebrow mb-2">Manager outcome</div>
      <h3 className="font-display text-xl font-semibold tracking-tight">
        {unresolved} coaching moments likely to protect {formatARR(impact)}.
      </h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        The moat is the receipt graph: every coaching note is tied to the exact call, Slack line, or
        email that created the signal.
      </p>
      <div className="mt-5 border-t border-border pt-4 space-y-3">
        {["Over-discounting", "Procurement signals", "Exec silence"].map((pattern) => (
          <div key={pattern} className="flex items-center justify-between text-sm">
            <span>{pattern}</span>
            <span className="text-xs text-muted-foreground">detected</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ForecastFloor({
  onReceipt,
  onAccount,
}: {
  onReceipt: (receipt: Receipt) => void;
  onAccount: (account: Account) => void;
}) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const forecast = 4820000;
  const range = 310000;
  const netDelta = FORECAST_DELTAS.reduce((sum, delta) => sum + delta.amount, 0);

  function override(delta: ForecastDelta) {
    setOverrides((prev) => ({ ...prev, [delta.id]: "Override captured" }));
    toast("Forecast override captured", {
      description: "Reason logged as model feedback for Renewal-Risk.",
    });
  }

  return (
    <WorkspaceFrame
      eyebrow={screenMeta.leader.eyebrow}
      title="The Forecast Floor"
      sub="A living renewal number with a changelog for every dollar the agents moved and the receipt that proves it."
      sidebar={<BacktestProof />}
    >
      <div className="rounded-3xl border border-border bg-surface p-6 md:p-8 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="eyebrow">Q3 renewal forecast</span>
              <SampleTag compact />
            </div>
            <div className="font-display text-5xl md:text-6xl font-semibold tracking-tight">
              {formatMoney(forecast)}
              <span className="text-2xl md:text-3xl text-muted-foreground ml-2">
                +/- {formatMoney(range)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <MetricCard label="Net moved this week" value={signedMoney(netDelta)} sample />
            <MetricCard label="Hidden from CSMs" value="2 deltas" sample />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {FORECAST_DELTAS.map((delta) => {
          const account = getAccount(delta.accountId);
          const receipt = getReceipt(delta.receiptId);
          const agent = AGENTS.find((item) => item.id === delta.agent);
          const positive = delta.amount > 0;
          return (
            <article key={delta.id} className="border border-border rounded-2xl bg-surface p-5">
              <div className="grid lg:grid-cols-[140px_1fr_auto] gap-4 items-start">
                <div className={positive ? "text-success" : "text-danger"}>
                  <div className="font-display text-2xl font-semibold tracking-tight">
                    {signedMoney(delta.amount)}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                    forecast move
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <button
                      onClick={() => onAccount(account)}
                      className="text-sm font-semibold hover:underline underline-offset-4"
                    >
                      {account.name}
                    </button>
                    <span className="text-xs text-muted-foreground">· {agent?.name}</span>
                    {!delta.csmVisible && (
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-warning">
                        not yet seen by CSM
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {delta.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {delta.reason}
                  </p>
                </div>
                <div className="flex lg:flex-col gap-2">
                  <button
                    onClick={() => onReceipt(receipt)}
                    className="inline-flex items-center justify-center gap-1.5 text-sm border border-border px-3 py-2 rounded-full hover:bg-foreground/5 transition-colors"
                  >
                    <ShieldCheck className="size-4" /> Audit
                  </button>
                  <button
                    onClick={() => override(delta)}
                    className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-full transition-colors"
                  >
                    <PencilLine className="size-4" /> Override
                  </button>
                </div>
              </div>
              {overrides[delta.id] && (
                <div className="mt-4 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-xs text-foreground">
                  {overrides[delta.id]} · Renewal-Risk corrected for this forecast motion.
                </div>
              )}
            </article>
          );
        })}
      </div>
    </WorkspaceFrame>
  );
}

function BacktestProof() {
  return (
    <aside className="rounded-2xl border border-border bg-surface p-5 sticky top-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="eyebrow">Concierge backtest</div>
        <SampleTag compact />
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight">
        Receipts caught {BACKTEST_STATS.caughtByReceipts}/{BACKTEST_STATS.surpriseChurns} surprise
        churns in replay.
      </h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        The wedge is proof before integration: replay closed renewals, compare against the incumbent
        snapshot, and cite the first signal.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <MiniProof label="Avg early warning" value={`${BACKTEST_STATS.avgEarlyWarningDays}d`} />
        <MiniProof label="Precision" value={`${Math.round(BACKTEST_STATS.precision * 100)}%`} />
      </div>
      <div className="mt-5 space-y-3">
        {BACKTEST.slice(0, 3).map((item) => (
          <div key={item.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{item.account.replace(" (real)", "")}</span>
              <span className="text-xs font-mono text-muted-foreground">{formatARR(item.arr)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {item.oneLine}
            </p>
          </div>
        ))}
      </div>
      <Link
        to="/waitlist"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-4"
      >
        Run this on your renewals <ArrowUpRight className="size-4" />
      </Link>
    </aside>
  );
}

function ActionConfirmModal({
  action,
  open,
  onClose,
  onShip,
}: {
  action: DraftAction | null;
  open: boolean;
  onClose: () => void;
  onShip: (action: DraftAction) => void;
}) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setDraft(action?.body ?? "");
  }, [action]);

  if (!action) return null;
  const account = getAccount(action.accountId);
  const Icon = actionIcon[action.kind];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="size-4 text-primary" />
            <span className="eyebrow">{account.name} · human approval required</span>
          </div>
          <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
            Review before shipping
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-medium mb-2">Editable work product</div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={action.kind === "email" ? 9 : 5}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            <MiniProof label="ARR touched" value={formatARR(action.arrImpact)} />
            <MiniProof label="Citations" value={`${action.evidenceIds.length}`} />
            <MiniProof label="Write mode" value="Simulated" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex flex-wrap items-center gap-2">
          <button
            onClick={() => onShip({ ...action, body: draft })}
            className="inline-flex items-center gap-1.5 text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            <Check className="size-4" /> Confirm & ship
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-full transition-colors"
          >
            <X className="size-4" /> Keep editing later
          </button>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">
            demo write · no external system touched
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccountDrawer({
  account,
  open,
  onClose,
  onReceipt,
}: {
  account: Account | null;
  open: boolean;
  onClose: () => void;
  onReceipt: (receipt: Receipt) => void;
}) {
  if (!account) return null;
  const actions = DRAFT_ACTIONS.filter((action) => action.accountId === account.id);
  const gap = account.vendorScore.value - account.receiptsScore.value;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="eyebrow">
              {account.segment} · {formatARR(account.arr)} ARR · {account.renewalDays}d to renewal
            </span>
            <SampleTag compact />
          </div>
          <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
            {account.name}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          <p className="text-sm leading-relaxed text-muted-foreground">{account.headline}</p>
          <div className="grid sm:grid-cols-3 gap-3 my-5">
            <MetricCard
              label="CRM score"
              value={`${account.vendorScore.value} ${account.vendorScore.label}`}
            />
            <MetricCard
              label="Receipts score"
              value={`${account.receiptsScore.value} ${account.receiptsScore.label}`}
            />
            <MetricCard label="Score gap" value={`${Math.abs(gap)} pts`} />
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 mb-5">
            <div className="text-xs font-medium mb-1">Next best play</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{account.nextPlay}</p>
          </div>
          {actions.length > 0 && (
            <div className="mb-5">
              <div className="eyebrow mb-2">Agent actions on this account</div>
              <div className="space-y-2">
                {actions.map((action) => (
                  <div key={action.id} className="rounded-lg border border-border p-3">
                    <div className="text-sm font-medium">{action.title}</div>
                    <p className="text-xs text-muted-foreground mt-1">{action.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="eyebrow mb-2">Receipt timeline</div>
            <div className="space-y-2">
              {account.receipts.map((receipt) => (
                <button
                  key={receipt.id}
                  onClick={() => onReceipt(receipt)}
                  className="w-full text-left rounded-lg border border-border bg-background p-3 hover:bg-accent/40 transition-colors"
                >
                  <div className="text-[10px] font-mono text-muted-foreground mb-1">
                    {receipt.source}
                  </div>
                  <p className="text-sm leading-relaxed">"{receipt.quote}"</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceFrame({
  eyebrow,
  title,
  sub,
  children,
  sidebar,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  children: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-8">
      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <section className="min-w-0">
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="eyebrow">{eyebrow}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.14em] text-success">
                <span className="size-1.5 rounded-full bg-success animate-pulse" />
                actions ready
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.03]">
              {title}
            </h1>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-2xl">{sub}</p>
          </div>
          {children}
        </section>
        {sidebar}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sample }: { label: string; value: string; sample?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
        {sample && <SampleTag compact />}
      </div>
      <div className="font-display text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
      <Sparkles className="size-6 mx-auto mb-3 text-muted-foreground" />
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function DiffBlock({
  label,
  value,
  muted,
  danger,
}: {
  label: string;
  value: string;
  muted?: boolean;
  danger?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-sm font-semibold ${muted ? "text-muted-foreground" : ""} ${danger ? "text-danger" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function MiniProof({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function SampleTag({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 font-mono uppercase tracking-[0.14em] text-primary ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      sample data
    </span>
  );
}

const actionIcon: Record<DraftActionKind, typeof Mail> = {
  email: Mail,
  crm: FileText,
  meeting: CalendarClock,
  proposal: Bot,
};

function getAccount(id: string) {
  const account = ACCOUNTS.find((item) => item.id === id);
  if (!account) throw new Error(`Missing account ${id}`);
  return account;
}

function getReceipt(id: string) {
  const receipt = ACCOUNTS.flatMap((account) => account.receipts).find((item) => item.id === id);
  if (!receipt) throw new Error(`Missing receipt ${id}`);
  return receipt;
}

function evidenceFor(ids: string[]) {
  return ids.map(getReceipt);
}

function accountName(id: string) {
  return getAccount(id).name;
}

function signedMoney(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

function formatMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  return formatARR(value);
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());
}
