// SaveRoom — the CSM's surface. A queue of Motions (multi-step save
// plays). One click ships the whole motion. The live ticker at the
// top counts $ pulled back from churn as motions complete.

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { buildMotions, type Motion, type MotionStep } from "@/lib/loop/motions";
import { ACCOUNTS, type Receipt } from "@/lib/loop/portfolio";
import { MotionCard } from "@/components/loop/MotionCard";
import { ShipSequence } from "@/components/loop/ShipSequence";
import { MotionDetailDrawer } from "@/components/loop/MotionDetailDrawer";
import { OverrideModal } from "@/components/loop/OverrideModal";
import { AccountDrawer } from "@/components/loop/AccountDrawer";
import { ReceiptModal } from "@/components/loop/ReceiptModal";
import { LiveTicker } from "@/components/loop/LiveTicker";
import { useClientStamp } from "@/lib/loop/useClientStamp";
import type { DraftAction } from "@/lib/loop/actions";

// Adapter so OverrideModal (typed on DraftAction) keeps working.
function motionAsAction(m: Motion): DraftAction {
  return {
    id: m.id,
    kind: "email",
    agent: m.agent,
    accountId: m.accountId,
    preparedAt: m.preparedAt,
    arrImpact: m.arrImpact,
    oneLine: m.headline,
    why: m.why,
    evidence: m.evidence,
    status: "pending",
  };
}

export function SaveRoom() {
  const stamp = useClientStamp();
  const [motions, setMotions] = useState<Motion[]>(() => buildMotions());
  const [shipTarget, setShipTarget] = useState<Motion | null>(null);
  const [openMotion, setOpenMotion] = useState<Motion | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<Motion | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [agentToast, setAgentToast] = useState<string | null>(null);

  const pending = motions.filter((m) => m.status === "pending");
  const shipped = motions.filter((m) => m.status === "shipped");
  const pulledBack = useMemo(
    () => shipped.reduce((s, m) => s + m.arrImpact, 0),
    [shipped],
  );
  const atRisk = useMemo(
    () => pending.reduce((s, m) => s + m.arrImpact, 0),
    [pending],
  );

  const handleShipComplete = (m: Motion) => {
    setMotions((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, status: "shipped" } : x)),
    );
  };

  const handleOpenShipFromDrawer = (m: Motion, _edits: Record<string, Partial<MotionStep>>) => {
    setOpenMotion(null);
    setShipTarget(m);
  };

  const handleReceiptByRef = (accountIdRef: string, receiptId: string) => {
    const acc = ACCOUNTS.find((a) => a.id === accountIdRef);
    const r = acc?.receipts.find((x) => x.id === receiptId);
    if (r) setReceipt(r);
  };

  const handleOverrideConfirm = (a: DraftAction) => {
    setMotions((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, status: "overridden" } : x)),
    );
    setOverrideTarget(null);
    const count = motions.filter((x) => x.status === "overridden").length + 1;
    setAgentToast(
      `You've corrected this agent ${count}× this session — it's learning your bar.`,
    );
    setTimeout(() => setAgentToast(null), 4000);
  };

  // Sample-book DraftActions for AccountDrawer history compatibility.
  const actionsForDrawer: DraftAction[] = motions.map(motionAsAction);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {stamp} · the save room · 12 accounts · 4 agents on duty
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.05]">
          {pending.length} save plays ready to ship.{" "}
          <span className="text-muted-foreground">One click each.</span>
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-3">
          <LiveTicker
            label="Pulled back from churn"
            value={pulledBack}
            tone="success"
            formatter={(n) => `$${(n / 1000).toFixed(0)}k`}
          />
          <LiveTicker
            label="ARR at stake right now"
            value={atRisk}
            formatter={(n) => `$${(n / 1000).toFixed(0)}k`}
          />
          <div className="hidden sm:flex flex-col justify-end text-[11px] font-mono text-muted-foreground items-end gap-1">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3" />
              Sample book · numbers illustrative
            </span>
            <span>Nothing leaves your browser.</span>
          </div>
        </div>
      </header>

      {/* Queue */}
      <section className="space-y-4">
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <div className="font-display text-lg font-semibold">Inbox zero.</div>
            <p className="text-sm text-muted-foreground mt-1">
              The crew has nothing else for you right now.
              <br />
              Next sweep in 14 min.
            </p>
          </div>
        ) : (
          pending.map((m) => (
            <MotionCard
              key={m.id}
              motion={m}
              onShip={setShipTarget}
              onOpen={setOpenMotion}
              onOverride={setOverrideTarget}
              onAccount={setAccountId}
              onReceipt={handleReceiptByRef}
            />
          ))
        )}
      </section>

      {/* Shipped today log */}
      {shipped.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              Shipped this session
            </span>
            <span className="ml-auto text-[11px] font-mono text-muted-foreground">
              {shipped.length} {shipped.length === 1 ? "save" : "saves"}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {shipped.map((m) => {
              const acc = ACCOUNTS.find((a) => a.id === m.accountId);
              return (
                <li key={m.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="size-7 rounded-md bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono font-semibold text-success">
                      {m.steps.length}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono text-muted-foreground">
                      {acc?.name} · {m.steps.length} steps shipped
                    </div>
                    <div className="text-sm leading-snug mt-0.5">{m.headline}</div>
                  </div>
                  <span className="text-sm font-mono font-semibold text-success shrink-0 pt-0.5 tabular-nums">
                    +${(m.arrImpact / 1000).toFixed(0)}k
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Modals */}
      <ShipSequence
        motion={shipTarget}
        open={shipTarget !== null}
        onClose={() => setShipTarget(null)}
        onShipped={handleShipComplete}
      />
      <MotionDetailDrawer
        motion={openMotion}
        open={openMotion !== null}
        onClose={() => setOpenMotion(null)}
        onShip={handleOpenShipFromDrawer}
        onOverride={(m) => {
          setOpenMotion(null);
          setOverrideTarget(m);
        }}
        onAccount={setAccountId}
        onReceipt={handleReceiptByRef}
      />
      <OverrideModal
        action={overrideTarget ? motionAsAction(overrideTarget) : null}
        open={overrideTarget !== null}
        onClose={() => setOverrideTarget(null)}
        onConfirm={handleOverrideConfirm}
      />
      <AccountDrawer
        accountId={accountId}
        open={accountId !== null}
        onClose={() => setAccountId(null)}
        actions={actionsForDrawer}
        onReceipt={setReceipt}
      />
      <ReceiptModal
        receipt={receipt}
        open={receipt !== null}
        onClose={() => setReceipt(null)}
      />

      {agentToast && (
        <div className="fixed bottom-6 right-6 max-w-sm rounded-lg bg-foreground text-background px-4 py-3 shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-60 mb-1">
            Agent learning
          </div>
          <div className="text-sm">{agentToast}</div>
        </div>
      )}
    </div>
  );
}
