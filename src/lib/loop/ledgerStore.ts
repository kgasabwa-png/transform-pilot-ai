// Tiny cross-persona ledger store. Demo-only — wires CSM ↔ Manager ↔ Leader
// so a "Request co-sign" on the CSM surface actually shows up in the Manager
// queue, and a Leader can audit the trail. Uses useSyncExternalStore.

import { useSyncExternalStore } from "react";
import type { LaneAction } from "./consoleData";
import { SHIPPED, QUICK, JUDGMENT } from "./consoleData";
import { COSIGN_QUEUE, AUDIT_LOG, type AuditEntry } from "./teamData";

export type LedgerStatus =
  | "shipped" // landed (auto or approved)
  | "reverted" // pulled back within 30d
  | "approved" // CSM approved, queued to ship
  | "declined" // CSM declined
  | "awaiting-cosign" // CSM routed to manager
  | "co-signed" // manager released
  | "open"; // still in lane

type LedgerRow = {
  id: string;
  action: LaneAction;
  status: LedgerStatus;
  by?: string; // person who acted
  at: number; // ms
};

type CosignItem = LaneAction & { routedBy: string; routedAt: number };

type State = {
  rows: LedgerRow[]; // append-only log
  cosignQueue: CosignItem[]; // manager queue (open only)
  cosignHandled: string[]; // ids that were co-signed or declined
};

const seedRows: LedgerRow[] = [
  ...SHIPPED.map<LedgerRow>((a) => ({
    id: a.id,
    action: a,
    status: "shipped",
    by: "Agent (auto)",
    at: Date.now() - 1000 * 60 * 60 * 6,
  })),
];

const seedCosign: CosignItem[] = COSIGN_QUEUE.map((a) => ({
  ...a,
  routedBy: a.csm,
  routedAt: Date.now() - 1000 * 60 * 60 * 2,
}));

let state: State = {
  rows: seedRows,
  cosignQueue: seedCosign,
  cosignHandled: [],
};

// Cached derived values — must be referentially stable across reads
// for useSyncExternalStore to avoid infinite renders.
let cachedStatusMap: Record<string, LedgerStatus> = computeStatusMap(state);
let cachedAuditFeed: AuditEntry[] = computeAuditFeed(state);

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(updater: (s: State) => State) {
  state = updater(state);
  cachedStatusMap = computeStatusMap(state);
  cachedAuditFeed = computeAuditFeed(state);
  emit();
}

// ---- Public API ----

export function recordDecision(
  action: LaneAction,
  status: LedgerStatus,
  by = "Sara Chen",
) {
  set((s) => ({
    ...s,
    rows: [
      { id: `${action.id}-${Date.now()}`, action, status, by, at: Date.now() },
      ...s.rows,
    ],
  }));
}

export function routeForCosign(action: LaneAction, by = "Sara Chen") {
  set((s) => {
    if (s.cosignQueue.some((c) => c.id === action.id)) return s;
    return {
      ...s,
      cosignQueue: [
        { ...action, routedBy: by, routedAt: Date.now() },
        ...s.cosignQueue,
      ],
      rows: [
        {
          id: `${action.id}-${Date.now()}`,
          action,
          status: "awaiting-cosign",
          by,
          at: Date.now(),
        },
        ...s.rows,
      ],
    };
  });
}

export function resolveCosign(
  actionId: string,
  outcome: "co-signed" | "declined",
  by = "Alex Morgan",
) {
  set((s) => {
    const item = s.cosignQueue.find((c) => c.id === actionId);
    if (!item) return s;
    return {
      ...s,
      cosignQueue: s.cosignQueue.filter((c) => c.id !== actionId),
      cosignHandled: [...s.cosignHandled, actionId],
      rows: [
        {
          id: `${actionId}-${Date.now()}`,
          action: item,
          status: outcome,
          by,
          at: Date.now(),
        },
        ...s.rows,
      ],
    };
  });
}

export function revertShipped(actionId: string, by = "Sara Chen") {
  set((s) => {
    const orig = s.rows.find((r) => r.action.id === actionId);
    if (!orig) return s;
    return {
      ...s,
      rows: [
        {
          id: `${actionId}-revert-${Date.now()}`,
          action: orig.action,
          status: "reverted",
          by,
          at: Date.now(),
        },
        ...s.rows,
      ],
    };
  });
}

// ---- Hooks ----

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLedger() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function useCosignQueue() {
  return useSyncExternalStore(
    subscribe,
    () => state.cosignQueue,
    () => state.cosignQueue,
  );
}

// Latest status per action id (for badges in lanes)
export function useStatusMap() {
  return useSyncExternalStore(
    subscribe,
    () => cachedStatusMap,
    () => cachedStatusMap,
  );
}

function computeStatusMap(s: State): Record<string, LedgerStatus> {
  const map: Record<string, LedgerStatus> = {};
  for (const r of s.rows) {
    if (!map[r.action.id]) map[r.action.id] = r.status;
  }
  return map;
}

// ---- Composed audit log for the Leader surface ----
export function useAuditFeed(): AuditEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => cachedAuditFeed,
    () => cachedAuditFeed,
  );
}

function computeAuditFeed(s: State): AuditEntry[] {
  const fromLedger: AuditEntry[] = s.rows.slice(0, 6).map((r) => ({
    id: r.id,
    at: relTime(r.at),
    who: r.by ?? "Agent (auto)",
    blast: r.action.blast,
    action: r.action.headline,
    account: r.action.account,
    citation: r.action.source,
    status:
      r.status === "co-signed"
        ? "co-signed"
        : r.status === "reverted"
          ? "reverted"
          : r.status === "declined" || r.status === "awaiting-cosign"
            ? "declined"
            : "shipped",
  }));
  return [...fromLedger, ...AUDIT_LOG].slice(0, 8);
}

function relTime(ms: number) {
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

// ---- Drill-down helpers for Leader outcome cards ----
export type OutcomeDrilldown = {
  outcomeId: string;
  items: LaneAction[];
};

const OUTCOME_TO_AGENTS: Record<string, string[]> = {
  renewal: ["renewal-risk"],
  expansion: ["expansion-scout"],
  onboarding: [],
  escalation: ["exec-silence", "champion-watch"],
  hygiene: [],
};

export function drilldownFor(outcomeId: string): LaneAction[] {
  const agents = OUTCOME_TO_AGENTS[outcomeId] ?? [];
  if (agents.length === 0) {
    // synth: just show shipped items as the "audit" for that outcome
    return SHIPPED.slice(0, 3);
  }
  const pool = [...SHIPPED, ...QUICK, ...JUDGMENT];
  return pool.filter((a) => agents.includes(a.agent));
}
