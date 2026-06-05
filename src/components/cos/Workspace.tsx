// Post-call workspace — the "you opened your laptop after the call" view.
// Five tabs: Inbox (aggregate), then Gmail / Salesforce / Asana / Slack
// rendered as realistic mocks of those tools with the artifacts already
// sitting there, timestamped "4 min ago by Chief of Staff".
// No animations of work happening — the work is done. You're discovering it.

import { useMemo, useState } from "react";
import { HERO } from "@/lib/cos/scenarios";
import { Check, Inbox, Mail, Database, ListChecks, Hash, Undo2, Send, Pencil, Sparkles } from "lucide-react";

type TabId = "inbox" | "gmail" | "salesforce" | "asana" | "slack";

const sf = HERO.steps.find((s) => s.artifact.tool === "salesforce")!.artifact as Extract<typeof HERO.steps[number]["artifact"], { tool: "salesforce" }>;
const gm = HERO.steps.find((s) => s.artifact.tool === "gmail")!.artifact as Extract<typeof HERO.steps[number]["artifact"], { tool: "gmail" }>;
const sl = HERO.steps.find((s) => s.artifact.tool === "slack")!.artifact as Extract<typeof HERO.steps[number]["artifact"], { tool: "slack" }>;
const as = HERO.steps.find((s) => s.artifact.tool === "asana")!.artifact as Extract<typeof HERO.steps[number]["artifact"], { tool: "asana" }>;

const TOTAL = sf.updates.length + 1 + 1 + as.tasks.length; // 4 + 1 + 1 + 3 = 9 changes

export function Workspace() {
  const [tab, setTab] = useState<TabId>("inbox");
  const [approved, setApproved] = useState<Record<string, boolean>>({});

  const approvedCount = Object.values(approved).filter(Boolean).length;
  const pending = TOTAL - approvedCount;

  const toggle = (id: string) => setApproved((p) => ({ ...p, [id]: !p[id] }));
  const approveAll = () => {
    const next: Record<string, boolean> = {};
    sf.updates.forEach((_, i) => (next[`sf-${i}`] = true));
    next["gm-0"] = true;
    next["sl-0"] = true;
    as.tasks.forEach((_, i) => (next[`as-${i}`] = true));
    setApproved(next);
  };
  const reset = () => setApproved({});

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-[oklch(0.985_0_0)]">
      {/* Hero banner — the moment of discovery */}
      <ReturnBanner pending={pending} total={TOTAL} onApproveAll={approveAll} onReset={reset} />

      {/* Tool tabs (looks like a Chrome tab bar) */}
      <div className="sticky top-0 z-10 bg-[oklch(0.985_0_0)]/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 flex items-end gap-1 overflow-x-auto">
          <TabButton id="inbox" active={tab} onClick={setTab} icon={<Inbox className="size-3.5" />} label="Inbox" badge={pending} />
          <TabButton id="gmail" active={tab} onClick={setTab} icon={<Mail className="size-3.5" />} label="Gmail" badge={approved["gm-0"] ? 0 : 1} />
          <TabButton id="salesforce" active={tab} onClick={setTab} icon={<Database className="size-3.5" />} label="Salesforce" badge={sf.updates.length - sf.updates.filter((_, i) => approved[`sf-${i}`]).length} />
          <TabButton id="asana" active={tab} onClick={setTab} icon={<ListChecks className="size-3.5" />} label="Asana" badge={as.tasks.length - as.tasks.filter((_, i) => approved[`as-${i}`]).length} />
          <TabButton id="slack" active={tab} onClick={setTab} icon={<Hash className="size-3.5" />} label="Slack" badge={approved["sl-0"] ? 0 : 1} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {tab === "inbox" && <InboxView approved={approved} toggle={toggle} jumpTo={setTab} />}
        {tab === "gmail" && <GmailMock approved={!!approved["gm-0"]} onApprove={() => toggle("gm-0")} />}
        {tab === "salesforce" && <SalesforceMock approved={approved} toggle={toggle} />}
        {tab === "asana" && <AsanaMock approved={approved} toggle={toggle} />}
        {tab === "slack" && <SlackMock approved={!!approved["sl-0"]} onApprove={() => toggle("sl-0")} />}
      </div>
    </div>
  );
}

/* ---------- shared chrome ---------- */

function TabButton({ id, active, onClick, icon, label, badge }: { id: TabId; active: TabId; onClick: (t: TabId) => void; icon: React.ReactNode; label: string; badge: number }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`relative flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors border-b-2 ${
        isActive
          ? "text-foreground border-foreground"
          : "text-muted-foreground border-transparent hover:text-foreground"
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className={`min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-mono flex items-center justify-center ${isActive ? "bg-foreground text-background" : "bg-foreground/10 text-foreground"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function ReturnBanner({ pending, total, onApproveAll, onReset }: { pending: number; total: number; onApproveAll: () => void; onReset: () => void }) {
  const done = total - pending;
  return (
    <div className="border-b border-border bg-gradient-to-b from-[oklch(0.97_0.01_264)] to-transparent">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-3">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Acme · Q3 QBR ended 4 min ago · 47 min recorded
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight max-w-3xl leading-[1.1]">
          While you were on the call, I did <span className="text-primary">{total} things</span> across your tools.
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-[15px] leading-relaxed">
          Everything's already in Gmail, Salesforce, Asana, and Slack — drafted, not sent. Open any tool and review. Or approve the whole batch.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onApproveAll}
            disabled={pending === 0}
            className="h-10 px-5 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity inline-flex items-center gap-2"
          >
            <Check className="size-4" />
            Approve all {pending > 0 ? `(${pending})` : "— done"}
          </button>
          <button
            onClick={onReset}
            className="h-10 px-4 rounded-md border border-border text-[13px] font-medium hover:bg-foreground/5 transition-colors"
          >
            Reset
          </button>
          <div className="ml-auto text-[12px] font-mono text-muted-foreground tabular-nums">
            {done} / {total} approved · saved ~47 min
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Inbox: unified review feed ---------- */

function InboxView({ approved, toggle, jumpTo }: { approved: Record<string, boolean>; toggle: (id: string) => void; jumpTo: (t: TabId) => void }) {
  const items = useMemo(
    () => [
      ...sf.updates.map((u, i) => ({ id: `sf-${i}`, tool: "salesforce" as TabId, icon: <Database className="size-3.5" />, label: "Salesforce", title: `${u.field}: ${u.from} → ${u.to}`, sub: sf.object })),
      { id: "gm-0", tool: "gmail" as TabId, icon: <Mail className="size-3.5" />, label: "Gmail · Draft", title: gm.subject, sub: `To ${gm.to} · ${gm.body.length} paragraphs` },
      ...as.tasks.map((t, i) => ({ id: `as-${i}`, tool: "asana" as TabId, icon: <ListChecks className="size-3.5" />, label: "Asana · Task", title: t.title, sub: `${t.owner} · due ${t.due}` })),
      { id: "sl-0", tool: "slack" as TabId, icon: <Hash className="size-3.5" />, label: "Slack · Message", title: sl.lines[0], sub: sl.channel },
    ],
    [],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold">All changes ({items.length})</h2>
        <div className="text-[11px] font-mono text-muted-foreground">Sorted by tool</div>
      </div>
      <div className="bg-surface border border-border rounded-lg divide-y divide-border overflow-hidden">
        {items.map((it) => {
          const ok = approved[it.id];
          return (
            <div key={it.id} className={`group flex items-center gap-4 px-4 py-3 transition-colors ${ok ? "bg-success/5" : "hover:bg-foreground/[0.02]"}`}>
              <button
                onClick={() => toggle(it.id)}
                className={`size-5 rounded border flex items-center justify-center transition-colors shrink-0 ${ok ? "bg-success border-success text-background" : "border-border hover:border-foreground"}`}
                aria-label="Approve"
              >
                {ok && <Check className="size-3" />}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground w-36 shrink-0">
                {it.icon}
                {it.label}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] truncate ${ok ? "line-through text-muted-foreground" : "text-foreground"}`}>{it.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">{it.sub}</div>
              </div>
              <button
                onClick={() => jumpTo(it.tool)}
                className="opacity-0 group-hover:opacity-100 text-[11px] font-mono text-primary hover:underline transition-opacity"
              >
                Open →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Gmail: drafts folder mock ---------- */

function GmailMock({ approved, onApprove }: { approved: boolean; onApprove: () => void }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
      {/* Gmail chrome */}
      <div className="border-b border-border px-4 py-2.5 flex items-center gap-3 bg-[oklch(0.98_0_0)]">
        <div className="text-[13px] font-medium">Drafts</div>
        <div className="text-[11px] text-muted-foreground font-mono">1 of 1</div>
        <div className="ml-auto text-[11px] text-muted-foreground">you@company.com</div>
      </div>
      {/* List + reading pane */}
      <div className="grid grid-cols-[260px_1fr]">
        <aside className="border-r border-border bg-[oklch(0.985_0_0)]">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded bg-primary/8 text-primary">
              <Mail className="size-3.5" />
              <span className="text-[12px] font-medium">Drafts</span>
              <span className="ml-auto text-[10px] font-mono">1</span>
            </div>
            {["Inbox", "Sent", "Starred"].map((l) => (
              <div key={l} className="flex items-center gap-2 px-2.5 py-2 text-[12px] text-muted-foreground">
                <span className="size-3.5" />
                {l}
              </div>
            ))}
          </div>
          <div className="p-2">
            <div className="px-2.5 py-2.5 rounded bg-foreground/[0.04] border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-destructive">[Draft]</span>
                <span className="text-[10px] font-mono text-muted-foreground">4 min</span>
              </div>
              <div className="text-[12px] font-medium truncate">{gm.subject}</div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">Sarah — quick recap so nothing slips...</div>
            </div>
          </div>
        </aside>

        <article className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">{gm.subject}</h3>
              <div className="text-[12px] text-muted-foreground mt-1">
                To <span className="text-foreground">{gm.to}</span> · from {gm.from}
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-foreground/5 text-muted-foreground inline-flex items-center gap-1.5">
              <Sparkles className="size-3" /> Drafted by Chief of Staff · 4m ago
            </span>
          </div>
          <div className="space-y-4 text-[14px] leading-[1.65] text-foreground/90 border-t border-border pt-5">
            {gm.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="text-muted-foreground italic">— you</p>
          </div>
          <div className="mt-6 pt-5 border-t border-border flex items-center gap-2">
            <button
              onClick={onApprove}
              className={`h-9 px-4 rounded-md text-[13px] font-medium inline-flex items-center gap-2 transition-colors ${
                approved ? "bg-success text-background" : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {approved ? (<><Check className="size-4" /> Sent</>) : (<><Send className="size-4" /> Send</>)}
            </button>
            <button className="h-9 px-4 rounded-md border border-border text-[13px] font-medium hover:bg-foreground/5 inline-flex items-center gap-2">
              <Pencil className="size-4" /> Edit
            </button>
            <button className="h-9 px-3 rounded-md text-[13px] text-muted-foreground hover:text-destructive">
              Discard
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}

/* ---------- Salesforce: opportunity record mock ---------- */

function SalesforceMock({ approved, toggle }: { approved: Record<string, boolean>; toggle: (id: string) => void }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="border-b border-border px-4 py-3 bg-[oklch(0.98_0_0)] flex items-center gap-3">
        <div className="size-7 rounded bg-[#00A1E0] text-white text-[11px] font-bold flex items-center justify-center">SF</div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Opportunity</div>
          <div className="text-[13px] font-semibold">{sf.object.replace("Opportunity · ", "")}</div>
        </div>
        <div className="ml-auto flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
          <span>Stage: <span className="text-foreground">Renewal · Negotiation</span></span>
          <span>ARR: <span className="text-foreground tabular-nums">$480,000</span></span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px]">
        <div className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Details</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {sf.updates.map((u, i) => {
              const id = `sf-${i}`;
              const ok = approved[id];
              return (
                <div key={id} className={`relative p-3 rounded-md border transition-colors ${ok ? "border-success/40 bg-success/5" : "border-amber-400/40 bg-amber-50/40"}`}>
                  <dt className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">{u.field}</dt>
                  <dd className="text-[13px] font-medium">{u.to}</dd>
                  <div className="text-[10px] font-mono text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <Sparkles className="size-2.5" /> Changed from "{u.from}" · 4m ago
                  </div>
                  <button
                    onClick={() => toggle(id)}
                    className={`absolute top-2 right-2 h-6 px-2 rounded text-[10px] font-mono inline-flex items-center gap-1 transition-colors ${
                      ok ? "bg-success text-background" : "bg-foreground text-background hover:opacity-90"
                    }`}
                  >
                    {ok ? <><Check className="size-3" /> Kept</> : "Approve"}
                  </button>
                </div>
              );
            })}
          </dl>
        </div>

        <aside className="border-l border-border bg-[oklch(0.985_0_0)] p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Activity</div>
          <div className="space-y-3">
            {sf.updates.map((u, i) => (
              <div key={i} className="text-[12px] flex gap-2">
                <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="size-2.5" />
                </div>
                <div>
                  <div><span className="font-medium">Chief of Staff</span> updated <span className="font-mono text-[11px]">{u.field}</span></div>
                  <div className="text-muted-foreground text-[11px]">From "{u.from}" → "{u.to}" · 4 min ago</div>
                  <button className="text-[11px] text-primary hover:underline mt-0.5 inline-flex items-center gap-1">
                    <Undo2 className="size-3" /> Revert
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Asana: project kanban mock ---------- */

function AsanaMock({ approved, toggle }: { approved: Record<string, boolean>; toggle: (id: string) => void }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="border-b border-border px-4 py-3 bg-[oklch(0.98_0_0)] flex items-center gap-3">
        <div className="size-7 rounded bg-[#F06A6A] text-white text-[11px] font-bold flex items-center justify-center">A</div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Project</div>
          <div className="text-[13px] font-semibold">{as.project}</div>
        </div>
        <div className="ml-auto text-[11px] font-mono text-muted-foreground">Board view</div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-5 bg-[oklch(0.98_0_0)]">
        <Column title="To do" count={as.tasks.length}>
          {as.tasks.map((t, i) => {
            const id = `as-${i}`;
            const ok = approved[id];
            return (
              <div key={id} className={`bg-surface border rounded-md p-3 transition-colors ${ok ? "border-success/40 bg-success/5" : "border-border"}`}>
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggle(id)}
                    className={`size-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                      ok ? "bg-success border-success" : "border-border hover:border-success"
                    }`}
                  >
                    {ok && <Check className="size-2.5 text-background" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] leading-snug ${ok ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-foreground/5">{t.owner}</span>
                      <span>Due {t.due}</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-2 flex items-center gap-1">
                      <Sparkles className="size-2.5" /> Created by Chief of Staff · 4m
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Column>
        <Column title="In progress" count={0}><EmptyCol /></Column>
        <Column title="Done" count={0}><EmptyCol /></Column>
      </div>
    </div>
  );
}

function Column({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="text-[10px] font-mono text-muted-foreground">{count}</div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function EmptyCol() {
  return <div className="border border-dashed border-border rounded-md h-20" />;
}

/* ---------- Slack: channel mock ---------- */

function SlackMock({ approved, onApprove }: { approved: boolean; onApprove: () => void }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="border-b border-border px-4 py-3 bg-[oklch(0.98_0_0)] flex items-center gap-3">
        <div className="size-7 rounded bg-[#4A154B] text-white text-[11px] font-bold flex items-center justify-center">#</div>
        <div>
          <div className="text-[13px] font-semibold">{sl.channel}</div>
          <div className="text-[10px] font-mono text-muted-foreground">4 members · CS internal</div>
        </div>
        <div className="ml-auto text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-900">
          Draft — not yet posted
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-3">
          <div className="size-9 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-[14px]">{sl.author}</span>
              <span className="text-[10px] font-mono text-muted-foreground">drafted 4 min ago</span>
            </div>
            <div className="mt-1 space-y-1 text-[13px] font-mono leading-relaxed">
              {sl.lines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex items-center gap-2">
          <button
            onClick={onApprove}
            className={`h-9 px-4 rounded-md text-[13px] font-medium inline-flex items-center gap-2 ${
              approved ? "bg-success text-background" : "bg-foreground text-background hover:opacity-90"
            }`}
          >
            {approved ? (<><Check className="size-4" /> Posted to {sl.channel}</>) : (<><Send className="size-4" /> Post to {sl.channel}</>)}
          </button>
          <button className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-foreground/5">Edit</button>
        </div>
      </div>
    </div>
  );
}
