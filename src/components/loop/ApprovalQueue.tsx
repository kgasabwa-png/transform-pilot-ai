// The CSM surface. NOT a dashboard. A queue of drafted actions waiting
// for the human to approve, edit, or override. Outcome metric at the
// top is what matters: dollars advanced and number of approvals.

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { buildActions, type DraftAction } from "@/lib/loop/actions";
import { ACCOUNTS, type Receipt } from "@/lib/loop/portfolio";
import { ActionCard } from "@/components/loop/ActionCard";
import { SendConfirmModal } from "@/components/loop/SendConfirmModal";
import { OverrideModal } from "@/components/loop/OverrideModal";
import { AccountDrawer } from "@/components/loop/AccountDrawer";
import { ShippedToday } from "@/components/loop/ShippedToday";
import { ReceiptModal } from "@/components/loop/ReceiptModal";
import { shortStamp } from "@/lib/loop/time";

export function ApprovalQueue() {
  const [actions, setActions] = useState<DraftAction[]>(() => buildActions());
  const [sendTarget, setSendTarget] = useState<DraftAction | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<DraftAction | null>(null);
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);
  const [openReceipt, setOpenReceipt] = useState<Receipt | null>(null);
  const [overrideToast, setOverrideToast] = useState<string | null>(null);

  const pending = actions.filter((a) => a.status === "pending");
  const closedToday = actions.filter((a) => a.status !== "pending");

  const arrAdvanced = useMemo(
    () =>
      actions
        .filter((a) => a.status === "shipped")
        .reduce((s, a) => s + Math.abs(a.arrImpact), 0),
    [actions],
  );
  const arrPending = useMemo(
    () => pending.reduce((s, a) => s + Math.abs(a.arrImpact), 0),
    [pending],
  );

  const handleReceiptByRef = (accountId: string, receiptId: string) => {
    const acc = ACCOUNTS.find((a) => a.id === accountId);
    const r = acc?.receipts.find((x) => x.id === receiptId);
    if (r) setOpenReceipt(r);
  };

  const handleShipped = (a: DraftAction, edited: Partial<DraftAction>) => {
    setActions((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, ...edited, status: "shipped" } : x)),
    );
  };

  const handleOverrideConfirm = (a: DraftAction, _reasonId: string, _detail: string) => {
    setActions((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, status: "overridden" } : x)),
    );
    setOverrideTarget(null);
    const overrideCount =
      actions.filter((x) => x.status === "overridden").length + 1;
    setOverrideToast(
      `You've corrected ${a.agent} ${overrideCount}x this session — it's learning your bar.`,
    );
    setTimeout(() => setOverrideToast(null), 4500);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* Top metric strip */}
      <header className="space-y-3">
        <div className="text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          {shortStamp()} · your approval queue
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
          {pending.length} drafts waiting on you.{" "}
          <span className="text-muted-foreground">
            Approve, edit, or override.
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm">
          <Stat
            label="ARR awaiting approval"
            value={`$${(arrPending / 1000).toFixed(0)}k`}
          />
          <Stat
            label="ARR advanced today"
            value={`$${(arrAdvanced / 1000).toFixed(0)}k`}
            tone="success"
          />
          <Stat label="Drafts closed today" value={`${closedToday.length}`} />
          <span className="text-[11px] font-mono text-muted-foreground ml-auto">
            <Sparkles className="size-3 inline -translate-y-0.5 mr-1" />
            Sample book · numbers illustrative
          </span>
        </div>
      </header>

      {/* The queue */}
      <section className="space-y-4">
        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <div className="font-display text-lg font-medium">Inbox zero.</div>
            <p className="text-sm text-muted-foreground mt-1">
              The crew has nothing else for you right now. Check back after the next call cycle.
            </p>
          </div>
        ) : (
          pending.map((a) => (
            <ActionCard
              key={a.id}
              action={a}
              onPrimary={setSendTarget}
              onOverride={setOverrideTarget}
              onAccount={setOpenAccountId}
              onReceipt={handleReceiptByRef}
            />
          ))
        )}
      </section>

      <ShippedToday actions={actions} />

      {/* Modals */}
      <SendConfirmModal
        action={sendTarget}
        open={sendTarget !== null}
        onClose={() => setSendTarget(null)}
        onShipped={handleShipped}
      />
      <OverrideModal
        action={overrideTarget}
        open={overrideTarget !== null}
        onClose={() => setOverrideTarget(null)}
        onConfirm={handleOverrideConfirm}
      />
      <AccountDrawer
        accountId={openAccountId}
        open={openAccountId !== null}
        onClose={() => setOpenAccountId(null)}
        actions={actions}
        onReceipt={setOpenReceipt}
      />
      <ReceiptModal
        receipt={openReceipt}
        open={openReceipt !== null}
        onClose={() => setOpenReceipt(null)}
      />

      {/* Override "learning" toast */}
      {overrideToast && (
        <div className="fixed bottom-6 right-6 max-w-sm rounded-lg bg-foreground text-background px-4 py-3 shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] opacity-60 mb-1">
            Agent learning
          </div>
          <div className="text-sm">{overrideToast}</div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-xl font-display font-semibold tracking-tight ${
          tone === "success" ? "text-success" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
