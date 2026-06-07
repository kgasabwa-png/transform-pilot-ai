// Manager + Leader sample data. Same engine, different aggregation.
// The shape here is what the real rollup queries will return.

import { SHIPPED, QUICK, JUDGMENT, SIGNALS } from "./consoleData";
import type { LaneAction, WorldSignal } from "./consoleData";

// ---- Team roster ----
export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  book: number; // accounts
  arr: number; // total book ARR
  autoShipRate: number; // 0-100
  revertsThisWeek: number;
  barDrift: number; // standard deviations from team mean revert rate
  shippedThisWeek: number;
  judgmentOpen: number;
};

export const TEAM: TeamMember[] = [
  {
    id: "sara",
    name: "Sara Chen",
    initials: "SC",
    book: 38,
    arr: 1_240_000,
    autoShipRate: 91,
    revertsThisWeek: 1,
    barDrift: -0.3,
    shippedThisWeek: 47,
    judgmentOpen: 1,
  },
  {
    id: "marcus",
    name: "Marcus Webb",
    initials: "MW",
    book: 42,
    arr: 1_460_000,
    autoShipRate: 88,
    revertsThisWeek: 2,
    barDrift: 0.4,
    shippedThisWeek: 53,
    judgmentOpen: 2,
  },
  {
    id: "jordan",
    name: "Jordan Kim",
    initials: "JK",
    book: 31,
    arr: 880_000,
    autoShipRate: 82,
    revertsThisWeek: 6,
    barDrift: 2.4, // flagged
    shippedThisWeek: 38,
    judgmentOpen: 3,
  },
  {
    id: "rena",
    name: "Rena Park",
    initials: "RP",
    book: 29,
    arr: 720_000,
    autoShipRate: 94,
    revertsThisWeek: 0,
    barDrift: -0.8,
    shippedThisWeek: 41,
    judgmentOpen: 0,
  },
];

// ---- Coaching moments: where a CSM keeps reverting the agent ----
export type CoachingMoment = {
  id: string;
  csm: string;
  account: string;
  pattern: string;
  agentSaid: string;
  csmDid: string;
  occurrences: number;
  suggestion: string;
};

export const COACHING: CoachingMoment[] = [
  {
    id: "c-1",
    csm: "Jordan Kim",
    account: "Pelican Foods + 3 others",
    pattern: "Reverts exec-silence escalations",
    agentSaid: "Flag exec sponsor as at-risk (≥2 missed QBRs)",
    csmDid: "Reverted in 4 of 5 cases — kept the green health score",
    occurrences: 4,
    suggestion:
      "Talk through what 'at-risk' means on Jordan's segment. Either the bar is wrong for SMB, or Jordan's optimism is hiding churn signal.",
  },
  {
    id: "c-2",
    csm: "Jordan Kim",
    account: "Blueprint Robotics",
    pattern: "Skips expansion-scout drafts",
    agentSaid: "Logged expansion signal to opportunity (Tier 3 interest)",
    csmDid: "Skipped 3× this month, then closed a manual expansion the next week",
    occurrences: 3,
    suggestion:
      "Jordan's manually doing the work the agent drafted. Show him the side-by-side at 1:1 — recover that time.",
  },
  {
    id: "c-3",
    csm: "Marcus Webb",
    account: "Tessera Bank, Arbor Energy",
    pattern: "Holds money actions in judgment lane >48h",
    agentSaid: "Co-sign requested twice in last 10 days",
    csmDid: "Hasn't routed for co-sign — money items aging",
    occurrences: 2,
    suggestion: "Time-box money decisions. Anything over 48h either ships or kills the line.",
  },
];

// ---- Co-sign queue (manager approvals on money actions) ----
export const COSIGN_QUEUE: LaneAction[] = JUDGMENT.filter((a) => a.blast === "money");

// ---- Team-wide pulse ----
export const TEAM_PULSE = {
  shippedThisWeek: TEAM.reduce((s, m) => s + m.shippedThisWeek, 0),
  revertsThisWeek: TEAM.reduce((s, m) => s + m.revertsThisWeek, 0),
  teamAutoShipRate: Math.round(
    TEAM.reduce((s, m) => s + m.autoShipRate, 0) / TEAM.length,
  ),
  barDriftFlags: TEAM.filter((m) => Math.abs(m.barDrift) >= 2).length,
  bookArr: TEAM.reduce((s, m) => s + m.arr, 0),
  hoursReturned: 47,
};

// ---- Leader: outcome breakdown bento ----
export type OutcomeStat = {
  id: string;
  label: string;
  blurb: string;
  shipped: number;
  pending: number;
  arrTouched: number;
  trend: number; // pct vs last week
};

export const OUTCOMES: OutcomeStat[] = [
  {
    id: "renewal",
    label: "Renewal",
    blurb: "At-risk caught early. Saves logged with the call that surfaced them.",
    shipped: 142,
    pending: 7,
    arrTouched: 580_000,
    trend: 12,
  },
  {
    id: "expansion",
    label: "Expansion",
    blurb: "Power-user spikes, feature asks, and competitive context — drafted into the opp.",
    shipped: 89,
    pending: 4,
    arrTouched: 312_000,
    trend: 18,
  },
  {
    id: "onboarding",
    label: "Onboarding",
    blurb: "Time-to-value milestones tracked from kickoff to first business outcome.",
    shipped: 67,
    pending: 3,
    arrTouched: 0,
    trend: 4,
  },
  {
    id: "escalation",
    label: "Escalation",
    blurb: "Sev-1s, exec silence, CSAT drops — routed before the customer asks 'why didn't you?'",
    shipped: 23,
    pending: 1,
    arrTouched: 188_000,
    trend: -2,
  },
  {
    id: "hygiene",
    label: "Hygiene",
    blurb: "CRM updates, contact mapping, account stage advances. The invisible 60% of CS.",
    shipped: 408,
    pending: 0,
    arrTouched: 0,
    trend: 31,
  },
];

// ---- Auto-ship rate trend (8 weeks) ----
export const AUTO_SHIP_TREND = [62, 68, 71, 74, 79, 82, 85, 87];

// ---- Customer-trust panel ----
export const CUSTOMER_TRUST = {
  customerFacingReviewed: 312,
  customerFacingSent: 312,
  customerFacingAutoSent: 0,
  moneyActionsCoSigned: 41,
  moneyActionsAutoSent: 0,
  reverts: 0,
  revertsTotal: 312,
};

// ---- Recent audit log (last actions across the org) ----
export type AuditEntry = {
  id: string;
  at: string;
  who: string; // CSM or "Agent (auto)"
  blast: "internal" | "customer-facing" | "money";
  action: string;
  account: string;
  citation: string;
  status: "shipped" | "co-signed" | "reverted" | "declined";
};

export const AUDIT_LOG: AuditEntry[] = [
  {
    id: "a-1",
    at: "7:41a",
    who: "Agent (auto)",
    blast: "internal",
    action: "Health: Green → Yellow",
    account: "Northwind Logistics",
    citation: "4/18 QBR · 00:34:12",
    status: "shipped",
  },
  {
    id: "a-2",
    at: "7:38a",
    who: "Sara Chen",
    blast: "customer-facing",
    action: "Sent recap email to champion",
    account: "Halcyon Health",
    citation: "Drafted from 4/17 sync",
    status: "shipped",
  },
  {
    id: "a-3",
    at: "7:22a",
    who: "Agent (auto)",
    blast: "internal",
    action: "Expansion signal → opp",
    account: "Meridian Retail",
    citation: "4/16 call · 00:12:08",
    status: "shipped",
  },
  {
    id: "a-4",
    at: "7:15a",
    who: "Sara Chen",
    blast: "money",
    action: "10% multi-year discount",
    account: "Quill Media",
    citation: "4/19 procurement sync",
    status: "co-signed",
  },
  {
    id: "a-5",
    at: "6:58a",
    who: "Agent (auto)",
    blast: "internal",
    action: "Stage: Implementation → Adopted",
    account: "Blueprint Robotics",
    citation: "Telemetry threshold hit",
    status: "shipped",
  },
  {
    id: "a-6",
    at: "6:42a",
    who: "Marcus Webb",
    blast: "customer-facing",
    action: "Declined re-engagement draft",
    account: "Tessera Bank",
    citation: "Agent low-confidence (52%)",
    status: "declined",
  },
];

// ---- Team-wide high-severity world signals ----
export const TEAM_SIGNALS: WorldSignal[] = SIGNALS.filter((s) => s.severity === "high");

// Re-export so surfaces can pull everything from one place
export { SHIPPED, QUICK, JUDGMENT, SIGNALS };
