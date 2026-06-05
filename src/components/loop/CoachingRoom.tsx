// Team Forecast — the CS manager's surface. The manager is not being coached;
// they see where agents changed forecast, found risk, or staged interventions
// across their CSMs, then decide what to send, save, or operationalize.

import { useState } from "react";
import { Play, Send, Save, Quote, Sparkles, AlertTriangle } from "lucide-react";
import { buildCoachingMoments, buildTeamPatterns, type CoachingMoment } from "@/lib/loop/coaching";
import { ACCOUNTS, formatARR } from "@/lib/loop/portfolio";
import { relativeAgo, shortStamp } from "@/lib/loop/time";
import { AccountDrawer } from "@/components/loop/AccountDrawer";
import { buildActions } from "@/lib/loop/actions";

export function CoachingRoom() {
  const [moments, setMoments] = useState<CoachingMoment[]>(() => buildCoachingMoments());
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const patterns = buildTeamPatterns();
  const actions = buildActions();

  const totalUpside = moments.reduce((s, m) => s + m.arrUpside, 0);

  const handleSend = (m: CoachingMoment) => {
    setMoments((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "sent" } : x)));
    setToast(`Coaching note sent to ${m.csm}. They'll see it in their inbox.`);
    setTimeout(() => setToast(null), 3500);
  };
  const handleSave = (m: CoachingMoment) => {
    setMoments((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "saved" } : x)));
    setToast(`Saved for ${m.csm}'s next 1:1.`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <header className="space-y-3">
        <div className="text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          {shortStamp()} · team forecast · 8 CSMs · 312 accounts
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
          {moments.length} team decisions need your call.
          <br />
          <span className="text-muted-foreground">
            The agents found the evidence; you choose the workflow.
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm">
          <Stat
            label="ARR protected if handled"
            value={`$${(totalUpside / 1000).toFixed(0)}k`}
            tone="success"
          />
          <Stat label="Manager approvals needed" value={`${moments.filter((m) => m.severity === "high").length}`} />
          <Stat label="Automations ready" value={`${patterns.length}`} />
          <span className="text-[11px] font-mono text-muted-foreground ml-auto">
            <Sparkles className="size-3 inline -translate-y-0.5 mr-1" />
            Sample book · numbers illustrative
          </span>
        </div>
      </header>

      {/* Team patterns */}
      {patterns.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            Cross-team workflow · ready to automate
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {patterns.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-surface p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-3.5 text-warning" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    {p.csmCount} CSMs · {p.missCount} accounts
                  </span>
                  <span className="ml-auto text-[11px] font-mono text-success">
                    +{formatARR(p.arrUpside)} upside
                  </span>
                </div>
                <h3 className="font-display text-sm font-semibold leading-snug">{p.headline}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.detail}</p>
                <button className="text-xs font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
                  Draft manager play →
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Coaching moments */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          CSM intervention queue
        </h2>
        {moments.map((m) => (
          <CoachingCard
            key={m.id}
            moment={m}
            onSend={handleSend}
            onSave={handleSave}
            onAccount={setOpenAccountId}
          />
        ))}
      </section>

      <AccountDrawer
        accountId={openAccountId}
        open={openAccountId !== null}
        onClose={() => setOpenAccountId(null)}
        actions={actions}
        onReceipt={() => {}}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 max-w-sm rounded-lg bg-foreground text-background px-4 py-3 shadow-lg z-50">
          <div className="text-sm">{toast}</div>
        </div>
      )}
    </div>
  );
}

function CoachingCard({
  moment,
  onSend,
  onSave,
  onAccount,
}: {
  moment: CoachingMoment;
  onSend: (m: CoachingMoment) => void;
  onSave: (m: CoachingMoment) => void;
  onAccount: (id: string) => void;
}) {
  const account = ACCOUNTS.find((a) => a.id === moment.accountId);
  const severityCls =
    moment.severity === "high"
      ? "bg-danger/10 text-danger"
      : moment.severity === "medium"
      ? "bg-warning/10 text-warning"
      : "bg-muted text-muted-foreground";
  const dead = moment.status !== "pending";

  return (
    <article className={`rounded-xl border bg-surface ${dead ? "opacity-70" : ""}`}>
      <header className="px-5 pt-5 pb-3 flex items-start gap-3">
        <div className="size-9 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 text-[11px] font-mono font-semibold">
          {moment.csmInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              {moment.csm}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={() => onAccount(moment.accountId)}
              className="text-[11px] font-medium underline decoration-foreground/20 hover:decoration-foreground underline-offset-2"
            >
              {account?.name ?? moment.accountName}
            </button>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {relativeAgo(moment.callDate)}
            </span>
            <span className={`ml-auto text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${severityCls}`}>
              {moment.severity}
            </span>
          </div>
          <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight">
            {moment.headline}
          </h3>
          {moment.pattern && (
            <div className="text-[11px] text-warning font-mono mt-1">{moment.pattern}</div>
          )}
        </div>
      </header>

      {/* Transcript clip */}
      <div className="px-5 pb-3">
        <div className="rounded-lg border border-border bg-foreground/[0.02] p-3 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <button className="inline-flex items-center gap-1 hover:text-foreground">
              <Play className="size-3 fill-current" />
              {moment.momentTimestamp}
            </button>
            <span>· {moment.callDurationMin} min call</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-0.5">Customer</div>
              <p className="text-sm leading-relaxed italic">"{moment.transcriptSnippet.customer}"</p>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-0.5">{moment.csm} said</div>
              <p className="text-sm leading-relaxed text-muted-foreground">"{moment.transcriptSnippet.csmSaid}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* What to say next time */}
      <div className="px-5 pb-4">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-1.5 flex items-center gap-1">
            <Quote className="size-3" /> Manager note to send or save
        </div>
        <p className="text-sm leading-relaxed">{moment.whatToSayNextTime}</p>
      </div>

      <footer className="px-5 py-3 border-t border-border flex items-center gap-3 bg-foreground/[0.015]">
        <span className="text-sm font-mono font-semibold text-success">
          +{formatARR(moment.arrUpside)} upside
        </span>
        {dead && (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/15 text-success">
            {moment.status}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {moment.status === "pending" && (
            <>
              <button
                onClick={() => onSave(moment)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-foreground/5 transition-colors"
              >
                <Save className="size-3.5" />
                Save for 1:1
              </button>
              <button
                onClick={() => onSend(moment)}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-md hover:bg-foreground/90 transition-colors"
              >
                <Send className="size-3.5" />
                Send to {moment.csm.split(" ")[0]}
              </button>
            </>
          )}
        </div>
      </footer>
    </article>
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
