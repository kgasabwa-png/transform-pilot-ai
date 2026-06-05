// The agent layer. Receipts isn't a dashboard — it's a team of
// specialist agents that worked your book overnight and left you a
// 90-second morning brief. This file models that team and the
// stream of work they did since the CSM logged off.

export type AgentId = "champion-watch" | "renewal-risk" | "expansion-scout" | "exec-silence";

export type Agent = {
  id: AgentId;
  name: string;
  role: string;
  charter: string;
  status: "working" | "standby" | "queued";
  nowDoing: string;
  watching: number; // accounts under watch
  completedToday: number;
  flagged: number;
};

export const AGENTS: Agent[] = [
  {
    id: "champion-watch",
    name: "Champion-Watch",
    role: "Stakeholder graph",
    charter: "Detects champion changes, economic-buyer shifts, and exec departures across calls, Slack, and email — before LinkedIn does.",
    status: "working",
    nowDoing: "Cross-checking Quill org chart against last 30d of meeting attendees.",
    watching: 24,
    completedToday: 6,
    flagged: 2,
  },
  {
    id: "renewal-risk",
    name: "Renewal-Risk",
    role: "Forecast officer",
    charter: "Re-scores every renewal nightly from raw conversation evidence and writes the brief your VP reads at 7:42a.",
    status: "working",
    nowDoing: "Drafting QBR risk memo for Halcyon Health · 41d to renewal.",
    watching: 47,
    completedToday: 12,
    flagged: 3,
  },
  {
    id: "expansion-scout",
    name: "Expansion-Scout",
    role: "Quiet wins desk",
    charter: "Surfaces accounts where adoption looks flat but the customer is privately standardizing on you. Flags for proposal, not for save.",
    status: "working",
    nowDoing: "Pulling procurement signal from Blueprint Slack-connect channel.",
    watching: 31,
    completedToday: 4,
    flagged: 1,
  },
  {
    id: "exec-silence",
    name: "Exec-Silence",
    role: "Re-engagement",
    charter: "Watches for sponsors going dark across all surfaces and drafts the exec-to-exec note before the silence becomes a non-renewal.",
    status: "standby",
    nowDoing: "Waiting on response window · 3 drafts queued for human review.",
    watching: 18,
    completedToday: 5,
    flagged: 2,
  },
];

// The overnight feed. What the agents did between 6:14p yesterday and
// 7:42a today. This is the "live mode" the CSM scrolls while their
// coffee brews. Times in absolute local strings to feel real.
export type FeedEvent = {
  id: string;
  at: string; // "06:18a"
  agent: AgentId;
  account?: string;
  verb: string;
  detail: string;
  weight: "info" | "warn" | "danger" | "win";
  citation?: string;
};

export const OVERNIGHT_FEED: FeedEvent[] = [
  {
    id: "f-12",
    at: "07:41a",
    agent: "renewal-risk",
    account: "Halcyon Health",
    verb: "drafted exec-reset email",
    detail: "Re-positioned around clinical-ops outcome Devin already cares about. Awaiting your edit.",
    weight: "warn",
    citation: "from 4 prior threads",
  },
  {
    id: "f-11",
    at: "07:33a",
    agent: "champion-watch",
    account: "Northwind Logistics",
    verb: "confirmed economic-buyer shift",
    detail: "New CFO Renee Okafor flagged from 2 separate call mentions and a LinkedIn role change.",
    weight: "danger",
    citation: "QBR · Oct 24, 14:06",
  },
  {
    id: "f-10",
    at: "06:58a",
    agent: "expansion-scout",
    account: "Blueprint Robotics",
    verb: "promoted from 'risk' to 'expand'",
    detail: "Procurement reached out re: standardizing across Phoenix and Austin. Renewal is a foregone conclusion.",
    weight: "win",
    citation: "Slack · #blueprint-internal",
  },
  {
    id: "f-9",
    at: "06:14a",
    agent: "exec-silence",
    account: "Pelican Foods",
    verb: "raised acquisition-risk flag",
    detail: "Founder asked twice in 30d about contract assignability. Pre-built assignment paperwork in shared drive.",
    weight: "warn",
    citation: "Email · Nov 4",
  },
  {
    id: "f-8",
    at: "03:21a",
    agent: "renewal-risk",
    account: "Quill Media",
    verb: "downgraded score 58 → 22",
    detail: "Procurement BCC'd us competitor's RFP rubric 14d ago. Champion has missed 2 QBRs.",
    weight: "danger",
    citation: "Email · Oct 28",
  },
  {
    id: "f-7",
    at: "02:47a",
    agent: "champion-watch",
    account: "Tessera Bank",
    verb: "verified renewal intent",
    detail: "CIO sync transcript: 'You're table stakes. Let's talk multi-year with expanded footprint.'",
    weight: "win",
    citation: "Call · Nov 1",
  },
  {
    id: "f-6",
    at: "01:09a",
    agent: "renewal-risk",
    account: "Meridian Retail",
    verb: "raised roadmap-dependency",
    detail: "Q1 EU launch is timed to multi-currency GA. Product hasn't confirmed the date in writing.",
    weight: "warn",
    citation: "Roadmap review · Oct 19",
  },
  {
    id: "f-5",
    at: "11:42p",
    agent: "expansion-scout",
    account: "Arbor Energy",
    verb: "blocked save-motion",
    detail: "Adoption drop is a reorg, not a defection. New lead booked re-onboarding. Re-baseline in 30d.",
    weight: "info",
    citation: "Email · Oct 20",
  },
  {
    id: "f-4",
    at: "10:11p",
    agent: "exec-silence",
    account: "Halcyon Health",
    verb: "flagged 14d sponsor silence",
    detail: "Three follow-ups to Devin since Marie's departure. Zero replies. Escalation drafted.",
    weight: "danger",
    citation: "Email thread · Nov 3",
  },
];

export const AGENT_OUTCOMES = {
  signalsProcessed: 4128,
  conversationsRead: 247,
  briefsDrafted: 12,
  surfacesScanned: ["Zoom", "Gong", "Slack", "Gmail", "HubSpot", "Salesforce"],
  hoursOfWork: 14,
  pagesOfReading: 312,
} as const;
