// Sample-book data for the persona-aware /console.
// Real wiring (Firecrawl + DB-backed signals + live confidence calibration)
// comes in a follow-up pass. The shape here is what those calls will return.

import type { BlastRadius } from "./autonomy";

export type LaneAction = {
  id: string;
  account: string;
  csm: string;
  blast: BlastRadius;
  confidence: number; // 0-100
  agent: string;
  headline: string;
  detail: string;
  evidence: string; // verbatim quote or system event
  source: string; // where it came from
  arrAtStake?: number;
  shippedAt?: string; // present iff shipped
};

export type WorldSignal = {
  id: string;
  account: string;
  csm: string;
  kind: "champion-change" | "acquisition" | "funding" | "layoffs" | "hiring";
  headline: string;
  detail: string;
  detectedAt: string;
  severity: "low" | "medium" | "high";
  source: string;
  correlatesWith?: string; // call/CRM signal it pairs with
  arrAtStake?: number;
};

// ---- Shipped (auto-shipped, high confidence, internal) ----
export const SHIPPED: LaneAction[] = [
  {
    id: "ship-1",
    account: "Northwind Logistics",
    csm: "Sara Chen",
    blast: "internal",
    confidence: 96,
    agent: "renewal-risk",
    headline: "Health score: Green → Yellow",
    detail: "Updated Salesforce account health. Logged rationale to internal #cs-northwind.",
    evidence: "\"We're going to need to revisit the seat count before we renew.\" — Procurement, 4/18 QBR, 00:34:12",
    source: "Salesforce · #cs-northwind",
    shippedAt: "7:41a",
  },
  {
    id: "ship-2",
    account: "Halcyon Health",
    csm: "Sara Chen",
    blast: "internal",
    confidence: 94,
    agent: "champion-watch",
    headline: "Next step: \"Confirm exec sponsor by 4/26\"",
    detail: "Created task on the Halcyon account. Assigned to you. Due Friday.",
    evidence: "Champion mentioned VP transition: \"Marcus is moving over to the new product org.\"",
    source: "Salesforce tasks",
    shippedAt: "7:38a",
  },
  {
    id: "ship-3",
    account: "Meridian Retail",
    csm: "Sara Chen",
    blast: "internal",
    confidence: 92,
    agent: "expansion-scout",
    headline: "Logged expansion signal to opportunity",
    detail: "Added \"interest in Tier 3 reporting module\" to the Meridian opp. Notified AE in #cs-meridian.",
    evidence: "\"If you had cohort breakdowns by region, we'd probably double the seats.\"",
    source: "Salesforce opp · Slack",
    shippedAt: "7:22a",
  },
  {
    id: "ship-4",
    account: "Tessera Bank",
    csm: "Marcus Webb",
    blast: "internal",
    confidence: 97,
    agent: "exec-silence",
    headline: "Escalated to manager queue",
    detail: "Exec sponsor hasn't joined a call in 47 days. Flagged in manager review.",
    evidence: "Last exec attendance: 3/2 QBR. Subsequent 3 calls: champion only.",
    source: "Calendar · Gong",
    shippedAt: "7:15a",
  },
  {
    id: "ship-5",
    account: "Blueprint Robotics",
    csm: "Jordan Kim",
    blast: "internal",
    confidence: 91,
    agent: "renewal-risk",
    headline: "Stage: Implementation → Adopted",
    detail: "Adoption thresholds hit across 4 weeks. Stage advanced.",
    evidence: "WAU 78% (target 60%) · 12 of 14 modules in use",
    source: "Salesforce · product telemetry",
    shippedAt: "6:58a",
  },
  {
    id: "ship-6",
    account: "Arbor Energy",
    csm: "Marcus Webb",
    blast: "internal",
    confidence: 93,
    agent: "champion-watch",
    headline: "Slack DM to Marcus: \"Heads up on Arbor renewal\"",
    detail: "Internal note only. Champion paused on roadmap commitments in 4/15 sync.",
    evidence: "\"Let me circle back on the SSO timeline next month.\"",
    source: "Slack DM",
    shippedAt: "6:42a",
  },
];

// ---- Quick review (medium confidence, batched swipe) ----
export const QUICK: LaneAction[] = [
  {
    id: "q-1",
    account: "Quill Media",
    csm: "Sara Chen",
    blast: "internal",
    confidence: 78,
    agent: "renewal-risk",
    headline: "Suggest health: Yellow → Red",
    detail: "Two negative signals this week + champion DM'd \"things have shifted on our side.\"",
    evidence: "\"Things have shifted on our side. Can we push the renewal review?\" — 4/19",
    source: "Slack · Gong",
    arrAtStake: 142000,
  },
  {
    id: "q-2",
    account: "Pelican Foods",
    csm: "Jordan Kim",
    blast: "internal",
    confidence: 72,
    agent: "exec-silence",
    headline: "Flag exec sponsor as at-risk",
    detail: "Two consecutive QBRs missed. Champion attended both.",
    evidence: "QBR attendance: 2/8 ✓, 3/12 ✗, 4/9 ✗",
    source: "Calendar",
    arrAtStake: 89000,
  },
  {
    id: "q-3",
    account: "Northwind Logistics",
    csm: "Sara Chen",
    blast: "customer-facing",
    confidence: 81,
    agent: "champion-watch",
    headline: "Draft: Recap email to champion",
    detail: "3 short paragraphs. Mirrors their language on seat-count concerns.",
    evidence: "\"We need to revisit seat count before we renew.\" — Maria, Procurement",
    source: "Drafted from 4/18 QBR",
    arrAtStake: 184000,
  },
  {
    id: "q-4",
    account: "Meridian Retail",
    csm: "Sara Chen",
    blast: "internal",
    confidence: 74,
    agent: "expansion-scout",
    headline: "Suggest stage: Adopted → Expansion-ready",
    detail: "Cohort feature interest + power-user growth crosses our usual threshold.",
    evidence: "Power-user count: 8 → 23 in 6 weeks · explicit ask for Tier 3",
    source: "Telemetry · 4/16 call",
    arrAtStake: 67000,
  },
  {
    id: "q-5",
    account: "Halcyon Health",
    csm: "Sara Chen",
    blast: "customer-facing",
    confidence: 69,
    agent: "champion-watch",
    headline: "Draft: Warm intro to incoming VP",
    detail: "Short note to Marcus + cc the new VP, framed around continuity.",
    evidence: "\"Marcus is moving over to the new product org.\" — 4/17",
    source: "Gmail draft",
    arrAtStake: 156000,
  },
];

// ---- Judgment lane (low confidence or money) ----
export const JUDGMENT: LaneAction[] = [
  {
    id: "j-1",
    account: "Quill Media",
    csm: "Sara Chen",
    blast: "money",
    confidence: 58,
    agent: "renewal-risk",
    headline: "Offer 10% multi-year discount to lock renewal?",
    detail: "Procurement asked for \"more flexibility on price.\" This is at your discretion + needs manager co-sign over $25k impact.",
    evidence: "\"We're looking at our vendor stack — need more flexibility on price to defend the line item.\" — Maria, 4/19",
    source: "Drafted from 4/19 procurement sync",
    arrAtStake: 142000,
  },
  {
    id: "j-2",
    account: "Tessera Bank",
    csm: "Marcus Webb",
    blast: "customer-facing",
    confidence: 52,
    agent: "exec-silence",
    headline: "Re-engage exec sponsor: which angle?",
    detail: "Three drafts. The agent isn't sure which the sponsor will respond to — pick one or rewrite.",
    evidence: "47 days of exec silence. Last engagement: 3/2 QBR (positive but brief).",
    source: "3 drafts in Gmail",
    arrAtStake: 312000,
  },
  {
    id: "j-3",
    account: "Arbor Energy",
    csm: "Marcus Webb",
    blast: "money",
    confidence: 61,
    agent: "expansion-scout",
    headline: "Quote: Add SSO + audit log tier ($18k uplift)",
    detail: "Champion asked for both in 4/15 sync. Quote drafted, not sent.",
    evidence: "\"If we can get SSO and audit logs in time for the SOC review, we're in good shape.\" — 4/15",
    source: "CPQ quote draft",
    arrAtStake: 78000,
  },
];

// ---- World signals (Watch lane) ----
export const SIGNALS: WorldSignal[] = [
  {
    id: "w-1",
    account: "Northwind Logistics",
    csm: "Sara Chen",
    kind: "champion-change",
    headline: "Champion title changed: \"VP Ops\" → \"Former VP Ops\"",
    detail: "Detected on public LinkedIn. New role not yet listed.",
    detectedAt: "6:12a",
    severity: "high",
    source: "linkedin.com/in/maria-okafor",
    correlatesWith: "4/18 QBR — procurement-led, champion was quiet",
    arrAtStake: 184000,
  },
  {
    id: "w-2",
    account: "Halcyon Health",
    csm: "Sara Chen",
    kind: "acquisition",
    headline: "Acquired by Cerner Health Group",
    detail: "Announced this morning. 73% of accounts acquired by strategics churn within 2 renewals.",
    detectedAt: "5:48a",
    severity: "high",
    source: "Reuters · 4/22",
    correlatesWith: "Champion mentioned a \"strategic conversation\" on 4/12",
    arrAtStake: 156000,
  },
  {
    id: "w-3",
    account: "Quill Media",
    csm: "Sara Chen",
    kind: "layoffs",
    headline: "Announced 8% workforce reduction",
    detail: "Marketing and revenue ops teams named in internal memo (leaked via The Information).",
    detectedAt: "Yesterday, 4:31p",
    severity: "high",
    source: "The Information · 4/21",
    correlatesWith: "Procurement asked for \"price flexibility\" on 4/19",
    arrAtStake: 142000,
  },
  {
    id: "w-4",
    account: "Blueprint Robotics",
    csm: "Jordan Kim",
    kind: "funding",
    headline: "Closed $80M Series C",
    detail: "Led by Sequoia. Press release mentions \"aggressive expansion of engineering org.\"",
    detectedAt: "Yesterday, 11:02a",
    severity: "medium",
    source: "TechCrunch · 4/21",
    correlatesWith: "Power-user growth: 8 → 23 in 6 weeks",
    arrAtStake: 67000,
  },
  {
    id: "w-5",
    account: "Pelican Foods",
    csm: "Jordan Kim",
    kind: "hiring",
    headline: "Hiring \"Salesforce admin with Gainsight experience\"",
    detail: "Job posted 3 days ago. May indicate platform evaluation.",
    detectedAt: "2 days ago",
    severity: "medium",
    source: "linkedin.com/jobs · 4/20",
    arrAtStake: 89000,
  },
];

// ---- Helpers for persona scoping ----
export const CURRENT_CSM = "Sara Chen";

export function forCSM<T extends { csm: string }>(items: T[]): T[] {
  return items.filter((i) => i.csm === CURRENT_CSM);
}
