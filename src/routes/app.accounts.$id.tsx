import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpenText,
  Building2,
  Calendar,
  FileText,
  Mail,
  MessageSquare,
  Newspaper,
  Phone,
  ShieldAlert,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { AppShell } from "@/components/loop/AppShell";

export const Route = createFileRoute("/app/accounts/$id")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s.role as "csm" | "manager" | "leader") ?? "csm",
    demo: s.demo === true || s.demo === "true",
  }),
  component: AccountBrainPage,
});

type Brain = {
  name: string;
  arr: number;
  segment: string;
  renewalIn: string;
  health: "green" | "yellow" | "red";
  thesis: string;
  thesisUpdated: string;
  champion: { name: string; role: string; status: "stable" | "changed" | "silent" };
  execSponsor: { name: string; role: string; lastSeen: string; status: "stable" | "silent" };
  risks: { id: string; severity: "high" | "medium"; label: string; detail: string }[];
  nextMoves: { id: string; label: string; rationale: string; eta: string }[];
  timeline: {
    id: string;
    when: string;
    kind: "call" | "email" | "slack" | "news" | "system";
    title: string;
    detail: string;
  }[];
};

const BRAINS: Record<string, Brain> = {
  halcyon: {
    name: "Halcyon Health",
    arr: 156000,
    segment: "Mid-market · Healthcare",
    renewalIn: "62 days",
    health: "yellow",
    thesis:
      "Healthy product fit (WAU 71%, 4 power users) but the org just changed under us. Acquisition by Cerner Health Group (announced 4/22) and champion Marcus moving to the new product org both happened in a 5-day window. Historical base rate: 73% of accounts acquired by strategics churn within 2 renewals. We have one quarter to make the new owner care, starting with a warm intro to Marcus's replacement before procurement does.",
    thesisUpdated: "updated 14m ago after Reuters acquisition story",
    champion: { name: "Marcus Liu", role: "VP Clinical Ops → Product (new org)", status: "changed" },
    execSponsor: { name: "Dr. Lena Park", role: "CMO", lastSeen: "QBR · 3/12", status: "silent" },
    risks: [
      { id: "r1", severity: "high", label: "Acquisition by Cerner", detail: "Vendor consolidation review likely within 90 days. Reuters · 4/22." },
      { id: "r2", severity: "high", label: "Champion transition", detail: "Marcus moved to new product org. Replacement not announced yet on LinkedIn." },
      { id: "r3", severity: "medium", label: "Exec sponsor silent 41 days", detail: "Dr. Park hasn't joined a call since 3/12 QBR. Champion attended last 3 alone." },
    ],
    nextMoves: [
      {
        id: "n1",
        label: "Send warm intro to Marcus's replacement",
        rationale: "Drafted. Frames continuity, references the cohort analytics work Marcus championed in Q1. Ready in your Quick Review.",
        eta: "today",
      },
      {
        id: "n2",
        label: "Brief Dr. Park on Cerner integration risk before she's asked",
        rationale: "Get ahead of the procurement conversation. I've pulled the 3 most-cited Cerner integration points from the support backlog.",
        eta: "this week",
      },
      {
        id: "n3",
        label: "Pause the standard renewal email cadence",
        rationale: "Currently scheduled to fire 5/12. The acquisition changes the audience. Holding for your signoff.",
        eta: "holding",
      },
    ],
    timeline: [
      { id: "t1", when: "14m ago", kind: "news", title: "Cerner Health Group acquires Halcyon", detail: "Reuters · 4/22 7:48a · agent flagged" },
      { id: "t2", when: "Yesterday 4:31p", kind: "slack", title: "Champion DM: \"strategic conversation in flight\"", detail: "Marcus pinged Sara — \"can't say more yet, but worth a chat next week\"" },
      { id: "t3", when: "4/17 11:02a", kind: "call", title: "QBR — champion only", detail: "Marcus mentioned moving to new product org · 00:34:12" },
      { id: "t4", when: "4/12 9:15a", kind: "email", title: "Roadmap follow-up to clinical team", detail: "3 questions returned, none urgent · sentiment positive" },
      { id: "t5", when: "4/08 2:40p", kind: "system", title: "WAU crossed 70% threshold", detail: "First time hitting expansion-eligible band · agent did not auto-ship (champion transition risk)" },
      { id: "t6", when: "3/12 10:00a", kind: "call", title: "Q1 QBR — Dr. Park attended", detail: "Last exec engagement · feedback: \"on track\"" },
    ],
  },
};

const ICON: Record<Brain["timeline"][number]["kind"], React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  slack: MessageSquare,
  news: Newspaper,
  system: FileText,
};

function AccountBrainPage() {
  const { id } = Route.useParams();
  const brain = BRAINS[id] ?? BRAINS.halcyon;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <Link
            to="/app"
            search={{ role: "csm", demo: true }}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> back to ledger
          </Link>
        </div>

        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            <BookOpenText className="size-3 text-primary" />
            account brain · maintained by Tandem · {brain.thesisUpdated}
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight leading-[1.05]">
                {brain.name}
              </h1>
              <div className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-3.5" /> {brain.segment}
                </span>
                <span>·</span>
                <span className="tabular-nums">${(brain.arr / 1000).toFixed(0)}k ARR</span>
                <span>·</span>
                <span>renews in {brain.renewalIn}</span>
              </div>
            </div>
            <HealthPill health={brain.health} />
          </div>
        </header>

        {/* Thesis — the living doc */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-display text-base font-semibold tracking-tight">Current thesis</h2>
            <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              I rewrite this when the picture changes
            </span>
          </div>
          <p className="font-display text-lg leading-relaxed text-foreground/95">
            {brain.thesis}
          </p>
        </section>

        {/* People */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PersonCard
            label="Champion"
            person={brain.champion}
            warn={brain.champion.status === "changed"}
          />
          <PersonCard label="Exec sponsor" person={brain.execSponsor} warn={brain.execSponsor.status === "silent"} />
        </section>

        {/* Next moves — agent recommendations */}
        <section className="rounded-2xl border border-border bg-surface overflow-hidden">
          <header className="px-5 py-3 border-b border-border flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            <h2 className="font-display text-sm font-semibold tracking-tight">What I'd do next</h2>
            <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              ranked by impact
            </span>
          </header>
          <ul className="divide-y divide-border">
            {brain.nextMoves.map((m, i) => (
              <li key={m.id} className="px-5 py-4 flex gap-4">
                <div className="text-[11px] font-mono text-muted-foreground tabular-nums w-6 shrink-0 pt-0.5">
                  0{i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-display text-base font-semibold">{m.label}</div>
                  <p className="text-[13px] text-muted-foreground mt-1">{m.rationale}</p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground shrink-0 pt-1">
                  {m.eta}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Risks */}
        <section className="rounded-2xl border border-border bg-surface overflow-hidden">
          <header className="px-5 py-3 border-b border-border flex items-center gap-2">
            <ShieldAlert className="size-4 text-danger" />
            <h2 className="font-display text-sm font-semibold tracking-tight">Open risks</h2>
          </header>
          <ul className="divide-y divide-border">
            {brain.risks.map((r) => (
              <li key={r.id} className="px-5 py-3 flex gap-3 items-start">
                <span
                  className={`text-[9px] font-mono uppercase tracking-[0.14em] px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                    r.severity === "high"
                      ? "bg-danger/15 text-danger"
                      : "bg-warning/15 text-warning"
                  }`}
                >
                  {r.severity}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="text-[12px] text-muted-foreground">{r.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Timeline */}
        <section className="rounded-2xl border border-border bg-surface overflow-hidden">
          <header className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <h2 className="font-display text-sm font-semibold tracking-tight">
              Every signal, in order
            </h2>
            <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              last 30d
            </span>
          </header>
          <ul className="divide-y divide-border">
            {brain.timeline.map((e) => {
              const Icon = ICON[e.kind];
              return (
                <li key={e.id} className="px-5 py-3 flex gap-3">
                  <Icon className="size-3.5 text-muted-foreground mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{e.title}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{e.detail}</div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums pt-1">
                    {e.when}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="text-[11px] font-mono text-muted-foreground text-center pt-2">
          This page is rewritten by Tandem whenever a new signal arrives · ⌘K to ask anything
        </footer>
      </div>
    </AppShell>
  );
}

function HealthPill({ health }: { health: "green" | "yellow" | "red" }) {
  const cfg = {
    green: { label: "Healthy", cls: "bg-success/15 text-success border-success/30" },
    yellow: { label: "At risk", cls: "bg-warning/15 text-warning border-warning/30" },
    red: { label: "Red", cls: "bg-danger/15 text-danger border-danger/30" },
  }[health];
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] ${cfg.cls}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {cfg.label}
    </div>
  );
}

function PersonCard({
  label,
  person,
  warn,
}: {
  label: string;
  person: { name: string; role: string; status?: string; lastSeen?: string };
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <UserCircle2 className="size-8 text-muted-foreground" />
        <div className="min-w-0">
          <div className="font-medium leading-tight">{person.name}</div>
          <div className="text-[12px] text-muted-foreground">{person.role}</div>
        </div>
      </div>
      {warn && (
        <div className="mt-3 text-[11px] font-mono text-warning bg-warning/10 border border-warning/20 rounded px-2 py-1">
          {person.status === "changed"
            ? "Title changed — relationship at risk"
            : `Silent since ${person.lastSeen}`}
        </div>
      )}
    </div>
  );
}
