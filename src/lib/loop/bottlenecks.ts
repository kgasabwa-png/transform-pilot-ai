// Bottlenecks — the manager's unit of work in The Pit.
// Not "coaching moments." Things that are stuck and need a person to
// unblock them. Each one has a one-click action: reassign, escalate,
// teach the agent, override the play.

import type { AgentId } from "./agents";
import { hoursAgo, daysAgo, minutesAgo } from "./time";

export type BottleneckKind =
  | "stalled-motion"     // a save play is pending too long
  | "csm-overloaded"     // a CSM has too many open motions
  | "signal-missed"      // a signal fired but no motion was generated
  | "csm-disagreement";  // CSM's CRM commit disagrees with conversation grade

export type Bottleneck = {
  id: string;
  kind: BottleneckKind;
  detectedAt: Date;
  arrAtStake: number;
  headline: string;       // one sentence the manager reads
  detail: string;         // the why
  csm: string;
  csmInitials: string;
  accountId?: string;
  accountName?: string;
  agent?: AgentId;
  // Available actions for this bottleneck
  actions: BottleneckAction[];
};

export type BottleneckAction = {
  id: string;
  label: string;
  kind: "reassign" | "escalate" | "teach-agent" | "open-motion" | "redistribute";
  shippedCopy: string;    // line shown after the click
  toast: string;          // the success toast
};

export function buildBottlenecks(): Bottleneck[] {
  return [
    {
      id: "b-1",
      kind: "stalled-motion",
      detectedAt: hoursAgo(6),
      arrAtStake: 312000,
      headline:
        "Halcyon save play has sat in Jordan's queue for 6 hours — 41d to renewal, $312k at stake.",
      detail:
        "Drafted at 03:47 this morning. Jordan opened it, didn't ship. The exec-reset email needs to land today or the 14d silence becomes 15d.",
      csm: "Jordan Pace",
      csmInitials: "JP",
      accountId: "halcyon",
      accountName: "Halcyon Health",
      agent: "exec-silence",
      actions: [
        {
          id: "a1",
          label: "Ship it on Jordan's behalf",
          kind: "escalate",
          shippedCopy: "Shipping the save play under your name as backup…",
          toast: "Shipped on Jordan's behalf. Jordan notified.",
        },
        {
          id: "a2",
          label: "Ping Jordan in Slack",
          kind: "escalate",
          shippedCopy: "Sending DM to Jordan…",
          toast: "DM'd Jordan with a link to the motion.",
        },
        {
          id: "a3",
          label: "Open the motion",
          kind: "open-motion",
          shippedCopy: "",
          toast: "",
        },
      ],
    },
    {
      id: "b-2",
      kind: "csm-overloaded",
      detectedAt: hoursAgo(1),
      arrAtStake: 528000,
      headline:
        "Sam is carrying 7 active motions ($528k). Two more landed overnight — likely to drop one.",
      detail:
        "Sam's average ship-time is 4.2h. With 7 in flight, the bottom of the queue won't ship today. Quill ($96k, 11d) and Pelican ($28k) are most likely to slip.",
      csm: "Sam Okafor",
      csmInitials: "SO",
      actions: [
        {
          id: "a1",
          label: "Reassign Pelican to Keila",
          kind: "reassign",
          shippedCopy: "Reassigning Pelican Foods to Keila Ramos…",
          toast: "Pelican now with Keila. Sam + Keila notified.",
        },
        {
          id: "a2",
          label: "Auto-redistribute lowest-priority 2",
          kind: "redistribute",
          shippedCopy: "Redistributing 2 motions to Keila and Maya…",
          toast: "2 motions redistributed. Sam's queue back to 5.",
        },
      ],
    },
    {
      id: "b-3",
      kind: "signal-missed",
      detectedAt: daysAgo(1),
      arrAtStake: 240000,
      headline:
        "Meridian roadmap-dependency signal fired 26h ago and no motion was generated — agent gap.",
      detail:
        "The Renewal-Risk agent flagged Meridian's multi-currency dependency but didn't draft a motion because Product hadn't confirmed a date. That's the wrong threshold — Jordan needed a draft to take to Product, not silence.",
      csm: "Jordan Pace",
      csmInitials: "JP",
      accountId: "meridian",
      accountName: "Meridian Retail",
      agent: "renewal-risk",
      actions: [
        {
          id: "a1",
          label: "Teach Renewal-Risk: draft anyway, don't wait",
          kind: "teach-agent",
          shippedCopy: "Updating Renewal-Risk threshold…",
          toast: "Renewal-Risk will now draft on dependency signals immediately. Jordan also notified.",
        },
        {
          id: "a2",
          label: "Generate the missed motion now",
          kind: "open-motion",
          shippedCopy: "Generating motion…",
          toast: "Motion drafted and pushed to Jordan's queue.",
        },
      ],
    },
    {
      id: "b-4",
      kind: "csm-disagreement",
      detectedAt: hoursAgo(18),
      arrAtStake: 410000,
      headline:
        "Sam has Tessera Bank at Yellow / Commit. Conversation grade says Green / Expand — 32-point gap.",
      detail:
        "The CIO verbalized multi-year + expansion on Nov 1. Sam hasn't moved the CRM. If the forecast goes to the board as Commit, you're missing $410k of upside in your number.",
      csm: "Sam Okafor",
      csmInitials: "SO",
      accountId: "tessera",
      accountName: "Tessera Bank",
      agent: "champion-watch",
      actions: [
        {
          id: "a1",
          label: "Push the conversation grade into the forecast",
          kind: "escalate",
          shippedCopy: "Updating forecast with conversation grade…",
          toast: "Tessera moved to Expand · +$410k in your forecast. Sam notified to confirm.",
        },
        {
          id: "a2",
          label: "Open Tessera motion",
          kind: "open-motion",
          shippedCopy: "",
          toast: "",
        },
      ],
    },
    {
      id: "b-5",
      kind: "csm-overloaded",
      detectedAt: hoursAgo(3),
      arrAtStake: 184000,
      headline:
        "Keila's Northwind motion needs CFO-level approval — she's blocked on you.",
      detail:
        "The save play warms the new CFO directly. Keila wants your signoff on the direct outreach before sending. Sitting in your inbox.",
      csm: "Keila Ramos",
      csmInitials: "KR",
      accountId: "northwind",
      accountName: "Northwind Logistics",
      actions: [
        {
          id: "a1",
          label: "Approve the CFO outreach",
          kind: "escalate",
          shippedCopy: "Approving CFO outreach…",
          toast: "Approved. Keila can ship.",
        },
        {
          id: "a2",
          label: "Reply with edits",
          kind: "escalate",
          shippedCopy: "Opening edit thread…",
          toast: "Edit thread opened with Keila.",
        },
      ],
    },
  ];
}

export type TeamMetrics = {
  motionsInFlight: number;
  motionsShippedToday: number;
  arrShippedToday: number;
  arrAtRisk: number;
  csmCapacity: { name: string; initials: string; load: number; capacity: number }[];
};

export function buildTeamMetrics(): TeamMetrics {
  return {
    motionsInFlight: 17,
    motionsShippedToday: 23,
    arrShippedToday: 1_240_000,
    arrAtRisk: 1_870_000,
    csmCapacity: [
      { name: "Sam Okafor", initials: "SO", load: 7, capacity: 5 },
      { name: "Jordan Pace", initials: "JP", load: 4, capacity: 5 },
      { name: "Keila Ramos", initials: "KR", load: 3, capacity: 5 },
      { name: "Maya Chen", initials: "MC", load: 2, capacity: 5 },
    ],
  };
}
